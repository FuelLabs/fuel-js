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
test('Fuel commitBlock', async t => {
  // Extended Test Methods
  const { gt, lt, lte, gte, eq, throws } = extendTest(t);

  // Construct Fuel Contract
  const { contract } = await constructFuel(address);
  const contractWithOtherAccount = await atFuel(contract.address, 1);

  // Build Genesis
  const genesis = new GenesisBlock();

  // Construct Utility ERC20 Contract
  const utility = await constructUtility(utils.parseEther('500'));
  const token = utility; // for naming sake..

  //
  // Produce and Submit an Empty Root
  //

  // Make empty submission
  const emptySubmission = await contract.submitTransactions(emptyBytes32, '0x0', {
    gasLimit: loadsOfGas,
  });
  const receipt = await getReceipt(emptySubmission.hash);

  // Construct root
  const root = new TransactionRootHeader({
    producer: address,
    merkleTreeRoot: emptyBytes32,
    commitmentHash: utils.keccak256('0x0'),
    index: big(0),
  });

  // get required bond size
  const bondSize = await contract.BOND_SIZE();

  //
  // Attempt Invalid NO BOND Commit
  //

  // Commit blocks
  await throws(() => contract.commitBlock(1, [root.hash], {
    value: 0, // ZERO VALUE, BAD BOND!!
    gasLimit: loadsOfGas,
  }), 'no bond throws');

  // Check no throws
  eq(0, await contract.blockTip(), 'check blocktip');

  //
  // Attempt Invalid Producer (not permissioned producer)
  //

  // Commit blocks
  await throws(() => contractWithOtherAccount.commitBlock(1, [root.hash], {
    value: bondSize, // ZERO VALUE, BAD BOND!!
    gasLimit: loadsOfGas,
  }), 'invalid producer (not central producer)');

  // Check no throws
  eq(0, await contract.blockTip(), 'check blocktip');

  //
  // Make Valid Block Commitment
  //

  // Commit blocks
  const commitRootToBlockValid = await contract.commitBlock(1, [root.hash], {
    value: bondSize,
    gasLimit: loadsOfGas,
  });

  // Check no throws
  eq(1, statusSuccess(await getReceipt(commitRootToBlockValid.hash)), 'success commit block');
  eq(1, await contract.blockTip(), 'check blocktip');

  const logsProduced = (await getReceipt(commitRootToBlockValid.hash)).logs;
  const parsedLog = FuelInterface.parseLog(logsProduced[0]);

  // Check Valid Logs produced

  eq(1, logsProduced.length, 'log length');
  eq(address, parsedLog.values.blockProducer, 'log producer');
  eq(genesis.hash, parsedLog.values.previousBlockHash, 'log previous block hash');
  eq(1, parsedLog.values.blockHeight, 'log block height');
  eq(1, parsedLog.values.transactionRoots.length, 'log transaciton roots length');
  eq(root.hash, parsedLog.values.transactionRoots[0], 'log transaciton root');

  // Commit blocks

  await throws(() => contract.commitBlock(2, (new Array(256)).fill(0).map(() => root.hash), {
     value: bondSize,
     gasLimit: loadsOfGas,
  }), 'roots length overflow');

  eq(1, await contract.blockTip(), 'check blocktip');

  //
  // Attempt Invalid Producer (not permissioned producer)
  //

  // Commit blocks
  await throws(() => contract.commitBlock(4, [root.hash], {
    value: bondSize, // ZERO VALUE, BAD BOND!!
    gasLimit: loadsOfGas,
  }), 'invalid block height overflow');

  // Check no throws
  eq(1, await contract.blockTip(), 'check blocktip');

  //
  // Commitment to second Height Vlaid
  //

  // Commit blocks
  const commitRootToBlockValidHeight2 = await contract.commitBlock(2, [root.hash], {
    value: bondSize,
    gasLimit: loadsOfGas,
  });

  // Check no throws
  eq(1, statusSuccess(await getReceipt(commitRootToBlockValidHeight2.hash)), 'valid commit block at second height');
  eq(2, await contract.blockTip(), 'check blocktip');

  //
  // Commitment to second Height Vlaid
  //

  // Commit blocks
  const commitRootToBlockValidHeight3 = await contract.commitBlock(3, [root.hash], {
    value: bondSize,
    gasLimit: loadsOfGas,
  });

  // Check no throws
  eq(1, statusSuccess(await getReceipt(commitRootToBlockValidHeight3.hash)), 'valid commit block at third height');
  eq(3, await contract.blockTip(), 'check blocktip');

  //
  // Commitment to second Height Vlaid
  //

  // Commit blocks
  const commitRootToBlockValidTwoRoots = await contract.commitBlock(4, [root.hash, root.hash], {
    value: bondSize,
    gasLimit: loadsOfGas,
  });

  // Check no throws
  eq(1, statusSuccess(await getReceipt(commitRootToBlockValidTwoRoots.hash)), 'valid commit block two roots');
  eq(4, await contract.blockTip(), 'check blocktip');

  //
  // Stops no roots commitment
  //

  // Commit blocks
  await throws(() => contract.commitBlock(5, [], {
    value: bondSize,
    gasLimit: loadsOfGas,
  }), 'invalid roots length underflow');

  // Check no throws
  eq(4, await contract.blockTip(), 'check blocktip');

  //
  // Stops already committed roots
  //

  // Commit blocks
  await throws(() => contract.commitBlock(4, [root.hash], {
    value: bondSize,
    gasLimit: loadsOfGas,
  }), 'invalid same height');

  // Check no throws
  eq(4, await contract.blockTip(), 'check blocktip');

  //
  // Setup Permissionless Setting
  //

  // Construct Fuel Contract
  const permissionlessFuel = await constructFuel(emptyAddress);

  // Another Acocunt
  const permissionlessProducer1 = await atFuel(permissionlessFuel.contract.address, 1);
  const permissionlessProducer2 = await atFuel(permissionlessFuel.contract.address, 2);

  // empty address
  eq(emptyAddress, await permissionlessProducer1.blockProducer(), 'permissionless producer setup right');


  // Make empty submission
  const permissionlessSubmit = await permissionlessFuel.contract.submitTransactions(emptyBytes32, '0x0', {
    gasLimit: loadsOfGas,
  });

  //
  // Second Sender Commit Block
  //

  const permissionlessCommit1 = await permissionlessProducer1.commitBlock(1, [root.hash, root.hash], {
    value: bondSize,
    gasLimit: loadsOfGas,
  });

  // Check no throws
  eq(1, statusSuccess(await getReceipt(permissionlessCommit1.hash)), 'permissionless contract handles commit fine');
  eq(1, await permissionlessFuel.contract.blockTip(), 'check blocktip');

  //
  // Third Sender Commit Block
  //

  const permissionlessCommit2 = await permissionlessProducer2.commitBlock(2, [root.hash], {
    value: bondSize,
    gasLimit: loadsOfGas,
  });

  // Check no throws
  eq(1, statusSuccess(await getReceipt(permissionlessCommit2.hash)), 'permissionless contract handles commit fine');
  eq(2, await permissionlessFuel.contract.blockTip(), 'check blocktip');

  //
  // Third Sender Commit Block
  // Invalid Bond check
  //

  await throws(() => permissionlessProducer2.commitBlock(3, [root.hash], {
    value: 0,
    gasLimit: loadsOfGas,
  }), 'permissionless invalid bond stopped');

  eq(2, await permissionlessFuel.contract.blockTip(), 'check blocktip');

  // Check no Roots

  await throws(() => permissionlessProducer2.commitBlock(3, [], {
    value: bondSize,
    gasLimit: loadsOfGas,
  }), 'permissionless invalid no roots length underflow stoppped');

  eq(2, await permissionlessFuel.contract.blockTip(), 'check blocktip');
});
