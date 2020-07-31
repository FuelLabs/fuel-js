const { test, utils, BN } = require('@fuel-js/environment');
const db = require('@fuel-js/database');
const streamToArray = require('stream-to-array');
const level = require('leveldown');
const memdown = require('memdown');
const simulate = require('../simulate');

module.exports = test('check node setup', async t => {
  try {

  const ksa = db(level('../.testdb'));
  const ksb = db(memdown());
  const cache = db(simulate(ksa._db.db, ksb._db.db));

  await ksa.clear();
  await ksb.clear();

  await ksb.del('0xbeef');

  await ksa.put('0xaa', '0xbb');

  t.equal(await ksa.get('0xaa'), '0xbb');

  await cache.put('0xaa', '0xcc');

  t.equal(await ksa.get('0xaa'), '0xbb');
  t.equal(await ksb.get('0xaa'), '0xcc');
  t.equal(await cache.get('0xaa'), '0xcc');

  await cache.batch([
    { type: 'put', key: '0xbb', value: '0xee' },
    { type: 'put', key: '0xee', value: '0xff' }
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

  console.log(await streamToArray(cache.createReadStream({
    beforedeleted: true,
  })));
  console.log(await streamToArray(cache.createReadStream({
    afterdeleted: true,
  })));

  await cache.close();


  } catch (er) {
    console.error(er);
  }
});
