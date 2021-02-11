const { test, utils } = require('@fuel-js/environment');
const database = require('@fuel-js/database');
const Key = require('@fuel-js/key');
const memdown = require('memdown');
const leveldown = require('leveldown');
const streamToArray = require('stream-to-array');
const localdown = require('../local');
const copydown = require('../copy');

let index = 0;
const schema = {
  test: Key(index++, 'uint32 blockNumber'),
  unfinalized: Key(index++, 'uint32 blockNumber', 'bytes32 hash'),
  sort: Key(index++, 'uint32 blockNumber', 'uint32 token', 'bytes32 hash'),
};

module.exports = test('copydown', async t => {
  const local = leveldown('.testdb3');
  const remote = leveldown('.testdb2');
  const mem1 = memdown();
  const mem2 = memdown();
  // const localdbn = database(local);
  const db = database(copydown(remote, localdown(local)));

  const db3 = database(copydown(mem1, mem2));
  const db4 = database(copydown(mem1, mem2));

  await db3.close();
  await db4.close();

  // check open
  const memOpen1 = memdown();
  const memOpen2 = memdown();
  const dbFirst = database(copydown(memOpen1, memOpen2));
  const dbSecond = database(copydown(memOpen1, memOpen2));
  t.ok(dbFirst, 'db ok');
  t.ok(dbSecond, 'db ok');

  // open error
  const fakeFailingDB = {
    status: 'new',
    open: (opts, callback) => {
      t.ok(opts);
      callback(new Error('err'), null);
    },
  };
  t.throws(() => database(copydown(memOpen2, fakeFailingDB)), 'db open issue');

  const fakeCloseFailingDB = {
    status: 'open',
    close: (callback) => {
      callback(new Error('err'), null);
    },
  };
  const closingDB = database(copydown(memOpen2, fakeCloseFailingDB));
  t.catch(closingDB.close(), 'close issue');

  const db5 = database(copydown(mem1, mem2));

  await db5.put('0xaa', '0xbb');
  t.equal(await db5.get('0xaa', { remote: true }), '0xbb');
  t.equal(await db5.get('0xaa', { local: true }), '0xbb');
  await db5.del('0xaa', { local: true });
  await t.catch(db5.get('0xaa', { local: true }), 'no local');
  t.equal(await db5.get('0xaa', { remote: true }), '0xbb');
  await db5.del('0xaa');
  await t.catch(db5.get('0xaa', { local: true }), 'no local');
  await t.catch(db5.get('0xaa', { remote: true }), 'no local');

  await db5.put('0xeeee', '0xbb', { local: true });
  t.equal(await db5.get('0xeeee', { local: true }), '0xbb', 'get only local');
  await t.catch(db5.get('0xeeee', { remote: true }), 'get only local');

  await db5.put('0xdddd', '0xbb', { remote: true });
  t.equal(await db5.get('0xdddd', { remote: true }), '0xbb', 'get only remote');
  await t.catch(db5.get('0xdddd', { local: true }), 'get only remote');

  const dbLocalFailure = {
    status: 'open',
    _put: (k, v, o, c) => c(new Error('err')),
    _del: (k, o, c) => c(new Error('err')),
    _batch: (arr, o, c) => c(new Error('err')),
    _clear: (o, c) => c(new Error('err')),
  };
  const dbPutFailure = database(copydown(memOpen2, dbLocalFailure));
  await t.catch(dbPutFailure.put('0xaa', '0xbb'), 'put failure');
  await t.catch(dbPutFailure.del('0xaa'), 'del failure');
  await t.catch(dbPutFailure.clear(), 'clear failure');
  await t.catch(dbPutFailure.batch([{ type: 'put', key: '0xee', value: '0xccaa' }]), 'batch failure');

  const clearA = memdown();
  const clearB = memdown();
  const clearDBA = database(localdown(clearA));
  const clearDBB = database(localdown(clearB));
  const clearDB = database(copydown(clearA, clearB));
  await clearDBA.put('0xaa', '0xbb');
  await clearDBB.put('0xaa', '0xbb');

  t.equal(await clearDBA.get('0xaa'), '0xbb', 'clear get a');
  t.equal(await clearDBB.get('0xaa'), '0xbb', 'clear get a');

  await clearDB.clear({ local: true });
  await t.catch(clearDBB.get('0xaa'), 'clear get a');
  t.equal(await clearDBA.get('0xaa'), '0xbb', 'clear get a');
  await clearDB.clear({ remote: true });
  await t.catch(clearDBB.get('0xaa'), 'clear get a');
  await t.catch(clearDBA.get('0xaa'), 'clear get b');

  await clearDB.batch([{ type: 'put', key: '0xee', value: '0xccaa' }], { local: true });
  await clearDB.batch([{ type: 'put', key: '0xee', value: '0xccaa' }], { remote: true });

  await streamToArray(clearDB.createReadStream({
    gte: '0xee',
    local: true,
  }));
  await streamToArray(clearDB.createReadStream({
    gte: '0xee',
    remote: true,
  }));
  await streamToArray(clearDB.createReadStream({
    gte: '0xee',
  }));

  await db5.batch([
    { type: 'put', key: '0xee', value: '0xccaa' },
    { type: 'del', key: '0xee' },
    { type: 'put', key: '0xdd', value: '0xcccc' },
  ]);

  t.equal(await db5.get('0xdd', { remote: true }), '0xcccc', 'batch');
  t.equal(await db5.get('0xdd', { local: true }), '0xcccc', 'batch');
  await t.catch(db5.get('0xee', { local: true }), 'no local');
  await t.catch(db5.get('0xee', { remote: true }), 'no remote');

  const supportsDB = database(copydown({ supports: { yes: true } }, { supports: { no: true } }));

  t.equal(supportsDB.supports.yes, true, 'supports inhereit');
  t.equal(supportsDB.supports.no, true, 'supports inhereit');

  const emptySupports = database(copydown({ supports: null }, { supports: null }));
  t.equal(emptySupports.supports.promises, true, 'supports inhereit');

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

  const min_num = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const max_num = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';

  (await streamToArray(db.createReadStream({
    gte: schema.sort.encode(['0x00', '0x0a', min_num]),
    lte: schema.sort.encode(['0x04', '0x0a', max_num]),
  })));

  await db.close();
});
