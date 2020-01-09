// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  accounts, address, extendTest, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
  submitInvalidTransactionProof,
} = require('./test.environment');

// Fuel Related Methods
const { emptyAddress, emptyBytes32, FuelErrorCodes, FuelFraudCodes,
    TransactionWitness, TransactionMetadata, FillProof, UTXOProof,
    DepositProof,
    FuelInputTypes,
    TransactionInputUTXO, TransactionInputHTLC, TransactionInputChange, TransactionInputDeposit,
    TransactionOutputUTXO, TransactionOutputHTLC, TransactionOutputChange, TransactionOutputWithdrawal,
    EmptyTransactionLeaf } = require('../lib');


// Test verify block header
test('submitProof invalidTransaction', async () => {

  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    await submitInvalidTransactionProof({
      proofsOverride: [ new DepositProof({
        account: emptyAddress,
        token: emptyAddress,
        ethereumBlockNumber: big(1),
      }) ],
      includeProofs: true,
      errorCode: FuelErrorCodes.InvalidDepositProof,
      eq,
      reverts,
      message: 'invalid deposit proof',
    });

    await submitInvalidTransactionProof({
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'submit valid deposit proof',
    });

    const emptyWitness = new TransactionWitness({ v: '0x00', r: emptyBytes32, s: emptyBytes32 });

    await submitInvalidTransactionProof({
      witnesses: [emptyWitness],
      includeProofs: true,
      eq,
      reverts,
      message: 'submit valid deposit proof with root producer as witness',
    });

    await submitInvalidTransactionProof({
      witnesses: [emptyWitness],
      includeProofs: true,
      fraudCode: FuelFraudCodes.InvalidTransactionWitnessSignature,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'invalid witness signature',
    });

    await submitInvalidTransactionProof({
      outputs: [
        new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(10), tokenID: big(0), ownerAsWitnessIndex: 0 }),
        new TransactionOutputWithdrawal({ amount: big(7), tokenID: big(0), owner: emptyAddress }),
        new TransactionOutputHTLC({
            amount: big(8),
            tokenID: big(0),
            owner: emptyAddress,
            digest: utils.hexZeroPad('0x01', 32), // valid digest
            expiry: big(32),
            returnWitnessIndex: 0,
        }),
      ],
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'valid complex output summing',
    });

    const emptyMetadata = new TransactionMetadata({
      blockHeight: big(1), transactionRootIndex: 0, transactionIndex: 0, outputIndex: 0  });
    const utxoProof0 = new UTXOProof({
      transactionHashId: emptyBytes32,
      outputIndex: 0,
      type: FuelInputTypes.UTXO,
      amount: big(10),
      owner: address,
      tokenID: big(0),
    });
    const utxoProof1 = new UTXOProof({
      transactionHashId: emptyBytes32,
      outputIndex: 0,
      type: FuelInputTypes.HTLC,
      amount: big(7),
      owner: address,
      tokenID: big(0),
      digest: utils.keccak256(utils.solidityPack(['bytes32'], [emptyBytes32])),
      expiry: big(45),
      returnWitness: 0,
    });
    const utxoProof2 = new UTXOProof({
      transactionHashId: emptyBytes32,
      outputIndex: 0,
      type: FuelInputTypes.Change,
      amount: big(13),
      owner: address,
      tokenID: big(0),
    });

    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
        emptyMetadata,
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: utxoProof0.hash, witnessReference: 0 }),
        new TransactionInputHTLC({ utxoID: utxoProof1.hash, witnessReference: 0, preImage: emptyBytes32 }),
        new TransactionInputChange({ utxoID: utxoProof2.hash, witnessReference: 0 }),
      ],
      proofsOverride: [
        utxoProof0,
        utxoProof1,
        utxoProof2,
      ],
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'valid complex input summing',
    });

    // WE ARE HERE~!!

    const proofUTXOHTLC = new UTXOProof({
      transactionHashId: emptyBytes32,
      outputIndex: 0,
      type: FuelInputTypes.HTLC,
      amount: big(30),
      owner: address,
      tokenID: big(0),
      digest: utils.keccak256(utils.solidityPack(['bytes32'], [emptyBytes32])),
      expiry: big(45),
      returnWitness: 0,
    });

    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputHTLC({ utxoID: proofUTXOHTLC.hash, witnessReference: 0,
            preImage: utils.hexZeroPad('0x01', 32) }),
      ],
      proofsOverride: [
        proofUTXOHTLC,
      ],
      fraudCode: FuelFraudCodes.InvalidHTLCDigest,
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'invalid HTLC digest',
    });


    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: emptyBytes32, witnessReference: 0 }),
      ],
      proofsOverride: [
        new UTXOProof({
          transactionHashId: emptyBytes32,
          outputIndex: 0,
          type: FuelInputTypes.UTXO,
          amount: big(30),
          owner: address,
          tokenID: big(0),
        }),
      ],
      inputIndex: 0,
      errorCode: FuelErrorCodes.TransactionUTXOIDInvalid,
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'invalid UTXO ID',
    });

    await submitInvalidTransactionProof({
      outputs: [
        new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(10), tokenID: big(0), ownerAsWitnessIndex: 0 }),
        new TransactionOutputWithdrawal({ amount: big(8), tokenID: big(0), owner: emptyAddress }),
        new TransactionOutputHTLC({
            amount: big(8),
            tokenID: big(0),
            owner: emptyAddress,
            digest: utils.hexZeroPad('0x01', 32), // valid digest
            expiry: big(32),
            returnWitnessIndex: 0,
        }),
      ],
      fraudCode: FuelFraudCodes.TransactionSumMismatch,
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'complex output summing overflow',
    });

    const proofUTXOBasic = new UTXOProof({
      transactionHashId: emptyBytes32,
      outputIndex: 0,
      type: FuelInputTypes.UTXO,
      amount: big(5),
      owner: address,
      tokenID: big(0),
    });

    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
        emptyMetadata,
        emptyMetadata,
        emptyMetadata,
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
      ],
      outputs: [
        new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(10), tokenID: big(0), ownerAsWitnessIndex: 0 }),
        new TransactionOutputWithdrawal({ amount: big(5), tokenID: big(0), owner: emptyAddress }),
        new TransactionOutputHTLC({
            amount: big(5),
            tokenID: big(0),
            owner: emptyAddress,
            digest: utils.hexZeroPad('0x01', 32), // valid digest
            expiry: big(32),
            returnWitnessIndex: 0,
        }),
      ],
      proofsOverride: [
        proofUTXOBasic,
        proofUTXOBasic,
        proofUTXOBasic,
        proofUTXOBasic,
        proofUTXOBasic,
      ],
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'valid complex inputs and outputs summing',
    });

    const overrideProofs1 = [
      new UTXOProof({
        transactionHashId: emptyBytes32,
        outputIndex: 0,
        type: FuelInputTypes.UTXO,
        amount: big(5),
        owner: accounts[1].address,
        tokenID: big(0),
      }),
      new UTXOProof({
        transactionHashId: emptyBytes32,
        outputIndex: 0,
        type: FuelInputTypes.Change,
        amount: big(20),
        owner: address,
        tokenID: big(0),
      }),
    ];

    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: overrideProofs1[0].hash, witnessReference: 1 }),
        new TransactionInputChange({ utxoID: overrideProofs1[1].hash, witnessReference: 0 }),
      ],
      outputs: [
        new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(10), tokenID: big(0), ownerAsWitnessIndex: 1 }),
        new TransactionOutputWithdrawal({ amount: big(5), tokenID: big(0), owner: emptyAddress }),
        new TransactionOutputHTLC({
            amount: big(5),
            tokenID: big(0),
            owner: emptyAddress,
            digest: utils.hexZeroPad('0x01', 32), // valid digest
            expiry: big(32),
            returnWitnessIndex: 1,
        }),
      ],
      proofsOverride: overrideProofs1,
      includeSecondWitness: true,
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'valid complex inputs and outputs (two witnesses) summing',
    });

    const overrideProofs2 = [
      new UTXOProof({
        transactionHashId: emptyBytes32,
        outputIndex: 0,
        type: FuelInputTypes.UTXO,
        amount: big(5),
        owner: accounts[1].address,
        tokenID: big(0),
      }),
      new UTXOProof({
        transactionHashId: emptyBytes32,
        outputIndex: 0,
        type: FuelInputTypes.Change,
        amount: big(20),
        owner: address,
        tokenID: big(1),
      }),
    ];

    await submitInvalidTransactionProof({
      includeProofs: true,
      otherRootProducer: true,
      summingToken: utils.hexZeroPad('0x01', 20),
      errorCode: FuelErrorCodes.InvalidTokenAddress,
      eq,
      reverts,
      message: 'invalid summing token',
    });

    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: overrideProofs1[0].hash, witnessReference: 1 }),
        new TransactionInputChange({ utxoID: overrideProofs1[1].hash, witnessReference: 0 }),
      ],
      outputs: [
        new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(10), tokenID: big(0), ownerAsWitnessIndex: 1 }),
        new TransactionOutputWithdrawal({ amount: big(5), tokenID: big(0), owner: emptyAddress }),
        new TransactionOutputHTLC({
            amount: big(5),
            tokenID: big(0),
            owner: emptyAddress,
            digest: utils.hexZeroPad('0x01', 32), // valid digest
            expiry: big(32),
            returnWitnessIndex: 1,
        }),
      ],
      proofsOverride: overrideProofs1,
      includeSecondWitness: true,
      includeProofs: true,
      otherRootProducer: true,
      eq,
      reverts,
      message: 'valid complex inputs and outputs (two witnesses) summing bypass',
    });

    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
        emptyMetadata,
        emptyMetadata,
        emptyMetadata,
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
        new TransactionInputUTXO({ utxoID: proofUTXOBasic.hash, witnessReference: 0 }),
      ],
      outputs: [
        new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(11), tokenID: big(0), ownerAsWitnessIndex: 0 }),
        new TransactionOutputWithdrawal({ amount: big(5), tokenID: big(0), owner: emptyAddress }),
        new TransactionOutputHTLC({
            amount: big(5),
            tokenID: big(0),
            owner: emptyAddress,
            digest: utils.hexZeroPad('0x01', 32), // valid digest
            expiry: big(32),
            returnWitnessIndex: 0,
        }),
      ],
      proofsOverride: [
        proofUTXOBasic,
        proofUTXOBasic,
        proofUTXOBasic,
        proofUTXOBasic,
        proofUTXOBasic,
      ],
      fraudCode: FuelFraudCodes.TransactionSumMismatch,
      includeProofs: true,
      eq,
      reverts,
      message: 'invalid complex inputs and outputs summing',
    });


    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: overrideProofs2[0].hash, witnessReference: 1 }),
        new TransactionInputChange({ utxoID: overrideProofs2[1].hash, witnessReference: 0 }),
      ],
      outputs: [
        new TransactionOutputUTXO({ amount: big(5), tokenID: big(1), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(10), tokenID: big(1), ownerAsWitnessIndex: 1 }),
        new TransactionOutputWithdrawal({ amount: big(5), tokenID: big(0), owner: emptyAddress }),
        new TransactionOutputHTLC({
            amount: big(5),
            tokenID: big(1),
            owner: emptyAddress,
            digest: utils.hexZeroPad('0x01', 32), // valid digest
            expiry: big(32),
            returnWitnessIndex: 1,
        }),
      ],
      summingTokenIsERC20: true,
      erc20Enabled: true,
      proofsOverride: overrideProofs2,
      includeSecondWitness: true,
      includeProofs: true,
      otherRootProducer: true,
      logReceipts: true,
      eq,
      reverts,
      message: 'valid multi output, input, witness, token, amounts ERC20 summing',
    });

    const overrideProofs5 = [
      new UTXOProof({
        transactionHashId: emptyBytes32,
        outputIndex: 0,
        type: FuelInputTypes.UTXO,
        amount: big(5000000000),
        owner: accounts[1].address,
        tokenID: big(0),
      }),
      new UTXOProof({
        transactionHashId: emptyBytes32,
        outputIndex: 0,
        type: FuelInputTypes.Change,
        amount: big(324772638),
        owner: address,
        tokenID: big(1),
      }),
    ];

    await submitInvalidTransactionProof({
      metadata: [
        emptyMetadata,
        emptyMetadata,
      ],
      inputs: [
        new TransactionInputUTXO({ utxoID: overrideProofs5[0].hash, witnessReference: 1 }),
        new TransactionInputChange({ utxoID: overrideProofs5[1].hash, witnessReference: 0 }),
      ],
      outputs: [
        new TransactionOutputUTXO({ amount: big(5000000000), tokenID: big(0), owner: emptyAddress  }),
        new TransactionOutputChange({ amount: big(324772638), tokenID: big(1), ownerAsWitnessIndex: 1 }),
      ],
      summingTokenIsERC20: false,
      erc20Enabled: true,
      proofsOverride: overrideProofs5,
      includeSecondWitness: true,
      includeProofs: true,
      otherRootProducer: true,
      logReceipts: true,
      eq,
      reverts,
      message: 'valid multi output, input, witness, token, amounts ERC20 summing, change summing',
    });

  });

});
