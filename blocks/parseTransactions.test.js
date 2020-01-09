// Core
const { test } = require('zora');

// Local Imports
const env = require('../tests/test.environment');
const lib = require('../lib');
const { parseTransactions } = require('./parseTransactions');

// encode leafs helper
function parseLeafs(leafs, fillProof) {
  lib.TypeArray(leafs);
  const emptyLeafs = leafs.map(leafLength => fillProof
    ? new lib.FillProof(leafLength)
    : new lib.RealEmptyTransactionLeaf(leafLength));
  return parseTransactions((new lib.BlockTransactions(emptyLeafs)).encoded);
}

// Test verify block header
test('parseTransactions', async (t) => {
  // Extended Test Methods
  const { eq, throwsFraud } = env.extendTest(t);

  eq(parseLeafs([130]).length, 1, 'valid single leaf');
  eq(parseLeafs([130, 160]).length, 2, 'valid two leafs leaf');

  await throwsFraud(() => parseLeafs([0]),
    'FraudCode_TransactionLengthUnderflow', 'underflow check');
  await throwsFraud(() => parseLeafs([130, 234, 182, 0, 228]),
    'FraudCode_TransactionLengthUnderflow', 'underflow check');

  eq(parseLeafs([130, 160, 263, 122]).length, 4, 'valid multi leaf');

  await throwsFraud(() => parseLeafs(['0xffff'], true),
    'FraudCode_TransactionLengthOverflow', 'leaf size overflow');

  await throwsFraud(() => parseLeafs(['0x031f'], true),
    'FraudCode_InvalidTransactionsNetLength', 'net length overflow');

  await throwsFraud(() => parseLeafs([lib.FuelConstants.TransactionSizeMinimum]),
    'FraudCode_TransactionLengthUnderflow', 'underflow check');

  await throwsFraud(() => parseLeafs([lib.big(lib.FuelConstants.TransactionSizeMaximum).add(1).toNumber()]),
    'FraudCode_TransactionLengthOverflow', 'overflow check');
});
