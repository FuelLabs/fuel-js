const { test, utils } = require('@fuel-js/environment');
const ethers = require('ethers');
const gasPrice = require('../index');

module.exports = test('gasPrice', async t => {
  // this produce will throw an error
  const fakeProducer = {
    getBlockNumber: () => { throw new Error('yammed'); },
  };
  await t.catch(gasPrice(fakeProducer), 'throw check');
  await t.catch(gasPrice(), 'no producer checks');

  // attempt with no txs
  const preTransactionPrices = await gasPrice(t.getProvider());
  console.log('network', utils.formatUnits(preTransactionPrices.network, 'gwei'));
  console.log('fast', utils.formatUnits(preTransactionPrices.fast, 'gwei'));
  console.log('safe', utils.formatUnits(preTransactionPrices.safe, 'gwei'));
  console.log('median', utils.formatUnits(preTransactionPrices.median, 'gwei'));
  console.log('low', utils.formatUnits(preTransactionPrices.low, 'gwei'));

  // simulate some block production
  for (var i = 0; i < 20; i++) {
    await t.getWallets()[0].sendTransaction({
      ...t.getOverrides(),
      to: utils.emptyAddress,
      value: 4500,
    });
    await t.getWallets()[0].sendTransaction({
      ...t.getOverrides(),
      to: utils.emptyAddress,
      value: 4500,
    });
    await t.increaseBlock(2);
  }

  // attempt with options
  const prices = await gasPrice(t.getProvider({ sampleSize: 3, sampleTarget: 10 }));
  console.log('network', utils.formatUnits(prices.network, 'gwei'));
  console.log('fast', utils.formatUnits(prices.fast, 'gwei'));
  console.log('safe', utils.formatUnits(prices.safe, 'gwei'));
  console.log('median', utils.formatUnits(prices.median, 'gwei'));
  console.log('low', utils.formatUnits(prices.low, 'gwei'));

  // attempt to get gas price with transactions and no options
  const localPrices = await gasPrice(t.getProvider());
  console.log('network', utils.formatUnits(localPrices.network, 'gwei'));
  console.log('fast', utils.formatUnits(localPrices.fast, 'gwei'));
  console.log('safe', utils.formatUnits(localPrices.safe, 'gwei'));
  console.log('median', utils.formatUnits(localPrices.median, 'gwei'));
  console.log('low', utils.formatUnits(localPrices.low, 'gwei'));
});
