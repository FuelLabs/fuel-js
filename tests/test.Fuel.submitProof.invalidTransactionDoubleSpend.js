// Core
const { test } = require('zora');

// Local Imports
const env = require('./test.environment');
const lib = require('../lib');

// Test verify block header
test('submitProof invalidTransactionDoubleSpend', async () => {

  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = env.extendTest(t);

    await env.submitInvalidTransactionDoubleSpendProof({
      submitProofTwice: true,
      erc20Enabled: true,
      errorCode: lib.FuelErrorCodes.InvalidTransactionComparison,
      eq,
      reverts,
      message: 'invalid transaction comparison',
    });

    await env.submitInvalidTransactionDoubleSpendProof({
      secondValidProof: true,
      erc20Enabled: true,
      eq,
      reverts,
      message: 'valid comparison with no input double spend',
    });

    await env.submitInvalidTransactionDoubleSpendProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(1),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 0
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondaryMetadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(1),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 0
        }),
      ],
      secondaryInputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InputDoubleSpend,
      eq,
      reverts,
      message: 'invalid utxo double spend',
    });

    await env.submitInvalidTransactionDoubleSpendProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(1),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 0
        }),
      ],
      inputs: [
        new lib.TransactionInputChange({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondaryMetadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(1),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 0
        }),
      ],
      secondaryInputs: [
        new lib.TransactionInputChange({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InputDoubleSpend,
      eq,
      reverts,
      message: 'invalid change double spend',
    });

    await env.submitInvalidTransactionDoubleSpendProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(1),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 0
        }),
      ],
      inputs: [
        new lib.TransactionInputHTLC({
          utxoID: lib.emptyBytes32,
          preImage: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondaryMetadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(1),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 0
        }),
      ],
      secondaryInputs: [
        new lib.TransactionInputHTLC({
          utxoID: lib.emptyBytes32,
          preImage: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InputDoubleSpend,
      eq,
      reverts,
      message: 'invalid htlc double spend',
    });

    await env.submitInvalidTransactionDoubleSpendProof({
      secondInputIsDeposit: true, // this is the same deposit as used in proof 1
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InputDoubleSpend,
      eq,
      reverts,
      message: 'invalid deposit double spend',
    });
  });
});
