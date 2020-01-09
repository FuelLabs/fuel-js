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
const { GenesisBlock, FuelInterface, emptyAddress, constructDepositHashID } = require('../lib');

// Test Wrapper
test('Fuel deposit', async t => {
  // Extended Test Methods
  const { gt, lt, lte, gte, eq, throws } = extendTest(t);

  // Construct Fuel Contract
  const { contract, blockNumber, receipt } = await constructFuel(address);

  // Construct Utility ERC20 Contract
  const utility = await constructUtility(utils.parseEther('500'));
  const token = utility; // for naming sake..

  //
  // Invalid Deposit Checks
  //

  // Transaction Invalid Deposit
  await throws(() => contract.deposit(address, emptyAddress, big(0)), 'zero value deposit');
  await throws(() => contract.deposit(address, emptyAddress, big(0), {
    value: big(0),
  }), 'zero value with zero value');
  await throws(() => contract.deposit(address, emptyAddress, big(4500)), 'no tx value deposit');
  await throws(() => contract.deposit(address, emptyAddress, big(4500), {
    value: big(45),
  }), 'incorrect tx (4500) value');
  await throws(() => contract.deposit(address, emptyAddress, big(0), {
    value: big(45),
  }), 'incorrect tx (45) value');
  await throws(() => contract.deposit(address, emptyAddress, big(4500), {
    value: big(0),
  }), 'incorrect tx (zero) value');

  //
  // Valid Deposit Checks
  //

  // Transaction Valid Deposit
  const depositA = await contract.deposit(address, emptyAddress, big(4500), {
    value: big(4500),
  });
  const depositAReceipt = await getReceipt(depositA.hash);

  // Get Deposit Value from State
  const depositAValue = await contract.deposits(constructDepositHashID({
    account: address,
    token: emptyAddress,
    ethereumBlockNumber: big(depositAReceipt.blockNumber),
  }));

  // Check deposit value
  eq(4500, depositAValue, 'valid deposit value check');

  //
  // ERC20 Token Deposit
  //

  // Make multiple valid deposits same block
  const erc20Mint = await token.mint(address, 2400);
  const erc20Approval = await token.approve(contract.address, 2400);

  // Check Approcal was Success
  eq((await getReceipt(erc20Approval.hash)).status, 1, 'erc20 approval success');

  // Make ERC20 Deposit via Contract
  const erc20Deposit = await contract.deposit(address, token.address, 2400, {
    gasLimit: big('5000000'),
  });
  const erc20DepositReceipt = await getReceipt(erc20Deposit.hash);

  // Check Logs
  const logsProduced = (await getReceipt(erc20Deposit.hash)).logs;
  const parsedLog = FuelInterface.parseLog(logsProduced[2]);

  eq(logsProduced.length, 3, 'logs produced for token correct length');
  eq(parsedLog.values.account, address, 'log account');
  eq(parsedLog.values.token, token.address, 'log token');
  eq(parsedLog.values.amount, 2400, 'log amount');

  // Get Deposit Value from State
  const erc20DepositValue = await contract.deposits(constructDepositHashID({
    account: address,
    token: token.address,
    ethereumBlockNumber: big(erc20DepositReceipt.blockNumber),
  }));

  // Check deposit value
  eq(erc20DepositValue, 2400, 'erc20 deposit');
  eq(await token.balanceOf(contract.address), 2400, 'tokens transfered');

  //
  // Multiple Valid Deposit Checks
  //

  // Make multiple valid deposits same block
  const multiDepositResult = await utility.makeDeposits(contract.address,
    [
      address, address, // Same Address
    ], [
      emptyAddress, emptyAddress, // Ether Deposit
    ], [
      big(2400), big(4700),
    ], {
      value: big(2400).add(4700), // Value Specified
      gasLimit: loadsOfGas,
    });

  // Deposit B
  const multiDepositReceipt = await getReceipt(multiDepositResult.hash);

  // Get Deposit Value from State
  const multiDepositValue = await contract.deposits(constructDepositHashID({
    account: address,
    token: emptyAddress,
    ethereumBlockNumber: big(multiDepositReceipt.blockNumber),
  }));

  // Check multi deposit
  eq(big(2400).add(4700), multiDepositValue, 'multi deposit value');

  //
  // Multiple Valid Deposit Different Tokens
  //

  // Make multiple valid deposits same block
  const mintToken = await token.mint(token.address, 4700, {
    gasLimit: loadsOfGas,
  });
  const multiTokenDepositResult = await utility.makeDeposits(contract.address,
    [
      address, address, // Same Address
    ], [
      emptyAddress, token.address, // Ether / ERC20 Deposit
    ], [
      big(2100), big(4700),
    ], {
      value: big(2100),
      gasLimit: loadsOfGas,
    });

  // Deposit B
  const multiTokenDepositReceipt = await getReceipt(multiTokenDepositResult.hash);

  // Get Deposit Value from State
  const multiTokenEtherValue = await contract.deposits(constructDepositHashID({
    account: address,
    token: emptyAddress,
    ethereumBlockNumber: big(multiTokenDepositReceipt.blockNumber),
  }));

  // Get Deposit Value from State
  const multiTokenERC20Value = await contract.deposits(constructDepositHashID({
    account: address,
    token: token.address,
    ethereumBlockNumber: big(multiTokenDepositReceipt.blockNumber),
  }));

  // Check multi deposit
  eq(big(2100), multiTokenEtherValue, 'multi deposit ether value');
  eq(big(4700), multiTokenERC20Value, 'multi deposit erc20 value');
});
