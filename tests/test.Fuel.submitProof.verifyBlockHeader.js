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
test('submitProof verifyBlockHeader', async () => {


  // Test verifyBlockHeader assembly method
  await test('ErrorCode Checks', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    await submitMalformedBlockProof({
      blockHeaderParams: {
        blockHeight: big(0), // underflow block height
      },
      validMerkleRoot: true,
      errorCode: FuelErrorCodes.BlockHeightUnderflow,
      eq,
      reverts,
      message: 'block height underflow',
    });

    await submitMalformedBlockProof({
      blockHeaderParams: {
        blockHeight: big(3), // block height overflow
      },
      validMerkleRoot: true,
      errorCode: FuelErrorCodes.BlockHeightOverflow,
      eq,
      reverts,
      message: 'block height overflow',
    });

    await submitMalformedBlockProof({
      blockHeaderParams: {
        previousBlockHash: emptyBytes32, // invalid previous hash
      },
      validMerkleRoot: true,
      errorCode: FuelErrorCodes.InvalidPreviousBlockHash,
      eq,
      reverts,
      message: 'invalid previous block hash',
    });

    await submitMalformedBlockProof({
      blockHeaderParams: {
        transactionRoots: [], // invalid roots length
      },
      validMerkleRoot: true,
      errorCode: FuelErrorCodes.TransactionRootsLengthUnderflow,
      eq,
      reverts,
      message: 'transaction roots length underflow',
    });

    await submitMalformedBlockProof({
      blockHeaderParams: {
        producer: emptyAddress, // invalid producer address
      },
      validMerkleRoot: true,
      errorCode: FuelErrorCodes.BlockHashNotFound,
      eq,
      reverts,
      message: 'block hash not found',
    });

  });

  // Test verifyBlockHeader assembly method
  console.log('Checking 2 week finlization stop, this may take 10 minutes..');
  await test('ErrorCode BlockFinalized', async t => {
    // Extended Test Methods
    const { eq, reverts } = extendTest(t);

    // Increase block count
    const { contract } = await constructFuel(address);

    // massive block increase, this will take a while (2 week simulation)
    const blockIncrease = (await contract.FINALIZATION_DELAY()).add(10); // get delay..

    await submitMalformedBlockProof({
      validMerkleRoot: true,
      blockIncrease,
      errorCode: FuelErrorCodes.BlockFinalized, // block is finalized
      eq,
      reverts,
      message: 'block finalized',
    });
  });
});
