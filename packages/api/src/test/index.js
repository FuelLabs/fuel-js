const { test, utils } = require('@fuel-js/environment');
const interface = require('@fuel-js/interface');
const Api = require('../index');

module.exports = test('api', async t => {
  try {

    const api = new Api('rinkeby');

    t.ok(await api.getBlockByHeight(0), 'block by height');
    t.ok(await api.getBlockByHeight(5), 'block by height');
    t.ok(await api.getBlockByHeight(10), 'block by height');

    const tx = await api.getTransactionByHash('0x87195fd8eba32a1d363f85551c7a3ca1d9ab27cd64746c0eadd1f7ad37f31c77');

    t.ok(tx, 'tx by hash');

    t.ok(await api.getAssets('0x87065ef77dd63220c0bf30cb6f322646bb9659e5'));

    t.ok(await api.getBalance('0x87065ef77dd63220c0bf30cb6f322646bb9659e5', 1));

    t.ok(await api.getHistory('0x9818d93e28796e7af47a61875f5d277f0d57ead5'));

    t.ok(await api.getHistory('0x9818d93e28796e7af47a61875f5d277f0d57ead5', { include: true }));

    const { history } = await api.getProfile('0x9818d93e28796e7af47a61875f5d277f0d57ead5');

    history.map(tx => console.log(new Date(tx.timestamp.toNumber())));

    t.ok(await api.getTokenId(utils.emptyAddress), 'token id');

    t.ok(await api.getToken(1), 'token address');

    t.ok(await api.getAddress(0), 'address registered');

    t.ok(await api.getState(), 'get state');

    t.equal(await api.getReturn('0x184681347bc6f928228c2dd7b97f9847ca218ca29bc06a38317deab5801ca114', 2), '0xdeafbeef', 'return data');

  } catch (testError) { throw new utils.ByPassError(testError); }
});
