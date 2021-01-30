const { test, utils } = require('@fuel-js/environment');
const protocol = require('@fuel-js/protocol2');
const mempool = require('../mempool');
const config = require('./config.local');
const interface = require('@fuel-js/interface');

module.exports = test('mempool', async t => {
  try {
    const settings = config({
      network: 'unspecified',
      provider: t.getProvider(),
    });

    let middle = null;

    // put transactions into db
    for (var tx = 0; tx < 1000; tx++) {
      const key = [
        interface.db.mempool,
        utils.timestamp(),
        utils.hexlify(tx),
        utils.randomBytes(32),
      ];
      const value = protocol.transaction._Transaction({});
      await settings.db.put(key, value);

      if (tx === 500) {
        middle = { key, value };
      }
    }

    let txs = await mempool({
      minTimestamp: 0,
      minNonce: 0,
      minTransactionId: 0,
      limit: 0,
    }, settings);

    t.equal(txs.length, 0, 'grabbed right amount of items');

    txs = await mempool({
      minTimestamp: 0,
      minNonce: 0,
      minTransactionId: 0,
      limit: 20,
    }, settings);

    t.equal(txs.length, 20, 'grabbed right amount of items');

    txs = await mempool({
      minTimestamp: 0,
      minNonce: 0,
      minTransactionId: 0,
      limit: 3000,
    }, settings);

    t.equal(txs.length, 1000, 'grabbed right amount of items');

    t.equalBig(txs[500].end.timestamp, middle.key[1], 'timestamp');
    t.equalBig(txs[500].end.nonce, middle.key[2], 'nonce');
    t.equalHex(txs[500].end.transactionId, middle.key[3], 'transactionId');

  } catch (testError) { console.error(testError); }
});
