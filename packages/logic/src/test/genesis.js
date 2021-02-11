const { test } = require('@fuel-js/environment');
const defaults = require('./defaults');
const config = require('./config.local');
const genesis = require('../genesis');
const { Fuel } = require('@fuel-js/contracts');

module.exports = test('genesis', async t => {
  try {

    // check if genesis function grabs correct starting Fuel block number
    const producer = t.getWallets()[0].address;
    const contract = await t.deploy(Fuel.abi, Fuel.bytecode, defaults(producer));
    const settings = config({
      network: 'unspecified',
      provider: t.getProvider(),
      contract,
    });

    const deployBlockNumber = (await contract.deployTransaction.wait()).blockNumber;

    t.ok(deployBlockNumber > 0, 'block real');
    t.equalBig(deployBlockNumber, await genesis(settings), 'block number');

  } catch (testError) { console.error(testError); }
});
