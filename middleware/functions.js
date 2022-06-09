const axios = require('axios');
const { MongoClient, ServerApiVersion } = require('mongodb');
const functions = {};
const data = require('../data/markets');

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

functions.getSpreads = async (dayIdentifier, dbo) => {
  const newSpreadDatapoints = await fetchBudaForSpreadInfo();
  const dbresponse = await dbo
    .collection('spread-points')
    .updateOne(
      { dayIdentifier },
      { $push: { datapoints: newSpreadDatapoints } }
    );
};

const fetchBudaForSpreadInfo = async () => {
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
  return { datapoints: resp, timestamp: new Date().getTime() };
};

module.exports = functions;
