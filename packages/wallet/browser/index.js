const regeneratorRuntime = require("regenerator-runtime");
const fuel = require('../src/index');

(async () => {
  const wallet2 = new fuel.Wallet(window.web3.currentProvider, {
    // key: fuel.utils.hexlify(fuel.utils.randomBytes(32)),
    // address: fuel.utils.emptyAddress,
    network: 'rinkeby',
  });

  // wallet.on('input', console.log);

  const log = console.log;

  wallet2.on('input', log);

  const testToken = await wallet2._token(1);

  // console.log(await wallet2.faucet());

  // console.log('balance', await wallet2.balance(testToken, { sync: false }));

  /*
  const { transactionId } = await wallet2.transfer(testToken, wallet2.address, fuel.utils.parseEther('.4'));

  console.log('balance', await wallet2.balance(testToken, { sync: false }));
  */

  // await wallet2.transfer(testToken, fuel.utils.emptyAddress, fuel.utils.parseEther('.4'), { sync: false });

  await wallet2.sync();

  console.log('balance', fuel.utils.formatUnits(await wallet2.balance(testToken, {
    sync: false,
  }), 'ether'));

  for (var i = 0; i < 1; i++) {
    console.time('transfer');
    await wallet2.transfer(testToken, fuel.utils.emptyAddress, fuel.utils.parseEther('.001'), {
      sync: false,
    });
    console.time('transferEnd');
  }

  console.log('balance', fuel.utils.formatUnits(await wallet2.balance(testToken), 'ether'));



  // console.log(await api.getTransactionByHash(transactionId));

  //console.log('balance', await wallet2.balance(testToken));


  /*
  console.log('balance', await wallet.balance(testToken));

  await wallet.faucet();

  console.log('balance', await wallet.balance(testToken));

  await wallet.transfer(testToken, wallet2.address, fuel.utils.parseEther('.4'));

  console.log('balance', await wallet.balance(testToken));
  */

  /*
  console.log('balance', await wallet.balance(testToken));

  console.log('wallet2 balance', await wallet2.balance(testToken));
  */

  /*
  console.log(await api.getBlockByHeight(1));

  console.log(await api.getRootByHash('0xd00971a9272c314d8752256e76a8391eb0d70a8a8d9bbcdfe46a78772c92748e'))

  console.log(await api.getAccount('0xeDed1D92A41cE3C6775e3F4bAF17036288044Eb6'));

  console.log(await api.getToken('0x01'));

  console.log(await api.getAddress('0x00'));

  console.log(await api.getAddressId('0x0000000000000000000000000000000000000000'));



  // blockHeight, rootIndex
  const hashes = await api.getTransactions(1, 0);

  // transactionHashId
  console.log(await api.getTransactionByHash(hashes[0]));
  */
})();
