const { test, utils } = require('@fuel-js/environment');
const memdown = require('memdown');
const database = require('../index');

module.exports = test('database', async t => {

  const db = database(memdown());
  await db.put('0xaa', '0xbb');
  t.equal(await db.get('0xaa'), '0xbb', 'put check');

  await db.close();

});
