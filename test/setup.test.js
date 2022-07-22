process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const app = require('../app');
const axios = require('axios');

chai.use(chaiHttp);

describe('Setup API', () => {
  it('Test the welcome API route to see if the basic setup is working...', done => {
    chai
      .request(app)
      .get('/welcome')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        expect(res.body.message).to.equal(
          'Welcome to SPREADIT! I will get that job at Buda and will thrive as a programmer in there.'
        );
        done();
      });
  });

  it('Check a non-existing route of the api to see if I get the undefined 404...', done => {
    chai
      .request(app)
      .get('/aloja')
      .end(async (err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
