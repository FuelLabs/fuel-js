const SimulationDB = require('./SimulationDB');
const MemoryDB = require('./MemoryDB');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const dba = new MemoryDB();
  const dbb = new MemoryDB();
  const db = new SimulationDB({ cache: dba, storage: dbb });

  await db.put('a', 'b');

  t.equal(await db.get('a'), 'b', 'check a');
  t.equal(await dba.get('a'), 'b', 'check a');
  t.equal(await dbb.get('a'), null, 'check a');

  await dba.put('c', 'd');

  t.equal(await db.get('c'), 'd', 'check c');
  t.equal(await dba.get('c'), 'd', 'check c');
  t.equal(await dbb.get('c'), null, 'check c');
});
