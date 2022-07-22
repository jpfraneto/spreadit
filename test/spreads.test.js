process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const app = require('../app');
const axios = require('axios');

chai.use(chaiHttp);

describe('Spreads API', () => {
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

  it('Check if the amount of spreads that the route sends back is equal to the amount of markets in buda...', done => {
    chai
      .request(app)
      .get('/spreads')
      .end(async (err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.spreads.should.be.a('array');
        expect(res.body.spreads.length).to.be.equal(budaMarkets.length);
        done();
      });
  });

  it('Check an individual random spread value...', done => {
    let randomMarketIndex = Math.floor(Math.random() * marketIds.length);
    let randomMarketId = marketIds[randomMarketIndex];
    chai
      .request(app)
      .get('/spreads/' + randomMarketId)
      .end(async (err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('spread');
        res.body.should.have.property('volume');
        res.body.should.have.property('market_id');
        expect(res.body.market_id.toLowerCase()).to.be.equal(
          randomMarketId.toLowerCase()
        );
        done();
      });
  });

  it('Check the spread data if market does not exist...', done => {
    chai
      .request(app)
      .get('/spreads/eur-clp')
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.be.a('object');
        expect(res.body.code).to.be.equal('not_found');
        done();
      });
  });

  it('Check the response for the pooling part...', done => {
    chai
      .request(app)
      .get('/spreads/eur-clp')
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.be.a('object');
        expect(res.body.code).to.be.equal('not_found');
        done();
      });
  });
});
