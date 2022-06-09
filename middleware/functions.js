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

// functions.getSpreads = async (dayIdentifier, dbo) => {
//   const newSpreadDatapoints = await fetchBudaForSpreadInfo();
//   const dbresponse = await dbo
//     .collection('spread-points')
//     .updateOne(
//       { dayIdentifier },
//       { $push: { datapoints: newSpreadDatapoints } }
//     );
// };

functions.fetchBudaForSpreadInfo = async () => {
  const response = await Promise.all(
    data.marketIds.map(id => {
      return axios.get(`https://www.buda.com/api/v2/markets/${id}/ticker.json`);
    })
  );

  const marketsInfo = response.map(x => x.data.ticker);
  const markets = marketsInfo.map(x => {
    return {
      id: x.market_id,
      spread: [
        (Number(x.min_ask[0]) - Number(x.max_bid[0])).toFixed(8),
        x.min_ask[1],
      ],
      volume: x.volume,
      // price_variation_24h: x.price_variation_24h,
      // price_variation_7d: x.price_variation_7d,
    };
  });
  return { markets };
};

functions.fetchBudaForIndividualSpreadInfo = async marketId => {
  try {
    const response = await axios.get(
      `https://www.buda.com/api/v2/markets/${marketId}/ticker.json`
    );

    const marketInfo = response.data.ticker;
    let spreadValue =
      Number(marketInfo.min_ask[0]) - Number(marketInfo.max_bid[0]);
    console.log('the spread value is: ', spreadValue.toFixed(8));
    if (spreadValue > 1) spreadValue = Math.floor(spreadValue).toString();
    else spreadValue = spreadValue.toFixed(8);
    return {
      id: marketInfo.market_id,
      spread: [spreadValue, marketInfo.min_ask[1]],
      volume: marketInfo.volume,
      // price_variation_24h: x.price_variation_24h,
      // price_variation_7d: x.price_variation_7d,
    };
  } catch (error) {
    console.log('the error is: 0', error);
    return { message: 'Not Found', code: 'Not Found' };
  }
};

module.exports = functions;
