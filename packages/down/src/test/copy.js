const { test, utils } = require('@fuel-js/environment');
const database = require('@fuel-js/database');
const Key = require('@fuel-js/key');
const memdown = require('memdown');
const leveldown = require('leveldown');
const streamToArray = require('stream-to-array');
const rewind = require('../rewind');
const copydown = require('../copy');

let index = 0;
const interface = {
  test: Key(index++, 'uint32 blockNumber'),
  unfinalized: Key(index++, 'uint32 blockNumber', 'bytes32 hash'),
};

module.exports = test('copydown', async t => {
  try {
    const coder = {};

    // set unfinalized key
    coder.key = _key => [
      interface.unfinalized,
      0,
      utils.keccak256(_key),
    ];

    const local = leveldown('.testdb3');
    const remote = leveldown('.testdb2');
    const remote2 = leveldown('.testdb4');
    // const localdbn = database(local);
    const db = database(copydown(remote, rewind(local, coder))); // rewind(local, coder)));

    await db.clear();

    t.equal(typeof db.supports.local, "object", 'local');
    t.equal(typeof db.supports.remote, "object", 'remote');
    t.equal(db.supports.rewindable, true, 'properties passed on');

    await db.put([ interface.test, 42300 ], '0xaa', 'put');

    t.equal(await db.get([ interface.test, 42300 ]), '0xaa', 'db get');
    t.equal(await db.get([ interface.test, 42300 ], { remote: true }),
      '0xaa', 'remote get');
    t.equal(await db.get([ interface.test, 42300 ], { local: true }),
      '0xaa', 'local get');

    await db.del([ interface.test, 42300 ], { remote: true });

    t.equal(await db.get([ interface.test, 42300 ], { local: true }),
      '0xaa', 'local get');
    await t.catch(db.get([ interface.test, 42300 ], { remote: true }), 'remote get');

    /*
    console.time('writes');
    for (var i = 0; i < 100; i++) {
      await db.put([ interface.test, i ], '0xaa', 'put');
    }
    console.timeEnd('writes');

    console.log(await streamToArray(db.createReadStream({
      gt: [interface.unfinalized, 0, utils.min_num],
      lt: [interface.unfinalized, 0, utils.max_num],
      limit: 100,
      local: true,
    })));
    */

    await db.close();

  } catch (error) {
    console.error(error);
  }
});
