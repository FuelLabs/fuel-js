const { test, utils } = require('@fuel-js/environment');
const abi = require('@fuel-js/abi');
const interface = require('@fuel-js/interface');
const bytecode = require('@fuel-js/bytecode');
const protocol = require('@fuel-js/protocol');
const struct = require('@fuel-js/struct');
const errors = require('@fuel-js/errors');
const defaults = require('./defaults');
const config = require('./config.local');
const sync = require('../sync');
const transact = require('../transact');
const streamToArray = require('stream-to-array');

async function state(t = {}, opts = {}) {
  try {

    // check if sync dbs the right values
    const producer = t.getWallets()[0].address;
    const contract = await t.deploy(abi.Fuel, bytecode.Fuel, defaults(producer));
    const settings = config({
      network: 'unspecified',
      provider: t.getProvider(),
      contract,
      continue: () => false,
      produce: true,
      operators: [
        t.getWallets()[0].privateKey
      ],
    });

    let tx = await contract.deployTransaction.wait();

    await sync(settings);

    // funnel producer
    let funnel = await contract.funnel(producer);
    let depositTokenId = 0;
    let depositToken = utils.emptyAddress;
    let depositOwner = producer;
    let depositAmount = utils.parseEther('1.3');
    let transferTx = await t.wait(t.getWallets()[0].sendTransaction({
      ...t.getOverrides(),
      value: depositAmount,
      to: funnel,
    }), 'ether to funnel deposit');
    let depositProof = new protocol.deposit.Deposit({
      token: depositTokenId,
      owner: depositOwner,
      blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
      value: depositAmount,
    });
    let depositTx = await t.wait(contract.deposit(depositOwner, depositToken, t.getOverrides()),
      'ether deposit', errors.Fuel);

    await sync(settings);

    let etherDeposit = deposit = protocol.deposit.Deposit(
      await settings.db.get([
        interface.db.deposit,
        depositProof.properties.blockNumber().get(),
        depositTokenId,
        depositOwner,
      ]),
      null,
      protocol.addons.Deposit);
    let depositAddon = deposit.getAddon();

    t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit proof');

    t.ok(1, '***testing ERC20 deposit***');

    const totalSupply = utils.bigNumberify('0xFFFFFFFFFFFFFFFFFFFFFF');
    const erc20 = await t.deploy(abi.ERC20, bytecode.ERC20, [producer, totalSupply]);

    depositToken = erc20.address;
    depositTokenId = 1;
    depositAmount = utils.parseEther('1.43312');
    transferTx = await t.wait(erc20.transfer(funnel, depositAmount, t.getOverrides()), 'erc20 transfer');
    depositProof = new protocol.deposit.Deposit({
      token: depositTokenId,
      owner: depositOwner,
      blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
      value: depositAmount,
    });
    depositTx = await t.wait(contract.deposit(depositOwner, depositToken, t.getOverrides()),
      'erc20 deposit', errors.Fuel);

    await sync(settings);

    deposit = protocol.deposit.Deposit(
      await settings.db.get([
        interface.db.deposit,
        depositProof.properties.blockNumber().get(),
        depositTokenId,
        depositOwner,
      ]),
      null,
      protocol.addons.Deposit);
    depositAddon = deposit.getAddon();

    t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit proof');

    let outputs = [ etherDeposit ];

    let unsigned = protocol.transaction.Unsigned({
      inputs: [ protocol.inputs.InputDeposit({
        owner: depositOwner,
      }) ],
      outputs: [ protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('1.0'),
        token: 0,
      }),
      protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('.3'),
        token: 0,
      }) ],
      data: [
        outputs[0].keccak256(),
      ],
      signatureFeeToken: 0,
      fee: 0,
    });

    let witnesses = [ await protocol.witness.Signature(t.getWallets()[0], unsigned, contract, 0) ];

    await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);
  } catch (stateError) {
    throw new utils.ByPassError(stateError);
  }
}

module.exports = test('transact', async t => {
  try {
    await state(t, {});

  } catch (testError) { console.error(testError); }
});
