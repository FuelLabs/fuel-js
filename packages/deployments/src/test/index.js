const { test } = require('@fuel-js/environment');
const {
  v1,
} = require('../index');

module.exports = test('abi', async t => {
  t.ok(v1.ropsten, 'ropsten');
  t.ok(v1.rinkeby, 'rinkeby');
});
