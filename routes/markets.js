let express = require('express');
let router = express.Router();
const functions = require('../lib/functions');
const data = require('../data/markets');

router.get('/', async (req, res) => {
  try {
    const markets = await functions.fetchBudaForMarketsInfo();
    console.log('IN HERE, THE MARKETS ARE: ', markets);
    res.status(200).json({ markets });
  } catch (error) {
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
