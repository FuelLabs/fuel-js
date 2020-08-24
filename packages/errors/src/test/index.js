const { test } = require('@fuel-js/environment');
const {
  Fuel,
  ERC20,
  HTLC,
  OwnedProxy,
} = require('../index');

module.exports = test('abi', async t => {
  t.ok(Fuel, 'available');
  t.ok(ERC20, 'available');
  t.ok(HTLC, 'available');
  t.ok(OwnedProxy, 'available');
});
