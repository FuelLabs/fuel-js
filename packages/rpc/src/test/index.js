const { test, utils } = require('@fuel-js/environment');
const Api = require('../index');

module.exports = test('rpc', async t => {
  try {

    const api = new Api('rinkeby');

    t.ok(await api.getState(), 'get state');
    t.ok(await api.getBlockByHeight(0), 'block by height');
    t.ok(await api.getTokenId(utils.emptyAddress), 'token id');
    t.ok(await api.getToken(1), 'token address');
    t.ok(await api.getAddress(0), 'address registered');
    t.ok(await api.getState(), 'get state');
    t.ok(await api.getTokenMetadata(1), 'get token');

  } catch (testError) { throw new utils.ByPassError(testError); }
});
