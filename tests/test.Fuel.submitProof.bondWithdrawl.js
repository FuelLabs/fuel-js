// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  accounts, address, extendTest, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
  submitBondWithdrawalProof,
} = require('./test.environment');

// Fuel Related Methods
const { emptyAddress, emptyBytes32, FuelErrorCodes, FuelFraudCodes,
    TransactionWitness, TransactionMetadata, FillProof,
    TransactionInputUTXO, TransactionInputHTLC, TransactionInputChange, TransactionInputDeposit,
    TransactionOutputUTXO, TransactionOutputHTLC, TransactionOutputChange, TransactionOutputWithdrawal,
    EmptyTransactionLeaf } = require('../lib');


// Test verify block header
test('submitProof bondWithdrawal', async () => {


  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    // Construct A Fuel Contract
    const { contract } = await constructFuel(emptyAddress);

    await submitBondWithdrawalProof({
      errorCode: FuelErrorCodes.BlockNotFinalized,
      // blockIncrease: big(0), // not finalized!
      eq,
      reverts,
      message: 'not finalized withdrawal attempt stopped',
    });

    await submitBondWithdrawalProof({
      errorCode: FuelErrorCodes.BlockProducerNotCaller,
      otherCaller: true, // use account 1 which should throw!
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'caller is not the block producer',
    });

    await submitBondWithdrawalProof({
      errorCode: FuelErrorCodes.BlockBondAlreadyWithdrawn,
      submitProofTwice: true, // Submit that a second time!
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'block bond has already been withdrawn',
    });

    await submitBondWithdrawalProof({
      blockIncrease: await contract.FINALIZATION_DELAY(),
      withdrawalAccount: address,
      eq,
      reverts,
      message: 'valid bond withdrawal',
    });

  });

});
