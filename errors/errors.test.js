const {
  ByPassError,
  ProofError,
  FuelError,
  FraudError,
  TypeError,
} = require('./errors');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const a = new ByPassError(new Error('yes'));

  t.equal(a.message, 'yes', 'by pass error');

  const b = new FuelError('yes');

  t.equal(b.name, 'FuelError', 'fuel error pass');

  const c = new TypeError('yes');

  t.equal(c.name, 'TypeError', 'type error pass');

  const d = new FraudError(1);

  t.equal(d.fraudCode, 1, 'fraud error pass');
});
