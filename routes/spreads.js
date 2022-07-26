let express = require('express');
let router = express.Router();
const functions = require('../lib/functions');
const data = require('../data/markets');

let subscribers = Object.create(null);
let requestCounter = 0;
let responses = {};
const alertas = {};

router.get('/', async (req, res) => {
  let spreads = req.app.get('spreads');
  try {
    res.status(200).json(spreads);
  } catch (error) {
    console.log('inside the spreads route, the error is: ', error);
    res.status(500).json({ message: 'Not found', code: 'not_found' });
  }
});

router.post('/', async (req, res) => {
  let spreads = req.app.get('spreads');
  if(!spreads) await setTimeout(null,2000);
  const filtered = spreads.marketsSpreads.filter(x=>req.body.markets.includes(x.id.toLowerCase()))
  try {
    res.status(200).json({spreads:filtered});
  } catch (error) {
    console.log('inside the spreads route, the error is: ', error);
    res.status(500).json({ message: 'Not found', code: 'not_found' });
  }
});

const EventEmitter = require('../event');
const eventEmitter = new EventEmitter();

router.get('/pooling', (req, res) => {
  const id = Date.now().toString(); // milliseconds of now will be fine for our case
  var timer = null;
  const handler = function (event) {
    console.log('INSIDE THE HANDLER');
    clearTimeout(timer);
    console.log('event', event);
    res.status(201);
    res.end(JSON.stringify(event));
  };

  eventEmitter.register(id, handler);
  timer = setTimeout(function () {
    console.log('timeout');
    const wasUnregistered = eventEmitter.unregister(id);
    console.log('wasUnregistered', wasUnregistered);
    if (wasUnregistered) {
      res.status(200);
      res.end();
    }
  }, 5000);
});

router.get('/:marketid', async (req, res) => {
  let spreads = req.app.get('spreads');
  console.log('IN HERE!, THE MARKET ID IS: ', req.params.marketid);
  console.log('and the spreads array is: ', spreads)
  try {
    const spreadIndex = spreads.marketsSpreads.findIndex(x=>x.id.toLowerCase() === req.params.marketid);
    const marketSpread = spreads.marketsSpreads[spreadIndex]
    res.status(200).json(marketSpread);
  } catch (error) {
    console.log('the error is: ', error);
    res.status(500).json({ message: 'Not Found', code: 'not_found' });
  }
});

router.post('/:marketid', async (req, res) => {
  let alertas = req.app.get('alertas');
  let spottedMarkets = req.app.get('spottedMarkets');

  if (!spottedMarkets[req.params.marketid]) {
    spottedMarkets[req.params.marketid] = {};
  }

  const newAlert = {
    alert_setup: new Date().getTime(),
    prize_alert: req.body.prize_alert,
    triggering: req.body.triggering,
    comparer: req.body.comparer,
  };
  if (!alertas[req.body.username]) {
    alertas[req.body.username] = [newAlert];
  } else {
    alertas[req.body.username].push(newAlert);
  }
  let marketSpreadValue;
  const timer = setInterval(async () => {
    marketSpreadValue = spottedMarkets[req.params.marketid].spread;
    if (req.body.comparer === 'mayor') {
      if (marketSpreadValue > req.body.prize_alert) {
        clearInterval(timer);
        res.status(200);
        res.json({
          message: 'el spread del mercado fue mayor que el de alerta!',
        });
        res.end();
      }
    } else if (req.body.comparer === 'menor') {
      console.log('inside the menor route');
      if (marketSpreadValue < req.body.prize_alert) {
        clearInterval(timer);
        res.status(200);
        res.json({
          message: 'el spread del mercado fue menor que el de alerta!',
        });
        res.end();
      }
    }
  }, 1000);
});

router.get('/:marketid/:frequence', async (req, res) => {
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const marketId =
      data.marketIds.indexOf(req.params.marketid.toUpperCase()) > -1
        ? req.params.marketid
        : null;
    if (!marketId)
      return res.status(404).json({ message: 'Invalid market id' });
    const frequence = Number(req.params.frequence.match(/^[0-9]*/)[0]);
    if (!frequence)
      return res.status(404).json({
        message:
          'Invalid frequence of pooling. The route you are calling should be in the form of /api/spreads/<market_id>/<frequency>, where the frequency parameter is the amount of ms between calls in the pooling',
      });
    if (frequence < 55)
      return res.status(404).json({
        message:
          'With such a low frequency you will burn our servers and we will get banned from buda.com. Please increase the frequence of pooling :)',
      });
    let market = await functions.fetchBudaForIndividualSpreadInfo(marketId);
    let baseSpread, newSpread;
    baseSpread = Number(market.spread[0]);

    let ansObj = {
      minSpread: baseSpread,
      maxSpread: baseSpread,
      spreadComparison: 'initial',
      timestamp: new Date().getTime(),
      spread: baseSpread,
    };
    res.write(JSON.stringify(ansObj));

    setTimeout(async function run() {
      market = await functions.fetchBudaForIndividualSpreadInfo(
        req.params.marketid
      );
      newSpread = Number(market.spread[0]);

      ansObj.spread = newSpread;
      ansObj.timestamp = new Date().getTime();

      if (baseSpread < newSpread) {
        ansObj.spreadComparison = 'mayor';
        if (ansObj.maxSpread < newSpread) {
          ansObj.maxSpread = newSpread;
          ansObj.extremePoint = true;
        }
      } else if (newSpread < baseSpread) {
        ansObj.spreadComparison = 'menor';
        if (newSpread < ansObj.minSpread) {
          ansObj.minSpread = newSpread;
          ansObj.extremePoint = true;
        }
      } else if (baseSpread === newSpread) ansObj.spreadComparison = 'igual';

      res.write(JSON.stringify(ansObj));
      delete ansObj.extremePoint;
      setTimeout(run, frequence);
    }, frequence);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An error ocurred' });
  }
});

module.exports = router;
