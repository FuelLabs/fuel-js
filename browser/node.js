const { Wallet, providers, utils, dbs } = require('../index');

(async ()=>{
  let privateKey = process.env.test_privateKey;
  const wallet = new Wallet({
     signer: new utils.SigningKey(privateKey),
     provider: new providers.InfuraProvider('rinkeby', '3cfef7d48afb4f26be007e5c07260d9a'), // 'https://rinkeby.infura.io/v3/3cfef7d48afb4f26be007e5c07260d9a'),
     network: 'rinkeby',
     chainId: 4,
  });

  const moonTokenAddress = '0xdf82c9014f127243ce1305dfe54151647d74b27a';

  await wallet.sync();

  await wallet.listen(async () => {
    console.log('Balance', utils.formatEther(await wallet.balance(moonTokenAddress)));
  });

  // console.log(await wallet.balance(wallet.tokens['fakeDai']));

  try {
    // await wallet.faucet();
    await wallet.deposit(50000, moonTokenAddress);
    console.log(await wallet.balance(moonTokenAddress));
  } catch (err) {
    console.error(err);
  }

  // await db.close();

  /*
  await faucet();

  await transfer(500, tokens.fakeDai, address);

  console.log('done!');
  */
})();
