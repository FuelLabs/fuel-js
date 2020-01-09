// Core
const { test } = require('zora');
const {
  big, utils, rpc, // Low Level
  oneDay,
  accounts, address, extendTest, sendTransaction, oneEther, // Ethereum
  atFuel, constructFuel, // Fuel Related
} = require('./test.environment');
const { GenesisBlock, FuelInterface, emptyAddress, TypeError } = require('../lib');

// Test Wrapper
test('Fuel Construction', async t => {
  // Extended Test Methods
  const { gt, lt, lte, gte, eq } = extendTest(t);

  // Construction
  const { contract, blockNumber, receipt } = await constructFuel(address);

  // Check State
  eq(await contract.blockTip(), 0, 'block tip');
  eq(await contract.numTokens(), 1, 'num tokens');
  eq(await contract.blockProducer(), address, 'block producer');

  // Check Construction Log
  const log = FuelInterface.parseLog(receipt.logs[0]);
  const log1 = FuelInterface.parseLog(receipt.logs[1]);

  // Check BlockCommitted construction log
  t.equal(log.name, 'TokenIndex', 'log name');
  t.equal(log1.name, 'BlockCommitted', 'log name');
  eq(log1.values.blockProducer, emptyAddress, 'log producer');
  eq(log1.values.previousBlockHash, 0, 'log previous hash');
  eq(log1.values.blockHeight, 0, 'log block height');
  eq(log1.values.transactionRoots.length, 0, 'log roots');

  // Check Constants
  eq(await contract.BOND_SIZE(), utils.parseEther('.1'), 'bond size'); // required for block commitment
  eq(await contract.FINALIZATION_DELAY(), 50400, 'finalize'); //  ~ 2 weeks at 14 second block times
  eq(await contract.SUBMISSION_DELAY(), 14400, 'submission'); // Math.ceil((oneDay * 4) / 14), 'submission'); //  ~ 3 day (should be 3 days) in Ethereum Blocks
  eq(await contract.CLOSING_DELAY(), 648000, 'closing'); // (should be 3 months)

  // Build Genesis
  const genesis = new GenesisBlock();

  // Check Genesis block
  eq(await contract.blockCommitments(0), genesis.hash, 'genesis block');

  //
  // Permissionless Construction
  //

  const permissionlessFuel = await constructFuel(emptyAddress);

  // Check State
  eq(await permissionlessFuel.contract.blockTip(), 0, 'permissionless block tip');
  eq(await permissionlessFuel.contract.numTokens(), 1, 'permissionless num tokens');
  eq(await permissionlessFuel.contract.blockProducer(), emptyAddress, 'permissionless block producer');
});
