// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  oneDay,
  accounts, address, extendTest, sendTransaction, oneEther, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
  singleBlockSingleProofFuel,
} = require('./test.environment');
const {
  EmptyProof,
  FillProof,
} = require('../lib');

// Test Wrapper
test('Fuel submitProof malformedBlock', async t => {
  // Extended Test Methods
  const { gt, lt, lte, gte, eq, throws } = extendTest(t);

  //
  // Empty Data BLock
  //

  //
  // Invalid Fill Block
  //

  // Test empty transactions
  const zeroFill = utils.hexZeroPad('0x0', 4000);
  await singleBlockSingleProofFuel([new FillProof(zeroFill)], 0, eq);

  //
  // One Length with Zero Fill
  //

  // Test empty transactions
  const oneLength = '0x00be'; // + utils.hexZeroPad('0x0', 4000).slice(2);
  await singleBlockSingleProofFuel([new FillProof(oneLength)], 0, eq);


  // Test empty transactions
  const oneLengthFill2 = '0x00be' + utils.hexZeroPad('0x0', 1000).slice(2);
  await singleBlockSingleProofFuel([new FillProof(oneLengthFill2)], 0, eq);


  //
  // One Length with Zero Fill
  //

  // Test empty transactions
  const oneLengthFill = '0x00be' + utils.hexZeroPad('0x0', 3786).slice(2);
  await singleBlockSingleProofFuel([new FillProof(oneLengthFill)], 0, eq);

  //
  // One Length with Zero Fill
  //

  // Test empty transactions
  const validOneLengthMerklized = '0x00be';
  const result = await singleBlockSingleProofFuel([new FillProof(validOneLengthMerklized)], 1, eq, true);
});
