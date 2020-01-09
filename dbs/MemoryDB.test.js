const MemoryDB = require('./MemoryDB');
const toArray = require('stream-to-array');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const db = new MemoryDB();

  const r1 = await db.get('hello');

  await db.set('hello', 'yes');

  const r2 = await db.get('hello');

  await db.remove('hello');

  const r3 = await db.get('hello');

  await db.set('sdfd', 'yes');
    await db.set('sffdsfsd', '122');

  console.log(await toArray(db.createReadStream()));

  t.equal(r1, null, 'read null');
  t.equal(r2, 'yes', 'write ');
  t.equal(r3, null, 'remove');
});
