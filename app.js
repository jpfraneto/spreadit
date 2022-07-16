require('dotenv').config();

const express = require('express');
const app = express();
const axios = require('axios').default;
const path = require('path');
const cors = require('cors');
const data = require('./data/markets');
const { MongoClient, ServerApiVersion } = require('mongodb');
const functions = require('./middleware/functions');

app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let connections = [];
const LIMIT = 20;
const DELAY = 1000;
let now = new Date();
let dayIdentifier = now.getFullYear() + now.getDate() + now.getMonth();
let prevDayIdentifier = now.getFullYear() + now.getDate() + now.getMonth();

app.get('/api/markets', (req, res) => {
  res.json({ markets: data.marketIds });
});

app.get('/api/spreads', async (req, res) => {
  const spreads = await functions.fetchBudaForSpreadInfo();
  res.json(spreads);
});

app.get('/api/spreads/:marketid', async (req, res) => {
  const market = await functions.fetchBudaForIndividualSpreadInfo(
    req.params.marketid
  );
  res.json({ market });
});

app.get('/api/spreads/:marketid/:frequence', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  connections.push(res);

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

app.get('/*', (req, res) => {
  res.render('landing', { marketIds: data.marketIds });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express server listening at ${port}`);
});
