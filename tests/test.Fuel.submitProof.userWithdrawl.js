// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  accounts, address, extendTest, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
  submitUserWithdrawalProof,
} = require('./test.environment');

// Fuel Related Methods
const { emptyAddress, emptyBytes32, FuelErrorCodes, FuelFraudCodes,
    TransactionWitness, TransactionMetadata, FillProof,
    TransactionInputUTXO, TransactionInputHTLC, TransactionInputChange, TransactionInputDeposit,
    TransactionOutputUTXO, TransactionOutputHTLC, TransactionOutputChange, TransactionOutputWithdrawal,
    EmptyTransactionLeaf } = require('../lib');


// Test verify block header
test('submitProof userWithdrawal', async () => {


  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    // Construct A Fuel Contract
    const { contract } = await constructFuel(emptyAddress);

    await submitUserWithdrawalProof({
      outputs: [
        new TransactionOutputUTXO({ amount: big(30), tokenID: big(0), owner: emptyAddress }),
      ],
      errorCode: FuelErrorCodes.InvalidWithdrawalOutputType,
      outputIndex: 0,
      token: emptyAddress,
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'invalid withdrawal output type',
    });

    await submitUserWithdrawalProof({
      outputs: [
        new TransactionOutputWithdrawal({ amount: big(30), tokenID: big(0), owner: emptyAddress }),
      ],
      errorCode: FuelErrorCodes.BlockNotFinalized,
      outputIndex: 0,
      token: emptyAddress,
      blockIncrease: big(0), // not finalized!
      eq,
      reverts,
      message: 'not finalized withdrawal attempt stopped',
    });

    await submitUserWithdrawalProof({
      outputs: [
        new TransactionOutputWithdrawal({ amount: big(30), tokenID: big(0), owner: emptyAddress }),
      ],
      errorCode: FuelErrorCodes.InvalidWithdrawalOwner,
      outputIndex: 0,
      token: emptyAddress,
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'invalid withdrawal owner',
    });

    await submitUserWithdrawalProof({
      outputs: [
        new TransactionOutputWithdrawal({ amount: big(0), tokenID: big(0), owner: address }),
      ],
      errorCode: FuelErrorCodes.TransferAmountUnderflow,
      outputIndex: 0,
      token: emptyAddress,
      withdrawalAccount: address,
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'invalid transfer value underflow',
    });

    await submitUserWithdrawalProof({
      outputs: [
        new TransactionOutputWithdrawal({ amount: big(30), tokenID: big(0), owner: address }),
      ],
      errorCode: FuelErrorCodes.TransferTokenAddress,
      outputIndex: 0,
      token: address, // this is Wrong
      withdrawalAccount: address,
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'invalid transfer token id mismatch',
    });

    await submitUserWithdrawalProof({
      outputs: [
        new TransactionOutputWithdrawal({ amount: big(30), tokenID: big(0), owner: address }),
      ],
      outputIndex: 0,
      token: emptyAddress,
      withdrawalAccount: address,
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'valid withdrawal attempt',
    });

    await submitUserWithdrawalProof({
      outputs: [
        new TransactionOutputWithdrawal({ amount: big(30), tokenID: big(0), owner: address }),
      ],
      errorCode: FuelErrorCodes.WithdrawalAlreadyHappened,
      outputIndex: 0,
      token: emptyAddress,
      submitProofTwice: true, // Submit that a second time!
      withdrawalAccount: address,
      blockIncrease: await contract.FINALIZATION_DELAY(),
      eq,
      reverts,
      message: 'invalid withdrawal already happened!',
    });

  });

});
