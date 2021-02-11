const { test, utils } = require('@fuel-js/environment');
const ethers = require('ethers');
const refill = require('../index');

module.exports = test('gasPrice', async t => {
  const fakeWalletProvider = {
    provider: {
      getBalance: () => { throw new Error('yammed'); },
    },
  };
  await t.catch(refill(fakeWalletProvider, [utils.emptyAddress], {}));
  await t.catch(refill());

  let accounts = (new Array(128))
    .fill(0)
    .map(v => (new ethers.Wallet(utils.randomBytes(32), t.getProvider())));
  const addresses = accounts.map(v => v.address);

  for (const account of addresses) {
    t.equalBig(await t.getProvider().getBalance(account), 0, 'balance empty');
  }

  const target = utils.parseEther('1.0');

  await refill(t.getWallets()[0], addresses, target);

  for (const account of addresses) {
    t.equalBig(await t.getProvider().getBalance(account), target, 'balance full');
  }

  const acc = new ethers.Wallet(accounts[47].privateKey, t.getProvider());

  const rec = await acc.sendTransaction({
    to: utils.emptyAddress,
    value: utils.parseEther('.30'),
    gasLimit: 30000,
    gasPrice: await t.getProvider().getGasPrice(),
  });
  await rec.wait();

  t.ok((await t.getProvider().getBalance(addresses[47])).eq(target) !== true, 'balance not 1 ether');

  await refill(t.getWallets()[0], addresses, target);

  for (const account of addresses) {
    t.equalBig(await t.getProvider().getBalance(account), target, 'balance full');
  }
});
