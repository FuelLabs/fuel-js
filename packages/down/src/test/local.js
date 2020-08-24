const { test, utils } = require('@fuel-js/environment');
const database = require('@fuel-js/database');
const Key = require('@fuel-js/key');
const memdown = require('memdown');
const leveldown = require('leveldown');
const copydown = require('../copy');
const localdown = require('../local');

let index = 0;
const schema = {
  test: Key(index++, 'uint32 blockNumber'),
  unfinalized: Key(index++, 'uint32 blockNumber', 'bytes32 hash'),
  sort: Key(index++, 'uint32 blockNumber', 'uint32 token', 'bytes32 hash'),
};

module.exports = test('localdown', async t => {
  const checkEmpty = database(localdown());
  t.ok(checkEmpty.supports.local, 'empty supports local');

  const local2 = leveldown('.testdb3');
  const remote = leveldown('.testdb2');
  const localDOWN = localdown(local2);
  const db = database(copydown(remote, localDOWN));
  const db2 = database(localDOWN);
  t.ok(db2.supports.local, 'supports local');

  const mem1 = memdown();
  // const mem2 = memdown();

  const checkOpen = database(localdown(local2));
  t.ok(checkOpen.supports.local, 'local');

  const closeIfOpen = database(localdown(mem1));
  const closeIfOpen2 = database(localdown(mem1));
  await closeIfOpen.close();
  await closeIfOpen2.close();
  t.ok(closeIfOpen.status !== 'open', 'close if open');
  t.ok(closeIfOpen2.status !== 'open', 'close if open');

  const localPutDB = database(localdown(memdown()));
  await localPutDB.put([schema.test, 42300], '0xaa', 'put local');
  t.equal(await localPutDB.get([schema.test, 42300]), '0xaa', 'local get');
  await localPutDB.del([schema.test, 42300]);
  await t.catch(localPutDB.get([schema.test, 42300]), 'local del correct');

  await localPutDB.batch([{
    type: 'put',
    key: '0xaa',
    value: '0xbb',
  }, {
    type: 'del',
    key: '0xaa',
  }, {
    type: 'put',
    key: '0xcc',
    value: '0xbb',
  }]);
  await t.catch(localPutDB.get('0xaa'), 'local del correct');
  t.equal(await localPutDB.get('0xcc'), '0xbb', 'local get');

  await db.clear();

  t.equal(typeof db.supports.local, 'object', 'local');
  t.equal(typeof db.supports.remote, 'object', 'remote');

  await db.put([schema.test, 42300], '0xaa', 'put');

  t.equal(await db.get([schema.test, 42300]), '0xaa', 'db get');
  t.equal(await db.get([schema.test, 42300], { remote: true }),
    '0xaa', 'remote get');
  t.equal(await db.get([schema.test, 42300], { local: true }),
    '0xaa', 'local get');

  await db.del([schema.test, 42300], { remote: true });

  t.equal(await db.get([schema.test, 42300], { local: true }),
    '0xaa', 'local get');
  await t.catch(db.get([schema.test, 42300], { remote: true }), 'remote get');

  await db.put([schema.sort, 0, '0x0a', utils.emptyBytes32], '0xaa');
  await db.put([schema.sort, 0, '0x0c', utils.emptyBytes32], '0x0c');
  await db.put([schema.sort, 3, '0x0e', utils.emptyBytes32], '0x0e');
  await db.put([schema.sort, 0, '0x0a', utils.keccak256('0xbb')], '0xaa');

  await db.close();
});
