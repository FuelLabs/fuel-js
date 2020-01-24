const MySQLDB = require('./MySQLDB');
const _utils = require('../utils/utils');
const streamToArray = require('stream-to-array');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const db = new MySQLDB({ // for storing remotly for lambda processing
    host: process.env.mysql_host, // "SG-fuel3-1564-master.servers.mongodirector.com",
    port: process.env.mysql_port,
    database: process.env.mysql_database,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    table: 'testkeyvalues', // key / value table..
  });

  const dbQuery = new MySQLDB({ // for storing remotly for lambda processing
    host: process.env.mysql_host, // "SG-fuel3-1564-master.servers.mongodirector.com",
    port: process.env.mysql_port,
    database: process.env.mysql_database,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    table: 'testkeyvalues', // key / value table..
    useQuery: true,
  });

  await db.create(); // create table
  await db.clear();

  const r1 = await db.get('hello');

  await db.put('hello', 'yes');

  const r2 = await db.get('hello');

  await db.del('hello');

  const r3 = await db.get('hello');

  await db.put('samekey', '0xaa', true);
  await db.put('samekey', '0xbb', true);
  await db.put('samekey', '0xbb', true, true);

  t.equal(await dbQuery.get('samekey'), '0xbb', 'query usage check');

  t.equal(r1, null, 'read null');
  t.equal(r2, 'yes', 'write ');
  t.equal(r3, null, 'remove');
  t.equal(await db.get('samekey'), '0xbb', 'same key overrite');

  await db.put('dropcheck', '1');
  await db.put('dropcheck2', '1');

  await db.batch([
    { type: 'put', key: 'hello3', value: 'yes4' },
    { type: 'put', key: 'hello6', value: 'yes' },
    { type: 'put', key: 'dropcheck2', value: 'yes8' },
    { type: 'put', key: 'hello2', value: 'yes8' },
    { type: 'del', key: 'hello6' },
    { type: 'put', key: 'hello3', value: 'yes3' },
  ]);

  try {
    await db.batch([
      { type: 'put', key: 'hello3', value: 'yes4' },
      { type: 'del', key: 'hello6' },
      { type: 'put', key: 'hello3', value: 'yes', ignore: false },
    ]);
  } catch (error) {
    t.equal(typeof error, 'object', 'throw while transacting');
  }


  try {
    await db.batch([
      { type: 'put', key: 'hello3', value: 'yes4' },
      { type: 'del', key: 'hello6' },
      { type: 'put', key: 'hello3', value: 'yes', ignore: false },
    ]);
  } catch (error) {
    t.equal(typeof error, 'object', 'throw while transacting');
  }

  try {
    await db.batch([
      { type: 'put', key: 'hello3', value: 'yes4' },
      { type: 'del', key: 'hello6' },
      { type: 'put', key: 'hello3', value: 'yes', ignore: false },
    ], true);
  } catch (error) {
    t.equal(typeof error, 'object', 'throw while transacting Activated!');
  }


  try {
    await db.batch([
      { type: 'put', key: 'hello3', value: 'yes4' },
      { type: 'del', key: 'hello6' },
      { type: 'put', key: 'hello3', value: 'yes', ignore: false },
    ]);
  } catch (error) {
    t.equal(typeof error, 'object', 'throw while transacting');
  }


  try {
    await db.batch([
      { type: 'put', key: 'hello3', value: 'yes4' },
      { type: 'del', key: 'hello6' },
      { type: 'put', key: 'hello3', value: 'yes', ignore: false },
    ]);
  } catch (error) {
    t.equal(typeof error, 'object', 'throw while transacting');
  }

  await db.batch([
    { type: 'put', key: 'hello333', value: 'yes4', ignore: false },
    { type: 'put', key: 'hello3332', value: 'yes', ignore: false },
  ]);

  const _arr = [{
    type: 'get',
    key: 'nick',
    value: 'cool',
  },{
    type: 'get',
    key: 'nick',
    value: 'cool2',
  }];

  // console.log('dsf',
  //  await db.transact('SELECT value FROM testkeyvalues WHERE (`key` <=> "hello333"); SELECT value FROM testkeyvalues WHERE (`key` <=> "helhlo333"); SELECT value FROM testkeyvalues WHERE (`key` <=> "hello333");'))

  // console.log('Multi', await db
  //    .transact(`SELECT ${"`"}value${"`"}, CASE WHEN ${"`"}value${"`"} IS NULL THEN 0 ELSE 1 END AS IS_NULL FROM testkeyvalues WHERE ${"`"}key${"`"} = 'hel2lo333' OR ${"`"}key${"`"} = 'hel2lo333' OR ${"`"}key${"`"} = 'hello3332';`));

  const singleGet = await db.batch([
    { type: 'get', key: 'hello333' },
  ]);

  console.log(singleGet);

  t.equal(singleGet[0], 'yes4');
  t.equal(singleGet.length, 1);

  const singleEmptyGet = await db.batch([
    { type: 'get', key: 'he33llo333' },
  ]);

  t.equal(singleEmptyGet[0], null, 'null single empty');
  t.equal(singleEmptyGet.length, 1, 'null len single empty');

  const twoEmptyGet = await db.batch([
    { type: 'get', key: 'he33llo333' },
    { type: 'get', key: 'he33llo333' },
  ]);

  t.equal(twoEmptyGet[0], null, 'twoEmptyGet single empty');
  t.equal(twoEmptyGet[1], null, 'twoEmptyGet single empty');
  t.equal(twoEmptyGet.length, 2, 'twoEmptyGet len single empty');


  const results = await db.batch([
    { type: 'get', key: 'hello333' },
    { type: 'get', key: 'hello3' },
  ]);

  t.equal(results[0], 'yes4');
  t.equal(results[1], 'yes3');
  t.equal(results.length, 2);

  const results2 = await db.batch([
    { type: 'get', key: 'hello333' },
    { type: 'get', key: 'hello3' },
    { type: 'get', key: 'h1el33o3' },
    { type: 'get', key: 'hello333' },
    { type: 'get', key: 'hello3' },
  ]);

  console.log('res2', results2);

  t.equal(results2[0], 'yes4');
  t.equal(results2[1], 'yes3');
  t.equal(results2[2], null);
  t.equal(results2[3], 'yes4');
  t.equal(results2[4], 'yes3');
  t.equal(results2.length, 5);

  t.equal(await db.get('hello6'), null, 'removed in batch');
  t.equal(await db.get('hello3'), 'yes3', 'added in batch');
  t.equal(await db.get('dropcheck2'), 'yes8', 'added in batch');
  t.equal(await db.get('hello2'), 'yes8', 'added in batch');

  console.log('Multi-table update');

  const db2 = new MySQLDB({ // for storing remotly for lambda processing
    host: process.env.mysql_host, // "SG-fuel3-1564-master.servers.mongodirector.com",
    port: process.env.mysql_port,
    database: process.env.mysql_database,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    table: 'accounts_test', // key / value table..
    indexValue: true,
  });

  await db2.create();

  await db.batch([
    { type: 'put', key: 'talk', value: 'walk' }, // should defualt to testkeyvalues
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val122' },
    { type: 'put', table: 'accounts_test', key: 'test22', value: 'val120' },
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val199' },
    { type: 'del', table: 'accounts_test', key: 'test22' },
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll2' },
    { type: 'del', key: 'johnny' }, // should defualt to testkeyvalues
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll' },
  ]);

  await _utils.wait(1000);

  try {
    await db.batch([
      { type: 'put', table: 'accounts_test', key: 'test84', value: 'val199', ignore: false },
      { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll' },
    ]);

    t.equal(true, false, 'batch should have thrown!');
  } catch (err) {
    t.equal(typeof err !== 'undefined', true, 'ignore in multi table batch');
  }

  t.equal(db.table, 'testkeyvalues', 'table name a');
  t.equal(db2.table, 'accounts_test', 'table name b');

  t.equal(await db.get('johnny'), 'valll', 'multi table test');
  t.equal(await db2.get('test84', true), 'val199', 'multi table test');
  t.equal(await db2.get('test22'), null, 'multi table test');
  t.equal(await db.get('talk'), 'walk', 'multi table test');

  await db.batch([
    { type: 'put', key: 'talk', value: 'walk' }, // should defualt to testkeyvalues
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val122' },
    { type: 'put', table: 'accounts_test', key: 'test22', value: 'val120' },
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val199' },
    { type: 'del', table: 'accounts_test', key: 'test22' },
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll2' },
    { type: 'del', key: 'johnny' }, // should defualt to testkeyvalues
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll' },
  ]);

  // try transacitonally..
  await db.batch([
    { type: 'put', key: 'talk', value: 'walk' }, // should defualt to testkeyvalues
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val122' },
    { type: 'put', table: 'accounts_test', key: 'test22', value: 'val120' },
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val199' },
    { type: 'del', table: 'accounts_test', key: 'test22' },
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll2' },
    { type: 'del', key: 'johnny' }, // should defualt to testkeyvalues
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll' },
  ], true);

  t.equal(await db.get('johnny'), 'valll', 'multi table test');
  t.equal(await db2.get('test84'), 'val199', 'multi table test');
  t.equal(await db2.get('test22'), null, 'multi table test');
  t.equal(await db.get('talk', true), 'walk', 'multi table test');

  console.log(await streamToArray(await db.createReadStream()));

  /*
  const db4 = new MySQLDB({ // for storing remotly for lambda processing
    host: process.env.mysql_host, // "SG-fuel3-1564-master.servers.mongodirector.com",
    port: process.env.mysql_port,
    database: process.env.mysql_database,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    table: 'mempool_test', // key / value table..
    created: true,
  });
  await db4.drop();
  await db4.create();

  await db4.put('hello', 'world');
  await db4.batch([
    { type: 'put', key: 'talk', value: 'walk' }, // should defualt to testkeyvalues
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val122' },
    { type: 'put', table: 'accounts_test', key: 'test22', value: 'val120' },
    { type: 'put', table: 'accounts_test', key: 'test84', value: 'val199' },
    { type: 'del', table: 'accounts_test', key: 'test22' },
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll2' },
    { type: 'del', key: 'johnny' }, // should defualt to testkeyvalues
    { type: 'put', table: 'testkeyvalues', key: 'johnny', value: 'valll' },
  ]);

  console.log('sream to arr', (await db4.createReadStream()).on('result', console.log));
  */

  await db.drop();

  await db2.put('utxo1_account', '0xaa');
  await db2.put('utxo2_account', '0xaa');
  console.log(await db2.keys('0xaa'));


  await db2.drop();

  try {
    await db.get('dropcheck');
  } catch (error) {
    t.equal(typeof error, 'object', 'check');
    setTimeout(() => process.exit(), 4000);
  }
});
