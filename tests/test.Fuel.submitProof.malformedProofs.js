// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  oneDay,
  accounts, address, extendTest, sendTransaction, oneEther, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
} = require('./test.environment');

// Fuel Related Methods
const { GenesisBlock, FuelInterface, emptyAddress, constructDepositHashID, FuelErrorCodes } = require('../lib');


// Fuel submitProof
test('submitProof malformedProofs', async () => {


  // Test for invalid proof type out of bounds
  await test('ErrorCode InvalidProofType', async t => {
    // Extended Test Methods
    const { reverts } = extendTest(t);

    // Construct Fuel Contract
    const { contract } = await constructFuel(address);

    // Invalid Proof Type
    const proof = utils.hexZeroPad('0x888', 32);

    // Check proof
    await reverts(() => contract.submitProof(proof, {
      gasLimit: loadsOfGas,
    }), FuelErrorCodes.InvalidProofType, 'proof type overflow');

    // Invalid Proof Type
    const proof2 = utils.hexZeroPad(big(7).toHexString(), 32);

    // Check proof
    await reverts(() => contract.submitProof(proof2, {
      gasLimit: loadsOfGas,
    }), FuelErrorCodes.InvalidProofType, 'proof type overflow');
  });


  // Test proof entry into each proof type
  // Because blockHash is checked first, lets see whats up
  await test('ErrorCode ProofLengthOverflow', async t => {
    // Extended Test Methods
    const { reverts } = extendTest(t);

    // Construct Fuel Contract
    const { contract } = await constructFuel(address);

    // Construct proof
    const proofBlockMal = utils.hexZeroPad(big(0).toHexString(), 32);

    // Interate through all proof types
    for (var proofType = 0; proofType < 6; proofType++) {
      // Construct proof
      const proof = utils.hexZeroPad(big(proofType).toHexString(), 32);

      // Check proof
      await reverts(() => contract.submitProof(proof, {
        gasLimit: loadsOfGas,
      }), FuelErrorCodes.ProofLengthOverflow, 'should revert on proof length overflow');
    }
  });


});
