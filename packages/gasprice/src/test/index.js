const { test, utils, overrides } = require('@fuel-js/environment');
const ethers = require('ethers');
const gasPrice = require('../index');

module.exports = test('gasPrice', async t => {
  try {
    const provider = ethers.getDefaultProvider('mainnet', {
      infura: process.env['fuel_v1_default_infrua'],
      ...(process.env['fuel_v1_default_etherscan'] ? { etherscan: process.env['fuel_v1_default_etherscan'] } : {}),
      ...(process.env['fuel_v1_default_alchemy'] ? { alchemy: process.env['fuel_v1_default_alchemy'] } : {})
    });

    const prices = await gasPrice(provider);
    console.log('network', utils.formatUnits(prices.network, 'gwei'));
    console.log('fast', utils.formatUnits(prices.fast, 'gwei'));
    console.log('safe', utils.formatUnits(prices.safe, 'gwei'));
    console.log('median', utils.formatUnits(prices.median, 'gwei'));
    console.log('low', utils.formatUnits(prices.low, 'gwei'));

    const localPrices = await gasPrice(t.getProvider());
    console.log('network', utils.formatUnits(localPrices.network, 'gwei'));
    console.log('fast', utils.formatUnits(localPrices.fast, 'gwei'));
    console.log('safe', utils.formatUnits(localPrices.safe, 'gwei'));
    console.log('median', utils.formatUnits(localPrices.median, 'gwei'));
    console.log('low', utils.formatUnits(localPrices.low, 'gwei'));
  } catch (error) {
    console.error(error);
  }
});
