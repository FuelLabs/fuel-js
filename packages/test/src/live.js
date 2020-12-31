const { test, utils } = require('@fuel-js/environment');
const Api = require('@fuel-js/api');

module.exports = test('api', async t => {
  try {
    const api = new Api('unspecified');

    t.ok(await api.getState(), 'get state');
    t.ok(await api.getBlockByHeight(0), 'block by height');
    t.ok(await api.getTokenId(utils.emptyAddress), 'token id');
    t.ok(await api.getToken(1), 'token address');
    t.ok(await api.getAddress(0), 'address registered');
    t.ok(await api.getState(), 'get state');
    // t.ok(await api.getTokenMetadata(1), 'get token');

    const balance = await api.getBalance(
      '0x19148d0a7ae99f19bc3862857318a7f80f96564c'
      , 0
    );

    t.ok(balance, 'balance');
  } catch (err) {
      console.log(err);
  }
});