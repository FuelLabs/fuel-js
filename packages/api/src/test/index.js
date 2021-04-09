const { test, utils } = require('@fuel-js/environment');
const Api = require('../index');

const { outputs } = require('@fuel-js/protocol'); 
const ethers = require('ethers');

module.exports = test('api', async t => {
  try {

    const api = new Api('mainnet', {
      // url: 'http://localhost:3000',
    });

    t.ok(await api.getState(), 'get state');
    t.ok(await api.getBlockByHeight(0), 'block by height');
    t.ok(await api.getTokenId(utils.emptyAddress), 'token id');
    t.ok(await api.getToken(1), 'token address');
    t.ok(await api.getAddress(0), 'address registered');
    t.ok(await api.getState(), 'get state');
    t.ok(await api.getTokenMetadata(1), 'get token');

    /*
    const balance = await api.getBalance(
      '0x19148d0a7ae99f19bc3862857318a7f80f96564c'
      , 1
    );
    t.ok(balance, 'balance');

    console.log('balance 1', balance);

    console.log('token id', await api.getTokenId('0x5bc7e5f0ab8b2e10d2d0a3f21739fce62459aef3'));
    */

   const api2 = new Api('mainnet', {
    });
    const userProfile = await api2.getProfile('0x8328d1693d693130f141812b5fa3e46602abcb45');
    const firstTransactionId = userProfile.history[0].transactionId;
    const firstTransaction = await api.getTransactionByHash(firstTransactionId);
    const lastOutput = firstTransaction.outputs[2];
    const returnData = lastOutput;

    console.log('return data', returnData.properties.data().hex());
    
    return;

    const _profile = await api.getProfile('0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C');
    t.ok(_profile, 'profile');

    console.log(_profile);

    console.log(await api.getAccount('0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C'));

    return;

    t.ok(await api.getBlockByHeight(5), 'block by height');
    t.ok(await api.getBlockByHeight(10), 'block by height');

    const tx = await api.getTransactionByHash('0x87195fd8eba32a1d363f85551c7a3ca1d9ab27cd64746c0eadd1f7ad37f31c77');

    t.ok(tx, 'tx by hash');

    const depositProfile = await api.getProfile('0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e');

    console.log(depositProfile);

    const profile = await api.getProfile('0x0ea6b5edc8905c85514b3676703f1bfe6ec260ad');

    // const profile2 = await api.getProfile('0x87065ef77dd63220c0bf30cb6f322646bb9659e5');

    // console.log(profile2.history);

    t.ok(profile);

    t.ok(await api.getTokenId(utils.emptyAddress), 'token id');

    t.ok(await api.getToken(1), 'token address');

    t.ok(await api.getAddress(0), 'address registered');

    t.ok(await api.getState(), 'get state');

    t.equal(await api.getReturn('0x184681347bc6f928228c2dd7b97f9847ca218ca29bc06a38317deab5801ca114', 2), '0xdeafbeef', 'return data');

  } catch (testError) { throw new utils.ByPassError(testError); }
});
