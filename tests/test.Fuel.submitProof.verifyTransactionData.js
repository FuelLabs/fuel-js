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
const { emptyAddress, emptyBytes32, FuelErrorCodes, FuelFraudCodes,
    TransactionWitness, TransactionMetadata, FillProof,
    TransactionInputUTXO, TransactionInputHTLC, TransactionInputChange, TransactionInputDeposit,
    TransactionOutputUTXO, TransactionOutputHTLC, TransactionOutputChange, TransactionOutputWithdrawal,
    EmptyTransactionLeaf } = require('../lib');


// Test verify block header
test('submitProof verifyTransactionData', async () => {


  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    await submitMalformedTransactionProof({
      leafs: [ new EmptyTransactionLeaf(0) ],
      transactionDataOverride: {
        transactionLeaf: new EmptyTransactionLeaf(0),
      },
      eq,
      reverts,
      message: 'empty proof, valid',
    });

    await submitMalformedTransactionProof({
      leafs: [ new EmptyTransactionLeaf(10) ],
      transactionDataOverride: {
        transactionLeaf: new EmptyTransactionLeaf(10),
      },
      fraudCode: FuelFraudCodes.TransactionLengthUnderflow,
      eq,
      reverts,
      message: 'transaction length underflow',
    });

    await submitMalformedTransactionProof({
      leafs: [ new EmptyTransactionLeaf(900) ],
      transactionDataOverride: {
        transactionLeaf: new EmptyTransactionLeaf(900),
      },
      fraudCode: FuelFraudCodes.TransactionLengthOverflow,
      eq,
      reverts,
      message: 'transaction length overflow',
    });

    // 8 being the max
    const overflowLength = 9;

    // Construct Empty Witness
    const emptyWitness = new TransactionWitness({ v: '0x00', r: emptyBytes32, s: emptyBytes32 });
    const emptyMetadata = new TransactionMetadata({
      blockHeight: big(1), transactionRootIndex: 0, transactionIndex: 0, outputIndex: 0  });
    const invalidTypeProof = new FillProof('0x09');

    const emptyUTXOInput = new TransactionInputUTXO({ utxoID: emptyBytes32, witnessReference: 0 });
    const emptyHTLCInput = new TransactionInputHTLC({ utxoID: emptyBytes32, witnessReference: 0, preImage: emptyBytes32 });
    const emptyChangeInput = new TransactionInputChange({ utxoID: emptyBytes32, witnessReference: 0 });

    const emptyOutput = new TransactionOutputUTXO({ amount: big(30), tokenID: big(0), owner: emptyAddress  });
    const emptyChangeOutput = new TransactionOutputChange({ amount: big(30), tokenID: big(0), ownerAsWitnessIndex: 0 });
    const emptyWithdrawalOutput = new TransactionOutputWithdrawal({ amount: big(30), tokenID: big(0), owner: emptyAddress });
    const emptyHTLCOutput = new TransactionOutputHTLC({
        amount: big(30),
        tokenID: big(0),
        owner: emptyAddress,
        digest: utils.hexZeroPad('0x01', 32), // valid digest
        expiry: big(32),
        returnWitnessIndex: 0,
    });

    await submitMalformedTransactionProof({
      witnesses: [],
      inputs: [emptyUTXOInput, emptyUTXOInput, emptyUTXOInput],
      fraudCode: FuelFraudCodes.TransactionWitnessesLengthUnderflow,
      eq,
      reverts,
      message: 'transaction witnesses length underflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ new TransactionInputUTXO({ utxoID: emptyBytes32, witnessReference: 1 }) ],
      fraudCode: FuelFraudCodes.TransactionInputWitnessReferenceOverflow,
      eq,
      reverts,
      message: 'transaction witnesses reference overflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ new TransactionInputChange({ utxoID: emptyBytes32, witnessReference: 1 }) ],
      fraudCode: FuelFraudCodes.TransactionInputWitnessReferenceOverflow,
      eq,
      reverts,
      message: 'transaction witnesses reference overflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ new TransactionInputHTLC({ utxoID: emptyBytes32,
          witnessReference: 1, preImage: emptyBytes32 }) ],
      fraudCode: FuelFraudCodes.TransactionHTLCWitnessOverflow,
      eq,
      reverts,
      message: 'transaction htlc witness reference overflow',
    });

    await submitMalformedTransactionProof({
      witnessReference: 1,
      fraudCode: FuelFraudCodes.TransactionInputDepositWitnessOverflow,
      eq,
      reverts,
      message: 'transaction deposit witness reference overflow',
    });

    await submitMalformedTransactionProof({
      witnesses: (new Array(overflowLength)).fill(0).map(() => emptyWitness),
      fraudCode: FuelFraudCodes.TransactionWitnessesLengthOverflow,
      eq,
      reverts,
      message: 'transaction witnesses length overflow',
    });

    await submitMalformedTransactionProof({
      witnesses: (new Array(6)).fill(0).map(() => emptyWitness),
      inputs: [],
      fraudCode: FuelFraudCodes.TransactionInputsLengthUnderflow,
      eq,
      reverts,
      message: 'transaction inputs length underflow',
    });

    await submitMalformedTransactionProof({
      inputs: (new Array(overflowLength)).fill(0).map(() => emptyUTXOInput),
      fraudCode: FuelFraudCodes.TransactionInputsLengthOverflow,
      eq,
      reverts,
      message: 'transaction inputs length overflow',
    });

    await submitMalformedTransactionProof({
      outputs: [],
      fraudCode: FuelFraudCodes.TransactionOutputsLengthUnderflow,
      eq,
      reverts,
      message: 'transaction outputs length underflow',
    });

    await submitMalformedTransactionProof({
      outputs: (new Array(overflowLength)).fill(0).map(() => emptyOutput),
      fraudCode: FuelFraudCodes.TransactionOutputsLengthOverflow,
      eq,
      reverts,
      message: 'transaction outputs length overflow',
    });

    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput ],
      fraudCode: FuelFraudCodes.TransactionMetadataLengthOverflow,
      eq,
      reverts,
      message: 'metadata length overflow',
    });

    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata,
          emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput, emptyUTXOInput, emptyUTXOInput, emptyUTXOInput ],
      outputs: [ emptyOutput, emptyOutput, emptyOutput, emptyOutput ],
      fraudCode: FuelFraudCodes.TransactionMetadataLengthOverflow,
      eq,
      reverts,
      message: 'metadata length overflow check 2',
    });

    await submitMalformedTransactionProof({
      inputIndex: 8,
      errorCode: FuelErrorCodes.InputIndexSelectedOverflow,
      eq,
      reverts,
      message: 'transaction input index selected overflow',
    });

    await submitMalformedTransactionProof({
      outputIndex: 8,
      errorCode: FuelErrorCodes.OutputIndexSelectedOverflow,
      eq,
      reverts,
      message: 'transaction output index selected overflow',
    });

    await submitMalformedTransactionProof({
      witnessIndex: 8,
      errorCode: FuelErrorCodes.WitnessIndexSelectedOverflow,
      eq,
      reverts,
      message: 'transaction witness index selected overflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ invalidTypeProof ],
      witnesses: [ emptyWitness, emptyWitness, emptyWitness ],
      fraudCode: FuelFraudCodes.InvalidTransactionInputType,
      eq,
      reverts,
      message: 'transaction invalid input type',
    });

    await submitMalformedTransactionProof({
      inputs: [ emptyUTXOInput ],
      metadata: [ new TransactionMetadata({
        blockHeight: big(0), transactionRootIndex: 0, transactionIndex: 0, outputIndex: 0  }) ],
      fraudCode: FuelFraudCodes.MetadataBlockHeightUnderflow,
      eq,
      reverts,
      message: 'transaction block height underflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ emptyUTXOInput ],
      metadata: [ new TransactionMetadata({
        blockHeight: big(2), transactionRootIndex: 1, transactionIndex: 0, outputIndex: 0  }) ],
      fraudCode: FuelFraudCodes.MetadataBlockHeightOverflow,
      eq,
      reverts,
      message: 'transaction block height overflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ emptyUTXOInput ],
      metadata: [ new TransactionMetadata({
        blockHeight: big(1), transactionRootIndex: 0, transactionIndex: 0, outputIndex: overflowLength }) ],
      fraudCode: FuelFraudCodes.MetadataOutputIndexOverflow,
      eq,
      reverts,
      message: 'transaction output index overflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ emptyHTLCInput ],
      metadata: [ new TransactionMetadata({
        blockHeight: big(1), transactionRootIndex: 0, transactionIndex: 0, outputIndex: overflowLength }) ],
      fraudCode: FuelFraudCodes.MetadataOutputIndexOverflow,
      eq,
      reverts,
      message: 'HTLC metadata stops for invalid overflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ emptyHTLCInput ],
      metadata: [ new TransactionMetadata({
        blockHeight: big(1), transactionRootIndex: 1, transactionIndex: 0, outputIndex: 0 }) ],
      fraudCode: FuelFraudCodes.InvalidTransactionRootIndexOverflow,
      eq,
      reverts,
      message: 'transaction root index overflow',
    });

    await submitMalformedTransactionProof({
      inputs: [ emptyChangeInput ],
      metadata: [ new TransactionMetadata({
        blockHeight: big(1), transactionRootIndex: 0, transactionIndex: 0, outputIndex: overflowLength }) ],
      fraudCode: FuelFraudCodes.MetadataOutputIndexOverflow,
      eq,
      reverts,
      message: 'Change metadata stops for invalid overflow',
    });

    await submitMalformedTransactionProof({
      outputs: [ new FillProof('0x0000') ],
      fraudCode: FuelFraudCodes.TransactionOutputAmountLengthUnderflow,
      eq,
      reverts,
      message: 'invalid output amount length underflow',
    });

    await submitMalformedTransactionProof({
      outputs: [ new FillProof('0x0099') ],
      fraudCode: FuelFraudCodes.TransactionOutputAmountLengthOverflow,
      eq,
      reverts,
      message: 'invalid output amount length overflow',
    });

    await submitMalformedTransactionProof({
      outputs: [ new TransactionOutputUTXO({ amount: big(30), tokenID: big(1), owner: emptyAddress }) ],
      fraudCode: FuelFraudCodes.TransactionOutputTokenIDOverflow,
      eq,
      reverts,
      message: 'output token ID overflow',
    });

    // WE STOP HERE!!!

    await submitMalformedTransactionProof({
      outputs: [ new TransactionOutputHTLC({
          amount: big(30),
          tokenID: big(0),
          owner: emptyAddress,
          digest: emptyBytes32,
          expiry: big(45),
          returnWitnessIndex: 0,
      }) ],
      fraudCode: FuelFraudCodes.TransactionOutputHTLCDigestZero,
      eq,
      reverts,
      message: 'transaction output htlc digest is zero',
    });

    await submitMalformedTransactionProof({
      outputs: [ new TransactionOutputHTLC({
          amount: big(30),
          tokenID: big(0),
          owner: emptyAddress,
          digest: utils.hexZeroPad('0x01', 32), // valid digest
          expiry: big(0),
          returnWitnessIndex: 0,
      }) ],
      fraudCode: FuelFraudCodes.TransactionOutputHTLCExpiryZero,
      eq,
      reverts,
      message: 'transaction output htlc expiry is zero',
    });

    await submitMalformedTransactionProof({
      outputs: [ new TransactionOutputHTLC({
          amount: big(30),
          tokenID: big(0),
          owner: emptyAddress,
          digest: utils.hexZeroPad('0x01', 32), // valid digest
          expiry: big(32),
          returnWitnessIndex: 9,
      }) ],
      fraudCode: FuelFraudCodes.TransactionOutputWitnessReferenceOverflow,
      eq,
      reverts,
      message: 'transaction output htlc return witness reference overflow',
    });

    await submitMalformedTransactionProof({
      outputs: [ new TransactionOutputHTLC({
          amount: big(30),
          tokenID: big(0),
          owner: emptyAddress,
          digest: utils.hexZeroPad('0x01', 32), // valid digest
          expiry: big(32),
          returnWitnessIndex: 0,
      }) ],
      eq,
      reverts,
      message: 'valid HTLC data transaction',
    });

    await submitMalformedTransactionProof({
      outputs: [
        new TransactionOutputHTLC({
          amount: big(30),
          tokenID: big(0),
          owner: address,
          digest: utils.hexZeroPad('0x01', 32), // valid digest
          expiry: big(1), // invalid expiry not past own blockheight!
          returnWitnessIndex: 0,
        }),
      ],
      fraudCode: FuelFraudCodes.OutputHTLCExpiryUnderflow,
      eq,
      reverts,
      message: 'invalid HTLC expiry underflow',
    });

    await submitMalformedTransactionProof({
      eq,
      reverts,
      message: 'valid basic transaction',
    });

    await submitMalformedTransactionProof({
      metadata: [],
      inputs: [ emptyUTXOInput ],
      fraudCode: FuelFraudCodes.MetadataReferenceOverflow,
      eq,
      reverts,
      message: 'metadata reference overflow',
    });

    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata, emptyMetadata,
          emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput, emptyUTXOInput, emptyUTXOInput, emptyUTXOInput,
          emptyUTXOInput, emptyUTXOInput, emptyUTXOInput, emptyUTXOInput ],
      fraudCode: FuelFraudCodes.MetadataReferenceOverflow,
      eq,
      reverts,
      message: 'metadata reference overflow check 2',
    });

    await submitMalformedTransactionProof({
      outputs: [ emptyChangeOutput ],
      eq,
      reverts,
      message: 'valid change output',
    });

    await submitMalformedTransactionProof({
      outputs: [ emptyWithdrawalOutput ],
      eq,
      reverts,
      message: 'valid withdrawal output',
    });


    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata,
          emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput, emptyUTXOInput, emptyUTXOInput, emptyUTXOInput,
          emptyUTXOInput, emptyUTXOInput, emptyUTXOInput, emptyUTXOInput ],
      eq,
      reverts,
      message: 'valid 8 input, 8 metadata transaction',
    });

    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata,
          emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput, emptyChangeInput, emptyHTLCInput, emptyUTXOInput,
          emptyHTLCInput, emptyUTXOInput, emptyChangeInput, emptyUTXOInput ],
      outputs: [ emptyOutput, emptyOutput, emptyOutput,
          emptyOutput, emptyOutput, emptyOutput ],
      eq,
      reverts,
      message: 'valid 8 input, 8 metadata, 6 outputs transaction',
    });

    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata,
          emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput, emptyChangeInput, emptyHTLCInput, emptyUTXOInput,
          emptyHTLCInput, emptyUTXOInput, emptyChangeInput, emptyUTXOInput ],
      outputs: [ emptyHTLCOutput, emptyChangeOutput, emptyOutput, emptyOutput,
          emptyOutput, emptyOutput, emptyWithdrawalOutput, emptyHTLCOutput ],
      eq,
      reverts,
      message: 'valid 8 input, 8 metadata, 8 outputs transaction',
    });

    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata,
          emptyMetadata, emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput, emptyChangeInput, emptyHTLCInput, emptyUTXOInput,
          emptyHTLCInput, emptyUTXOInput, emptyChangeInput ],
      outputs: [ emptyWithdrawalOutput, emptyWithdrawalOutput, emptyWithdrawalOutput, emptyWithdrawalOutput,
          emptyHTLCOutput, emptyHTLCOutput, emptyHTLCOutput, emptyHTLCOutput ],
      eq,
      reverts,
      message: 'valid 7 input, 7 metadata, 8 outputs transaction',
    });

    await submitMalformedTransactionProof({
      outputs: [ emptyHTLCOutput, emptyOutput, emptyChangeOutput, emptyOutput,
          emptyChangeOutput, emptyOutput, emptyWithdrawalOutput, emptyOutput ],
      eq,
      reverts,
      message: 'valid 1 input, 0 metadata, 8 output transaction',
    });

    await submitMalformedTransactionProof({
      metadata: [ emptyMetadata, emptyMetadata, emptyMetadata, emptyMetadata,
          emptyMetadata, emptyMetadata ],
      inputs: [ emptyUTXOInput, emptyChangeInput, emptyHTLCInput, emptyUTXOInput,
          emptyUTXOInput, emptyChangeInput ],
      outputs: [ emptyHTLCOutput, emptyOutput, emptyChangeOutput,
        new TransactionOutputChange({ amount: big(30), tokenID: big(0), ownerAsWitnessIndex: 1 }),
          emptyOutput, emptyWithdrawalOutput, emptyOutput ],
      fraudCode: FuelFraudCodes.TransactionOutputWitnessReferenceOverflow,
      eq,
      reverts,
      message: 'invalid witness reference overflow hidden in change output',
    });

    // We should not check for correctness within larger proofs!
  });
});
