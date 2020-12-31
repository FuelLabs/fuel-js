const { test, utils } = require('@fuel-js/environment');
const schema = require('@fuel-js/interface');
const Api = require('@fuel-js/api');
const ethers = require('ethers');
const fuel = require('../index');

module.exports = test('deposit', async t => {
  const network = 'unspecified';
  const path = 'http://localhost:3000';
  const jsonProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

  // Setup Addresses
  const producer = t.wallets[0].connect(jsonProvider);
  const cold = t.wallets[1].connect(jsonProvider);
  const userA = t.wallets[2].connect(jsonProvider);
  const userB = t.wallets[3].connect(jsonProvider);

  // Special API key.
  const apiKey = utils.hexDataSlice(
    utils.keccak256('0xbebebe'),
    12,
    32,
  );

  const api = new Api('unspecified', {
    url: 'http://localhost:3000',
  });

  const walletB = new fuel.Wallet(jsonProvider, {
      privateKey: utils.hexlify(utils.randomBytes(32)),
      network,
      path,
  });

  console.log('wallet b address', walletB.address);

  const etherDepositAmount = utils.parseEther('12.2');
  await t.wait(userA.sendTransaction({
    ...t.getOverrides(),
    value: etherDepositAmount,
    to: walletB.address,
  }), 'ether to funnel');

  t.equalBig(await jsonProvider.getBalance(walletB.address), etherDepositAmount, 'ether amount');

  await walletB.sync();

  t.equalBig(await walletB.balance(0), utils.parseEther('0'), 'wallet b no balance');

  const firstDepositAmount = etherDepositAmount.div(2);

  await walletB.deposit(utils.emptyAddress, firstDepositAmount);

  t.equalBig(await walletB.balance(0), firstDepositAmount, 'wallet b after first deposit');

  const fee = await walletB
    .estimateGasCost(0, walletB.address, firstDepositAmount.div(2));

  const transferResult = await walletB
    .transfer(0, walletB.address, firstDepositAmount.div(2));

  t.ok(transferResult, 'transfer full to self');

  t.equalBig(await walletB.balance(0), firstDepositAmount.sub(fee), 'wallet b after first deposit');

  await walletB.faucet();

  t.equalBig(await walletB.balance(1), utils.parseEther('1000.0'), 'wallet b after faucet');

  const fee2 = await walletB
    .estimateGasCost(1, walletB.address, utils.parseEther('1000').div(2));

  t.ok(await walletB.transfer(1, walletB.address, utils.parseEther('1000').div(2)), 'transfer full to self');

  t.equalBig(await walletB.balance(1), utils.parseEther('1000.0').sub(fee2), 'wallet b after faucet');

  const fee3 = await walletB
    .estimateGasCost(0, walletB.address, utils.parseEther('2.0'), { withdraw: true });

  t.ok(await walletB.withdraw(0, utils.parseEther('2.0')));

  t.equalBig(await walletB.balance(0), firstDepositAmount
    .sub(utils.parseEther('2.0'))
    .sub(fee3)
    .sub(fee), 'wallet b after first deposit');

  const preState = await api.getState();

  // Check state.
  let checkState = preState;

  const blockFinalization = await walletB.contract.FINALIZATION_DELAY();

  console.log('waiting for next finalization (might take a few minutes)...');

  // A few extra blocks. 
  const blockBuffer = 2;

  // Wait for block to be produced.
  while (checkState.properties.blockNumber()
    .get().lte(preState.properties.blockNumber().get().add(blockFinalization).add(blockBuffer))) {
    checkState = await api.getState();

    // Faucet this.
    try {
      await walletB.faucet();
    } catch (err) {}

    // Wait.;
    await utils.wait(1500);

    t.ok(1, 'ping');
  }

  await walletB.retrieve();

  walletB.off();

  await walletB.db.close();
});
