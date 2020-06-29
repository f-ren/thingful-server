const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Things Endpoints', function () {
  let db;

  const { testUsers, testThings, testReviews } = helpers.makeThingsFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('protected endpoints', () => {
    beforeEach('insert articles', () =>
      helpers.seedThingsTables(db, testUsers, testThings, testReviews)
    );
    describe(`GET /api/things/:thing_id`, () => {
      it(`responds with 401 'missing basic auth' when no bearer token`, () => {
        return supertest(app)
          .get(`/api/things/1`)
          .expect(401, { error: `Missing bearer token` });
      });
      it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
        const validUser = testUsers[0];
        const invalidSecret = 'bad-secret';
        return endpoint
          .method(endpoint.path)
          .set(
            `Authorization`,
            helpers.makeAuthHeader(validUser, invalidSecret)
          )
          .expect(401, { error: `Unauthorized request` });
      });
      it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
        const userInvalidCreds = { user_name: 'user-not', password: 'existy' };
        const invalidUser = { user_name: 'user-not-existy', id: 1 };

        return endpoint
          .method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: `Unauthorized request` });
      });
    });
  });