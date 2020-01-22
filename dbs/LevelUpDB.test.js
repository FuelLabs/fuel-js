const LevelDB = require('./LevelUpDB');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const db = new LevelDB();

  const r1 = await db.get('hello');

  await db.put('hello', 'yes');

  try {
    await db.put('hello', 'yes', true);
  } catch (error) {
    t.equal(typeof error, 'string', 'double spend stopper');
  }

  const r2 = await db.get('hello');

  await db.del('hello');

  const r3 = await db.get('hello');

  t.equal(r1, null, 'read null');
  t.equal(r2, 'yes', 'write ');
  t.equal(r3, null, 'remove');
});
