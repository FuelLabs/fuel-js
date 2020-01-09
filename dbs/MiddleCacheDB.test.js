const MiddleCacheDB = require('./MiddleCacheDB');
const MemoryDB = require('./MemoryDB');
const LevelUpDb = require('./levelupdb');
const { RLP } = require('../utils/utils');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const dba = new MemoryDB();
  const dbb = new MemoryDB();
  const dbc = new MemoryDB();
  const db = new MiddleCacheDB(dba, dbb, dbc);

  await db.put('0xa', '0xb');

  t.equal(await db.get('0xa'), '0xb', 'check db');
  t.equal(await dba.get('0xa'), '0xb', 'check db a');

  await dba.put('0xc', '0xd');

  await db.put('0xf', '0x33');

  await db.del('0xf');

  t.equal(await db.get('0xc'), '0xd', 'check c');
  t.equal(await dba.get('0xc'), '0xd', 'check c');
  t.equal(await dbb.get('0xa'), '0x1', 'check c');
  t.equal(await dbb.get('0xf'), '0x1', 'check c');

  await db.process(0);

  t.equal(await db.get('0xa'), '0xb', 'check db');
  t.equal(await dba.get('0xa'), '0xb', 'check db a');
  t.equal(await db.get('0xc'), '0xd', 'check c');
  t.equal(await dba.get('0xc'), '0xd', 'check c');
  t.equal(await dbc.get('0xa'), '0xb', 'check db b post process');
  t.equal(await dbc.get('0xf'), null, 'check db b post process');
  t.equal(await db.get('0xa'), '0xb', 'check db b post process');
  t.equal(await db.get('0xf'), null, 'check db b post process');
});


// Test verify block header
test('module test level', async t => {
  const dba = new LevelUpDb('./cachea-test');
  const dbb = new LevelUpDb('./cacheb-test');
  const dbc = new LevelUpDb('./cachec-test');
  const db = new MiddleCacheDB(dba, dbb, dbc);

  await db.put('0xa', '0xb');

  t.equal(await db.get('0xa'), '0xb', 'check db');
  t.equal(await dba.get('0xa'), '0xb', 'check db a');

  await dba.put('0xc', '0xd');

  await db.put('0xf', '0x33');

  await db.del('0xf');

  t.equal(await db.get('0xc'), '0xd', 'check c');
  t.equal(await dba.get('0xc'), '0xd', 'check c');
  t.equal(await dbb.get('0xa'), '0x1', 'check c');
  t.equal(await dbb.get('0xf'), '0x1', 'check c');

  await db.process(0);

  t.equal(await db.get('0xa'), '0xb', 'check db');
  t.equal(await dba.get('0xa'), '0xb', 'check db a');
  t.equal(await db.get('0xc'), '0xd', 'check c');
  t.equal(await dba.get('0xc'), '0xd', 'check c');
  t.equal(await dbc.get('0xa'), '0xb', 'check db b post process');
  t.equal(await dbc.get('0xf'), null, 'check db b post process');
  t.equal(await db.get('0xa'), '0xb', 'check db b post process');
  t.equal(await db.get('0xf'), null, 'check db b post process');
});
