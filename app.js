require('dotenv').config();

const express = require('express');
const app = express();
const axios = require('axios').default;
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

app.get('/', (req, res) => {
  res.render('landing', { home: { aloja: 46 }, marketIds: data.marketIds });
});

app.get('/testing', (req, res, next) => {
  console.log('out of the client');
});

app.get('/date', (req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  connections.push(res);
});

app.get('/api', async (req, res, next) => {
  try {
    const response = await Promise.all(
      data.marketIds.map(id =>
        axios.get(`https://www.buda.com/api/v2/markets/${id}/ticker.json`)
      )
    );
    const marketsInfo = response.map(x => x.data.ticker);
    const resp = marketsInfo.map(x => {
      return {
        id: x.market_id,
        spread: [
          Math.floor(Number(x.min_ask[0]) - Number(x.max_bid[0])),
          x.min_ask[1],
        ],
        volume: x.volume,
        price_variation_24h: x.price_variation_24h,
        price_variation_7d: x.price_variation_7d,
      };
    });
    res.json({
      data: { timestamp: new Date().getTime(), markets_ticker: resp },
    });
  } catch (error) {
    console.log('there was an error');
    console.log(error);
  }
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

app.post('/api/spreads/:marketid', async (req, res) => {
  console.log('here is where the pooling will take place');
  res.json({ 123: 456 });
});

app.get('/api/testing', (req, res) => {
  res.json({ 123: 456 });
});

let tick = 0;

setTimeout(function run() {
  if (++tick > LIMIT) {
    connections.map(res => {
      res.write('END\n');
      res.end();
    });
    connections = [];
    tick = 0;
  }
  connections.map((res, i) => {
    res.write(`Hello ${i}! Tick: ${tick} \n`);
  });
  setTimeout(run, DELAY);
}, DELAY);

const port = 3000;
app.listen(process.env.PORT || port, () => {
  console.log(`Express server listening at ${port}`);
});
