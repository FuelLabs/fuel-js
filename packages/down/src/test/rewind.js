const { test, utils } = require('@fuel-js/environment');
const database = require('@fuel-js/database');
const Key = require('@fuel-js/key');
const memdown = require('memdown');
const leveldown = require('leveldown');
const streamToArray = require('stream-to-array');
const encoding = require('@fuel-js/encoding');
const rewind = require('../rewind');
const copydown = require('../copy');

let index = 0;
const interface = {
  test: Key(index++, 'uint32 blockNumber'),
  unfinalized: Key(index++, 'uint32 blockNumber', 'bytes32 hash'),
};

module.exports = test('rewinddown', async t => {
  try {
    const coder = {};

    // set unfinalized key
    coder.key = _key => [
      interface.unfinalized,
      0,
      utils.keccak256(_key),
    ];

    const db = database(rewind(memdown(), coder));
    await db.put([ interface.test, 4000 ], '0xaa');
    t.equal(await db.get([ interface.test, 4000 ]), '0xaa', 'normal entry');

    t.equalRLP(await db.get([
      interface.unfinalized,
      0,
      utils.keccak256(utils.RLP.encode(interface.test.encode(4000))),
    ]), interface.test.encode(4000), 'special key');

    await db.batch([{
      type: 'put',
      key: [ interface.test, 3200 ],
      value: '0x4500',
    },
    {
      type: 'del',
      key: [ interface.test, 4000 ],
    }]);

    t.equal(await db.get([ interface.test, 3200 ]), '0x4500', 'batch put');
    await t.catch(db.get([ interface.test, 4000 ]), 'batch del');
    await t.catch(db.get([
      interface.unfinalized,
      0,
      utils.keccak256(utils.RLP.encode(interface.test.encode(4000))),
    ]), 'batch del special');

    t.equalRLP(await db.get([
      interface.unfinalized,
      0,
      utils.keccak256(utils.RLP.encode(interface.test.encode(3200))),
    ]), interface.test.encode(3200), 'batch special key');

    // set unfinalized key
    coder.key = _key => [
      interface.unfinalized,
      1,
      utils.keccak256(_key),
    ];

    await db.put([ interface.test, 3101 ], '0xaa');
    t.equal(await db.get([ interface.test, 3101 ]), '0xaa', 'normal entry');

    t.equalRLP(await db.get([
      interface.unfinalized,
      1,
      utils.keccak256(utils.RLP.encode(interface.test.encode(3101))),
    ]), interface.test.encode(3101), 'unfinalized correct');

    /*
    console.log(await streamToArray(db.createReadStream({
      gt: [interface.unfinalized, 0, utils.min_num],
      lt: [interface.unfinalized, 0, utils.max_num],
    })));
    */

  } catch (error) {
    console.error(error);
  }
});
