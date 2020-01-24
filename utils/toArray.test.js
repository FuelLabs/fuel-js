const toArray = require('./toArray');

// Core
const { test } = require('zora');
const MemoryDB = require('../dbs/MemoryDB');

// Test verify block header
test('module test', async t => {
  const db = new MemoryDB();

  await db.put('hello', 'no');
  await db.put('cool', 'fox');

  const arr = await toArray(db.createReadStream());

  t.equal(arr.length, 2);

  t.equal(arr[0].key, 'cool');
  t.equal(arr[1].key, 'hello');

  t.equal(arr[0].value, 'fox');
  t.equal(arr[1].value, 'no');

  const arrLimit = await toArray(db.createReadStream(), 1);

  t.equal(arrLimit.length, 1);
  t.equal(arrLimit[0].key, 'cool');
  t.equal(arrLimit[0].value, 'fox');

  const arrTransform = await toArray(db.createReadStream(), 1, v => v.value);

  t.equal(arrTransform[0], 'fox');

  const arrTransformNoLimit = await toArray(db.createReadStream(), null, v => v.value);

  t.equal(arrTransformNoLimit[0], 'fox');
  t.equal(arrTransformNoLimit[1], 'no');
});
