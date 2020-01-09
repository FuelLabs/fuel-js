// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  oneDay,
  accounts, address, extendTest, sendTransaction, oneEther, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
  submitMalformedBlockProof,
} = require('./test.environment');

// Fuel Related Methods
const { MalformedBlockProof, BlockFraudProof, BlockHeader, emptyAddress, emptyBytes32, FuelErrorCodes } = require('../lib');


// Test verify block header
test('submitProof verifyTransactionRootHeader', async () => {


  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    await submitMalformedBlockProof({
      rootHeaderParams: {
        index: big(1),
      },
      errorCode: FuelErrorCodes.TransactionRootIndexOverflow,
      validMerkleRoot: true,
      eq,
      reverts,
      message: 'transaciton index overflow',
    });

    await submitMalformedBlockProof({
      rootHeaderParams: {
        producer: emptyAddress,
      },
      errorCode: FuelErrorCodes.TransactionRootHashNotInBlockHeader,
      validMerkleRoot: true,
      eq,
      reverts,
      message: 'transaction root hash not in block header',
    });

  });

});
