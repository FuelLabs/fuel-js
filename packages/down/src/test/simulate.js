const { test } = require('@fuel-js/environment');
const db = require('@fuel-js/database');
const streamToArray = require('stream-to-array');
const level = require('leveldown');
const memdown = require('memdown');
const simulate = require('../simulate');
const localdown = require('../local');

module.exports = test('simulate', async t => {
  // open error
  const memOpen2 = memdown();
  const fakeFailingDB = {
    status: 'new',
    open: (opts, callback) => {
      t.ok(opts);
      callback(new Error('err'), null);
    },
  };
  t.throws(() => db(simulate(fakeFailingDB, memOpen2)), 'db open issue');

  const emptyDB = db(simulate());
  t.ok(emptyDB.supports, 'empty db');

  const fakeCloseFailingDB = {
    status: 'open',
    close: (callback) => {
      callback(new Error('err'), null);
    },
  };
  const closingDB = db(simulate(fakeCloseFailingDB, memOpen2));
  t.catch(closingDB.close(), 'close issue');

  const ksa = db(level('../.testdb'));
  const ksb = db(memdown());
  // eslint-disable-next-line
  const cache = db(simulate(ksa._db.db, ksb._db.db));

  await ksa.clear();
  await ksb.clear();

  const local4 = memdown();
  const mem1 = memdown();
  const mem2 = memdown();
  const checkOpen = db(simulate(local4, mem2));
  t.ok(checkOpen, 'status available');

  const supportsDB = db(simulate({ supports: { yes: true } }, { supports: { no: true } }));
  t.equal(supportsDB.supports.yes, true, 'supports inhereit');
  t.equal(supportsDB.supports.no, true, 'supports inhereit');
  const supportsDBNull = db(simulate({ supports: null }, { supports: null }));
  t.equal(supportsDBNull.supports.promises, true, 'supports inhereit');

  const closeIfOpen = db(simulate(mem1, mem2));
  const closeIfOpen2 = db(simulate(mem1, mem2));
  await closeIfOpen.close();
  await closeIfOpen2.close();
  t.ok(closeIfOpen.supports, 'close if open');
  t.ok(closeIfOpen2.supports, 'close if open');

  const dbLocalFailure = {
    status: 'open',
    _put: (k, v, o, c) => c(new Error('err')),
    _del: (k, o, c) => c(new Error('err')),
    _batch: (arr, o, c) => c(new Error('err')),
    _clear: (o, c) => c(new Error('err')),
  };
  const dbPutFailure = db(simulate(memOpen2, dbLocalFailure));
  await t.catch(dbPutFailure.put('0xaa', '0xbb'), 'put failure');
  await t.catch(dbPutFailure.del('0xaa'), 'del failure');
  await t.catch(dbPutFailure.del(), 'del failure');
  await t.catch(dbPutFailure.get(), 'clear failure');
  await t.catch(dbPutFailure.clear(), 'clear failure');
  await t.catch(dbPutFailure.batch([{ type: 'put', key: '0xee', value: '0xccaa' }]), 'batch failure');

  const mem3 = memdown();
  const mem4 = memdown();
  const memdb = db(simulate(mem3, mem4));
  const memdb3 = db(localdown(mem3));

  await memdb3.put('0xaa', '0xcc');
  t.equal(await memdb.get('0xaa'), '0xcc', 'cache store get');

  await memdb.put('0xdd', '0xee');
  await memdb.clear();
  t.catch(memdb.get('0xdd'), 'cache cleared properly');
  t.equal(await memdb.get('0xaa'), '0xcc', 'cache store get');

  await memdb.put('0xee', '0xcc');
  t.equal(await memdb.get('0xee'), '0xcc', 'cache store get');
  await memdb.batch([{
    type: 'del',
    key: '0xee',
  }]);
  t.catch(memdb.get('0xee'), 'cache after batch delete');
  await memdb.del('0xee');

  await memdb.close();
  await memdb3.close();

  await ksb.del('0xbeef');

  await ksa.put('0xaa', '0xbb');

  t.equal(await ksa.get('0xaa'), '0xbb');

  await cache.put('0xaa', '0xcc');

  t.equal(await ksa.get('0xaa'), '0xbb');
  t.equal(await ksb.get('0xaa'), '0xcc');
  t.equal(await cache.get('0xaa'), '0xcc');

  await cache.batch([
    { type: 'put', key: '0xbb', value: '0xee' },
    { type: 'put', key: '0xee', value: '0xff' },
  ]);

  t.catch(ksa.get('0xbb'), 'no writes to local');
  t.catch(ksa.get('0xee'), 'no writes to local');
  t.equal(await ksb.get('0xbb'), '0xee');
  t.equal(await ksb.get('0xee'), '0xff');
  t.equal(await cache.get('0xbb'), '0xee');
  t.equal(await cache.get('0xee'), '0xff');

  await cache.put('0xee', '0xcc');

  t.equal(await cache.get('0xee'), '0xcc');

  await cache.del('0xee');

  await cache.del('0xff');

  t.equal((await streamToArray(cache.createReadStream({ deleted: true }))).length, 2, 'deleted');

  t.catch(cache.get('0xff'), 'get ff throw');
  t.catch(cache.get('0xee'), 'get ee throw');

  await cache.put('0xee', '0xcc');

  t.equal(await cache.get('0xee'), '0xcc');

  t.equal((await streamToArray(cache.createReadStream({ deleted: true }))).length, 1, 'deleted');

  await cache.close();
});
