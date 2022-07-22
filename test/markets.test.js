process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const app = require('../app');
const axios = require('axios');

chai.use(chaiHttp);

describe('Markets API', () => {
  let budaMarkets;
  let marketIds;

  before(() => {
    return new Promise(async resolve => {
      const budaResponse = await axios.get(
        'https://www.buda.com/api/v2/markets'
      );
      budaMarkets = budaResponse.data.markets;
      marketIds = budaMarkets.map(market => market.id);
      resolve();
    });
  });

  it('Check if all the number of markets that I get from the API are the same as the ones that the buda api sends back...', done => {
    chai
      .request(app)
      .get('/markets')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.markets.should.be.a('array');
        const spreaditMarkets = res.body.markets;
        expect(spreaditMarkets.length).to.be.equal(budaMarkets.length);
        done();
      });
  });

  it('Check the data from a particular random market...', done => {
    let randomMarketIndex = Math.floor(Math.random() * marketIds.length);
    let randomMarketId = marketIds[randomMarketIndex];
    chai
      .request(app)
      .get('/markets/' + randomMarketId.toLowerCase())
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('market_id');
        res.body.should.have.property('last_price');
        res.body.should.have.property('min_ask');
        res.body.should.have.property('max_bid');
        res.body.volume[0].should.be.a('string');
        expect(res.body.market_id.toLowerCase()).to.be.equal(
          randomMarketId.toLowerCase()
        );
        done();
      });
  });

  it('Check the data if market does not exist...', done => {
    chai
      .request(app)
      .get('/markets/eur-clp')
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.be.a('object');
        expect(res.body.code).to.be.equal('not_found');
        done();
      });
  });
});
