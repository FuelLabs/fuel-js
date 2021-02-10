const { test, utils } = require('@fuel-js/environment');
const schema = require('@fuel-js/interface');
const ethers = require('ethers');
const fuel = require('../index');

module.exports = test('wallet', async t => {
  try {
    const network = 'unspecified';
    const path = 'http://localhost:3000';

    // Special API key.
    const apiKey = utils.hexDataSlice(
      utils.keccak256('0xbebebe'),
      12,
      32,
    );

    const faucetWallet = new fuel.Wallet(null, {
      network,
      privateKey: t.wallets[0].privateKey,
      path,
      apiKey,
    });

    await faucetWallet.sync();

    for (var k = 0; k < 2; k++) {

    const seedPhraseWallet = new ethers.Wallet.createRandom();
    const walletMnumonic = new fuel.Wallet(null, {
      network,
      privateKey: seedPhraseWallet,
      path,
      apiKey,
    });

    for (var i = 0; i < 100; i++) {
      try {
        await walletMnumonic._get([
          schema.db.token,
          1,
        ]);

        break;
      } catch (err) {
        await utils.wait(2000);
      }
    }

    t.equal(seedPhraseWallet.address, walletMnumonic.address, 'seed phrase wallet');

    await walletMnumonic.faucet();

    t.equalBig(await walletMnumonic.balance(1), utils.parseEther('1000'), 'balance ether');

    await walletMnumonic.transfer(1, seedPhraseWallet.address, 500, {
      sync: false,
      path,
    });

    walletMnumonic.off();

    await walletMnumonic.db.close();

    const jsonProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    const walletA = new fuel.Wallet(jsonProvider, {
      privateKey: utils.hexlify(utils.randomBytes(32)),
      network,
      path,
      apiKey,
    });


    const walletC = new fuel.Wallet(jsonProvider, {
        privateKey: t.wallets[1].privateKey,
        network,
        path,
        apiKey,
    });

    await walletC.faucet();

    // Get the transaction Id for this transfer.
    const txTokenId = 1;
    const txAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e';
    const txAmount = utils.parseEther('1');
    const transactionId = await walletC.transfer(txTokenId, txAddress, txAmount, {
        transactionId: true,
    });

    // Commit the witness.
    let commitTx = await walletC.contract.commitWitness(transactionId, {
        gasLimit: 200000,
    });

    // Wait for the commitment to happen.
    commitTx = await commitTx.wait(20);

    // Transfer with caller.
    t.ok(await walletC.transfer(txTokenId, txAddress, txAmount, {
        caller: commitTx.events[0].args,
    }));

    console.log('wallet a address', walletA.address);

    await walletA.sync();

    t.equal(walletA.address, walletA.key.address, 'address');
    t.equal(walletA.network.name, network, 'network');

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

    t.ok(await walletA.transfer(tokenAddr, '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e', utils.parseEther('1')));

    t.equalBig(await walletA.balance(tokenAddr), utils.parseEther('896'), 'balance token address sync');

    walletA.off();

    await walletA.db.close();

    await utils.wait(1000);
  }

  } catch (testError) { console.error(testError); }
});
