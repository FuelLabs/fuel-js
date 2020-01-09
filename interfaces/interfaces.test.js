const {
  FuelInterface,
  FuelUtilityInterface,
  ERC20EventsInterface,
  ERC20Interface,
  FuelEventsInterface,
  FuelConstants,
  FuelErrorCodes,
  FuelFraudNames,
  FuelFraudCodes,
  FuelConstantsCode,
} = require('./interfaces');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const a = FuelInterface;

  t.equal(typeof a, "object", 'fuel interface');
  t.equal(typeof a.functions, "object", 'fuel interface functions');
  t.equal(typeof a.events, "object", 'fuel interface functions');

  const b = FuelConstants;

  t.equal(typeof b, "object", 'fuel constants');

  const c = FuelErrorCodes;

  t.equal(typeof c, "object", 'fuel error codes');
  t.equal(c.InvalidTypeDeposit, 0, 'fuel error code');

  const d = FuelFraudCodes;

  t.equal(typeof d, "object", 'fuel fraud codes');
  t.equal(d.InvalidTransactionWitnessSignature, 26, 'fuel fraud code');

  const e = FuelFraudNames;

  t.equal(typeof e, "object", 'fuel fraud names');
  t.equal(FuelFraudNames[26], 'InvalidTransactionWitnessSignature', 'fuel fraud name');

  const f = FuelConstantsCode;

  t.equal(typeof f, "string", 'fuel constants');
});
