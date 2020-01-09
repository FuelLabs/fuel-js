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
const { MalformedBlockProof, BlockFraudProof, BlockHeader, emptyAddress, emptyBytes32, FuelErrorCodes, FuelFraudCodes } = require('../lib');


// Test verify block header
test('submitProof verifyTransactionRootData', async () => {


  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    await submitMalformedBlockProof({
        transactionsFill: '0x0000',
        transactionsProofFill: '0x0000',
        useFill: true,
        fraudCode: FuelFraudCodes.TransactionLengthUnderflow,
        eq,
        reverts,
        message: 'invalid length underflow',
      });

    await submitMalformedBlockProof({
        transactionsFill: '0x0001',
        transactionsProofFill: '0x0001',
        useFill: true,
        fraudCode: FuelFraudCodes.TransactionLengthUnderflow,
        eq,
        reverts,
        message: 'invalid length underflow',
      });

    await submitMalformedBlockProof({
        transactionsFill: '0x0900', // 800 is max
        transactionsProofFill: '0x0900', // 800 is max
        useFill: true,
        fraudCode: FuelFraudCodes.TransactionLengthOverflow,
        eq,
        reverts,
        message: 'invalid length underflow',
      });

    await submitMalformedBlockProof({
        transactionsFill: '0x00be',
        transactionsProofFill: '0x00be',
        useFill: true,
        fraudCode: FuelFraudCodes.InvalidTransactionsNetLength,
        eq,
        reverts,
        message: 'invalid net length',
      });

    await submitMalformedBlockProof({
        transactionsFill: '0x0100' + utils.hexZeroPad('0x', big('0x100').add(4).toNumber()).slice(2),
        transactionsProofFill: '0x0100' + utils.hexZeroPad('0x', big('0x100').add(4).toNumber()).slice(2),
        useFill: true,
        fraudCode: FuelFraudCodes.InvalidTransactionsNetLength,
        eq,
        reverts,
        message: 'invalid net length',
      });

    await submitMalformedBlockProof({
      transactionsFill: '0x0100' + utils.hexZeroPad('0x', big('0x100').sub(2).toNumber()).slice(2),
      transactionsProofFill: '0x0100' + utils.hexZeroPad('0x', big('0x100').sub(2).toNumber()).slice(2),
      useFill: true,
      validMerkleRoot: true,
      eq,
      reverts,
      message: 'valid proof',
    });

    await submitMalformedBlockProof({
      transactionsFill: '0x0100' + utils.hexZeroPad('0x', big('0x100').sub(2).toNumber()).slice(2),
      transactionsProofFill: '0x0100' + utils.hexZeroPad('0x', big('0x100').sub(2).toNumber()).slice(2),
      useFill: true,
      fraudCode: FuelFraudCodes.InvalidMerkleTreeRoot,
      eq,
      reverts,
      message: 'invalid merkle tree root',
    });

    await submitMalformedBlockProof({
      leafCount: 10,
      validMerkleRoot: true,
      eq,
      reverts,
      message: 'valid leaf count with 10',
    });

    await submitMalformedBlockProof({
      leafCount: 150,
      validMerkleRoot: true,
      eq,
      reverts,
      message: 'valid leaf count 150',
    });

    await submitMalformedBlockProof({
      randomLengthLeafs: true,
      validMerkleRoot: true,
      eq,
      reverts,
      message: 'valid random length txs',
    });

    // 20 ranom leaf length checks for merklization consistancy
    for (var i = 0; i < 20; i++) {
      await submitMalformedBlockProof({
        randomLengthLeafs: true,
        validMerkleRoot: true,
        eq,
        reverts,
        message: 'valid random second check',
      });
    }

    // should test exact point of overflow and underflow..

  });

});
