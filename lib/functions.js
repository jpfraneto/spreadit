const axios = require('axios');
const functions = {};

const calculateSpread = market => {
  let spreadValue = Number(market.min_ask[0]) - Number(market.max_bid[0]);
  if (spreadValue > 1) spreadValue = Math.floor(spreadValue).toString();
  else spreadValue = spreadValue.toFixed(8);
  return spreadValue;
};

functions.fetchBudaForMarketsInfo = async () => {
  const response = await axios.get(`https://www.buda.com/api/v2/markets`);
  const { markets } = response.data;
  markets.forEach(market => {
    delete market.disabled;
    delete market.illiquid;
    delete market.rpo_disabled;
    delete market.max_orders_per_minute;
    delete market.maker_discount_percentage;
    delete market.taker_discount_percentage;
    delete market.taker;
  });
  return markets;
};

functions.fetchBudaForMarketInfo = async id => {
  const response = await axios.get(
    `https://www.buda.com/api/v2/markets/${id}/ticker.json`
  );
  const marketInfo = response.data.ticker;
  return marketInfo;
};

functions.fetchBudaForSpreadInfo = async () => {
  const responseMarkets = await axios.get(
    `https://www.buda.com/api/v2/markets`
  );
  const budaMarkets = responseMarkets.data.markets;
  const response = await Promise.all(
    budaMarkets.map(market => {
      return axios.get(
        `https://www.buda.com/api/v2/markets/${market.id}/ticker.json`
      );
    })
  );

  const marketsInfo = response.map(market => market.data.ticker);
  const marketsSpreads = marketsInfo.map(market => {
    let spreadValue = calculateSpread(market);
    return {
      id: market.market_id,
      spread: [spreadValue, market.min_ask[1]],
      volume: market.volume,
    };
  });
  return { spreads: marketsSpreads };
};

functions.fetchBudaForIndividualSpreadInfo = async marketId => {
  const response = await axios.get(
    `https://www.buda.com/api/v2/markets/${marketId}/ticker.json`
  );
  const marketInfo = response.data.ticker;
  let spreadValue = calculateSpread(marketInfo);
  let unitOfAccount = marketInfo.min_ask[1];
  return {
    market_id: marketInfo.market_id,
    spread: [spreadValue, unitOfAccount],
    volume: marketInfo.volume,
  };
};

module.exports = functions;
