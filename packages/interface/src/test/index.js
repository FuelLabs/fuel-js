const { test } = require('@fuel-js/environment');
const { db } = require('../index');

module.exports = test('interface', async t => {

  t.ok(db, 'available');

});
