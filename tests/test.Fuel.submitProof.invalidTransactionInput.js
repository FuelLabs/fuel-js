// Core
const { test } = require('zora');

// Local Imports
const env = require('./test.environment');
const lib = require('../lib');

// Test verify block header
test('submitProof invalidTransactionInput', async () => {

  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = env.extendTest(t);

    await env.submitInvalidTransactionInputProof({
      submitProofTwice: true,
      errorCode: lib.FuelErrorCodes.InvalidTypeDeposit,
      eq,
      reverts,
      message: 'invalid type deposit reference',
    });

    await env.submitInvalidTransactionInputProof({
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
      secondValidProof: true,
      erc20Enabled: true,
      errorCode: lib.FuelErrorCodes.InvalidBlockHeightReference,
      eq,
      reverts,
      message: 'invalid block height reference',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 1, // This is overflowing!
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
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InvalidTransactionRootIndexOverflow,
      eq,
      reverts,
      message: 'transaction root index overflow',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 1
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondOutputReference: 0, // this is wrong!
      secondValidProof: true,
      erc20Enabled: true,
      errorCode: lib.FuelErrorCodes.InvalidOutputIndexReference,
      eq,
      reverts,
      message: 'invalid output index reference',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 1, // this is wrong
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
      produceSecondTransactionRoot: true,
      secondOutputReference: 0,
      secondValidProof: true,
      erc20Enabled: true,
      errorCode: lib.FuelErrorCodes.InvalidTransactionRootReference,
      eq,
      reverts,
      message: 'invalid transaction root index reference',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 2, // this is wrong
          outputIndex: 0
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondOutputReference: 0,
      secondValidProof: true,
      erc20Enabled: true,
      errorCode: lib.FuelErrorCodes.InvalidTransactionIndexReference,
      eq,
      reverts,
      message: 'invalid transaction index reference',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0, // this is zero hash
          outputIndex: 0
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondTransactionIsZero: true,
      secondOutputReference: 0,
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.TransactionHashZero,
      eq,
      reverts,
      message: 'transaction references was a zero hash',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 5 // this is wrong!
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondOutputReference: 0,
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.MetadataOutputIndexOverflow,
      eq,
      reverts,
      message: 'transaction output index overflow',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 3, // transaction index overflow
          outputIndex: 0
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondIsRightmost: true,
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.TransactionIndexOverflow,
      eq,
      reverts,
      message: 'transaction index overflow',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0, // transaction index overflow
          outputIndex: 0
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32, // this is wrong!
          witnessReference: 0,
        }),
      ],
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InvalidUTXOHashReference,
      eq,
      reverts,
      message: 'invalid utxo hash reference',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 3 // withdrawal index selected!
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({
          utxoID: lib.emptyBytes32, // this is wrong!
          witnessReference: 0,
        }),
      ],
      secondOutputIndex: 3, // select right index!
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InvalidInputWithdrawalSpend,
      eq,
      reverts,
      message: 'invalid withdrawal input spend attempt',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 4 // HTLC Output
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({ // UTXO Spend
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondOutputIndex: 4, // select right index!
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InvalidTypeReferenceMismatch,
      eq,
      reverts,
      message: 'invalid type reference UTXO spending HTLC mismatch',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 2 // Change Output
        }),
      ],
      inputs: [
        new lib.TransactionInputUTXO({ // UTXO Spend
          utxoID: lib.emptyBytes32,
          witnessReference: 0,
        }),
      ],
      secondOutputIndex: 2, // select right index!
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InvalidTypeReferenceMismatch,
      eq,
      reverts,
      message: 'invalid type reference UTXO spending Change mismatch',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 4
        }),
      ],
      secondOutputIndex: 4, // HTLC output
      constructInputAsSecondHTLC: true,
      constructExpiredOutput: true,
      constructInvalidHTLCWitness: true,
      secondValidProof: true,
      erc20Enabled: true,
      fraudCode: lib.FuelFraudCodes.InvalidReturnWitnessNotSpender,
      eq,
      reverts,
      message: 'invalid return witness not spender',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 4
        }),
      ],
      secondOutputIndex: 4, // HTLC output
      constructInputAsSecondHTLC: true,
      constructExpiredOutput: true,
      secondValidProof: true,
      erc20Enabled: true,
      eq,
      reverts,
      message: 'valid return witness spender',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 1
        }),
      ],
      secondOutputIndex: 1, // HTLC output
      constructInputAsSecondUTXO: true,
      includeSecondWitness: true,
      secondValidProof: true,
      erc20Enabled: true,
      eq,
      reverts,
      message: 'valid utxo spend',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 2
        }),
      ],
      secondOutputIndex: 2, // Change output
      constructInputAsSecondChange: true,
      includeSecondWitness: true,
      secondValidProof: true,
      erc20Enabled: true,
      eq,
      reverts,
      message: 'valid change witness spend',
    });

    await env.submitInvalidTransactionInputProof({
      metadata: [
        new lib.TransactionMetadata({
          blockHeight: lib.big(2),
          transactionRootIndex: 0,
          transactionIndex: 0,
          outputIndex: 2
        }),
      ],
      secondOutputIndex: 2, // Change output
      constructInputAsSecondChange: true,
      fraudCode: lib.FuelFraudCodes.InvalidChangeInputSpender,
      constructInvalidChangeWitness: true, // make sure its the wrong spender here!
      includeSecondWitness: true,
      secondValidProof: true,
      erc20Enabled: true,
      eq,
      reverts,
      message: 'invalid change witness spend',
    });

  });
});
