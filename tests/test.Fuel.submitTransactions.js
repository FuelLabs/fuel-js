// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  oneDay, statusSuccess,
  accounts, address, extendTest, sendTransaction, oneEther, getReceipt, // Ethereum
  atFuel, constructFuel, constructUtility, // Fuel Related
  loadsOfGas,
} = require('./test.environment');

// Fuel Related Methods
const { GenesisBlock, FuelInterface, emptyAddress, emptyBytes32, TransactionRootHeader } = require('../lib');

// Test Wrapper
test('Fuel submitTransactions', async t => {
  // Extended Test Methods
  const { gt, lt, lte, gte, eq, throws } = extendTest(t);

  // Construct Fuel Contract
  const { contract, blockNumber } = await constructFuel(address);

  // Construct Utility ERC20 Contract
  const utility = await constructUtility(utils.parseEther('500'));
  const token = utility; // for naming sake..

  //
  // Empty Valid Submission
  //

  // Submit Test
  const emptySubmission = await contract.submitTransactions(emptyBytes32, '0x0', {
    gasLimit: loadsOfGas,
  });
  const receipt = await getReceipt(emptySubmission.hash);
  const commitmentHash = utils.keccak256('0x0');

  // Construct root
  const root = new TransactionRootHeader({
    producer: address,
    merkleTreeRoot: emptyBytes32,
    commitmentHash,
    index: big(0),
  });

  // Get submission
  const getSubmission = await contract.blockTransactionRoots(root.hash);

  // Check block number
  eq(getSubmission, receipt.blockNumber, 'block number correct');

  // Check no throws
  eq(1, statusSuccess(await getReceipt(emptySubmission.hash)), 'success submission');

  // Check Logs
  const logsProduced = (await getReceipt(emptySubmission.hash)).logs;
  const parsedLog = FuelInterface.parseLog(logsProduced[0]);

  /*
  eq(logsProduced.length, 1, 'logs produced length');
  eq(parsedLog.values.producer, address, 'log producer');
  eq(parsedLog.values.merkleTreeRoot, emptyBytes32, 'log merkle root');
  eq(parsedLog.values.commitmentHash, commitmentHash, 'log commitment hash');
  */

  //
  // Check Contract Submission
  //

  await throws(() => utility.submitTransactions(contract.address, emptyBytes32, '0x0', {
    gasLimit: loadsOfGas,
  }), 'contract submission stopped');

  //
  // Check Maximum Calldata
  //

  const fakeOverflowBytes = utils.hexZeroPad('0x0', 58823);

  await throws(() => utility.submitTransactions(contract.address, emptyBytes32, fakeOverflowBytes, {
    gasLimit: loadsOfGas,
  }), 'size overflow submission stopped');

});
