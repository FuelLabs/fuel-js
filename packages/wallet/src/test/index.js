const { test, utils } = require('@fuel-js/environment');
const ethers = require('ethers');
const fuel = require('../index');

module.exports = test('wallet', async t => {
  try {

    const seedPhraseWallet = new ethers.Wallet.createRandom();
    const walletMnumonic = new fuel.Wallet(null, {
      network: 'rinkeby',
      privateKey: seedPhraseWallet,
    });

    t.equal(seedPhraseWallet.address, seedPhraseWallet.address, 'seed phrase wallet');
    await walletMnumonic.faucet();
    await walletMnumonic.transfer(1, seedPhraseWallet.address, 500, {
      sync: false,
    });

    walletMnumonic.off();

    await walletMnumonic.db.close();

    const walletA = new fuel.Wallet(null, {
      network: 'rinkeby',
    });

    await walletA.sync();

    t.equal(walletA.address, walletA.key.address, 'address');
    t.equal(walletA.network.name, 'rinkeby', 'network');

    t.equalBig(await walletA.balance(0), 0, 'balance ether');

    await walletA.sync();

    t.equalBig(await walletA.balance(1), 0, 'balance token');

    await walletA.faucet();

    t.equalBig(await walletA.balance(1), utils.parseEther('1000'), 'balance token');

    const tokenAddr = await walletA._token(1);

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('1000'), 'balance token address');

    t.equalBig(await walletA.balance(tokenAddr, {
      sync: false,
    }), utils.parseEther('1000'), 'balance no sync');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('1000'), 'balance no sync id');

    t.catch(walletA.transfer(1, walletA.address, utils.parseEther('0')), 'invalid amount');

    t.catch(walletA.transfer(2, walletA.address, utils.parseEther('100')), 'invalid token');

    t.ok(await walletA.transfer(1, walletA.address, utils.parseEther('1000')), 'transfer full to self');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('1000'), 'balance no sync id');

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('1000'), 'balance token address');

    t.ok(await walletA.transfer(tokenAddr, walletA.address, utils.parseEther('1000')), 'transfer full to self');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('1000'), 'balance no sync id');

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('1000'), 'balance token address');

    t.ok(await walletA.transfer(tokenAddr, walletA.address, utils.parseEther('500')), 'transfer 500 to self');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('1000'), 'balance no sync id');

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('1000'), 'balance token address');

    t.ok(await walletA.transfer(tokenAddr, utils.emptyAddress, utils.parseEther('1')), 'transfer 1 to null');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('999'), 'balance no sync id');

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('999'), 'balance token address');

    t.ok(await walletA.transfer(tokenAddr, utils.emptyAddress, utils.parseEther('100')), 'transfer 1 to null');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('899'), 'balance no sync id');

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('899'), 'balance token address');

    t.ok(await walletA.transfer(tokenAddr, utils.emptyAddress, utils.parseEther('1')), 'transfer 1 to null');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('898'), 'balance no sync id');

    t.ok(await walletA.transfer(tokenAddr, utils.emptyAddress, utils.parseEther('1')), 'transfer 1 to null');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('897'), 'balance no sync id');

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('897'), 'balance token address sync');

    const returnTransfer = await walletA.transfer(tokenAddr, walletA.address, utils.parseEther('1'), {
      return: '0xdeafbeef',
    });

    t.ok(returnTransfer, 'transfer 1 to null');

    t.equalBig(await walletA.balance(1, {
      sync: false,
    }), utils.parseEther('897'), 'balance no sync id');

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('897'), 'balance token address sync');

    walletA.off();

    await walletA.db.close();

  } catch (testError) { console.error(testError); }
});
