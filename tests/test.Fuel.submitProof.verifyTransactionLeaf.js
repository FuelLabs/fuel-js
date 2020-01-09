// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  accounts, address, extendTest, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
  submitMalformedTransactionProof,
} = require('./test.environment');

// Fuel Related Methods
const { emptyAddress, emptyBytes32, FuelErrorCodes, FuelFraudCodes, EmptyTransactionLeaf } = require('../lib');


// Test verify block header
test('submitProof verifyTransactionLeaf', async () => {


  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    await submitMalformedTransactionProof({
      merkleProofOverride: {
        transactionLeafs: [new EmptyTransactionLeaf(120)],
      },
      merkleProofOverflow: false,
      errorCode: FuelErrorCodes.TransactionLeafHashInvalid,
      eq,
      reverts,
      message: 'invalid merkle proof base hash',
    });

    await submitMalformedTransactionProof({
      merkleProofOverflow: true,
      errorCode: FuelErrorCodes.MerkleTreeHeightOverflow,
      eq,
      reverts,
      logReceipts: true,
      message: 'merkle tree height overflow',
    });

    await submitMalformedTransactionProof({
      leafs: [new EmptyTransactionLeaf(120)],
      transactionDataOverride: {
        transactionLeaf: new EmptyTransactionLeaf(120),
      },
      merkleProofOverride: {
        transactionLeafs: [new EmptyTransactionLeaf(120), new EmptyTransactionLeaf(120)],
      },
      errorCode: FuelErrorCodes.MerkleTreeRootInvalid,
      eq,
      reverts,
      logReceipts: true,
      message: 'invalid merkle proof root',
    });

  });


});
