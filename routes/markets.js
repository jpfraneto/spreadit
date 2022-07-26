let express = require('express');
let router = express.Router();
const functions = require('../lib/functions');
const data = require('../data/markets');

router.get('/', async (req, res) => {
  console.log('inside the markets route', data)
  try {
    // const markets = await functions.fetchBudaForMarketsInfo();
    res.status(200).json({ markets: data.marketIds });
  } catch (error) {
    console.log('the error is: ', error);
    res.status(500).json({ message: 'Not found', code: 'not_found' });
  }
});

router.get('/:market_id', async (req, res) => {
  try {
    const marketInfo = await functions.fetchBudaForMarketInfo(
      req.params.market_id
    );
    res.status(200).json(marketInfo);
  } catch (error) {
    res.status(500).json({ message: 'Not found', code: 'not_found' });
  }
});

module.exports = router;
