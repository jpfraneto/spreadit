require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const data = require('./data/markets');
const client = require('./lib/mongodb');

// const { MongoClient, ServerApiVersion } = require('mongodb');
//
// const uri = process.env.MONGODB_URI;
//
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverApi: ServerApiVersion.v1,
// });

const marketsRoutes = require('./routes/markets');
const spreadsRoutes = require('./routes/spreads');
const userRoutes = require('./routes/u');

const functions = require('./lib/functions');

let alertas = {};
let spottedMarkets = {};
let markets = data.marketIds;
let counter = 0;

app.use(function (req, res, next) {
  req.id = crypto.randomBytes(4).toString('hex');
  next();
});
app.use(cors());
app.use(express.json());
app.use('/favicon.ico', express.static('images/favicon.ico'));
app.set('view engine', 'ejs');
app.set('alertas', alertas);
app.set('spottedMarkets', spottedMarkets);
app.set('client', client);
app.set('markets', markets);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.status(200).render('landing');
});

app.get('/welcome', (req, res) => {
  res.status(200).send({
    message:
      'Welcome to SPREADIT! I will get that job at Buda and will thrive as a programmer in there.',
  });
});

app.use('/api/markets', marketsRoutes);
app.use('/api/spreads', spreadsRoutes);
app.use('/api/u', userRoutes);

// async function getMarkets() {
//   const budaResponse = await axios.get('https://www.buda.com/api/v2/markets');
//   markets = budaResponse.data.markets.map(market => {
//     return market.name;
//   });
//   app.set('markets', markets);
//   getMarketSpreads();
//   let timerId = setInterval(getMarketSpreads, 20000);
// }
// getMarkets();

async function getMarketSpreads() {
  try {
    const response = await Promise.all(
      markets.map(market => {
        return axios.get(
          `https://www.buda.com/api/v2/markets/${market}/ticker.json`
        );
      })
    );
    const marketsInfo = response.map(market => market.data.ticker);
    const marketsSpreads = marketsInfo.map(market => {
      let spreadValue = functions.calculateSpread(market);
      return {
        id: market.market_id,
        spread: [spreadValue, market.min_ask[1]],
        volume: market.volume,
      };
    });
    let spreads = { spreads: marketsSpreads, timestamp: new Date().getTime() };
    app.set('spreads', spreads);
    functions.checkAllActiveAlerts(spreads);
    // This is for saving the spreads in the DB
    // await client.connect();
    // if(counter===100) {
    //   counter = 0;
    // };
    // await Promise.all(spreads.marketsSpreads.map(spread=> {
    //   return client.db('spreads-history').collection(spread.id.toLowerCase()).insertOne({timestamp:spreads.timestamp, spread:spread.spread[0], spreadUnit:spread.spread[1]})
    // }))
    // counter++
  } catch (error) {
    console.log('there was an error', error);
  }
}

getMarketSpreads();
const spreadsIntervalId = setInterval(getMarketSpreads, 30000);

//This should only be ran if the spotted markets object is non empty. If it is empty, there is no need for it to run.
// setInterval(async () => {
//   //calculate the spreads of spotted markets
//   const now = new Date().getTime();
//   if (
//     spottedMarkets && // 👈 null and undefined check
//     Object.keys(spottedMarkets).length === 0 &&
//     Object.getPrototypeOf(spottedMarkets) === Object.prototype
//   )
//     return;
//   for (const key in spottedMarkets) {
//     if (key) {
//       marketSpreadObject = await functions.fetchBudaForIndividualSpreadInfo(
//         key
//       );
//       marketSpreadValue = Number(marketSpreadObject.spread[0]);
//       spottedMarkets[key] = {
//         timestamp: now,
//         spread: marketSpreadValue,
//       };
//     }
//   }
// }, 1000);

app.get('/api/*', (req, res) => {
  res.status(404).json({
    message:
      'That route does not have information at this moment. If you want me to add something, please write me an email to jp@theopensourcefactory.com, or just contribute on Github: https://github.com/jpfraneto/spreadit',
  });
});

app.get('/*', (req, res) => {
  res.status(404).json({
    message:
      'This is the API for spreadit. Check out the docs at docs.spreadit.pro',
  });
});

const port = process.env.PORT || 3001;

var server = app.listen(port, () => {
  var host = server.address().address;
  var puerto = server.address().port;
  console.log(
    `The spreadit server is listening at port: ${puerto}, with host: ${host}`
  );
});

module.exports = app;
