const { Wallet, providers, utils, dbs } = require('../index');

(async ()=>{
  let privateKey = process.env.test_privateKey3; // test_privateKey3
  const wallet = new Wallet({
     signer: new utils.SigningKey(privateKey),
     provider: new providers.InfuraProvider('rinkeby', '3cfef7d48afb4f26be007e5c07260d9a'), // 'https://rinkeby.infura.io/v3/3cfef7d48afb4f26be007e5c07260d9a'),
     network: 'rinkeby',
     chainId: 4,
  });

  const moonTokenAddress = '0xdf82c9014f127243ce1305dfe54151647d74b27a';
  const brickTokenAddress = '0xe0d8d7b8273de14e628d2f2a4a10f719f898450a';

  await wallet.sync();

  await wallet.listen(async () => {
    console.log('Balance', utils.formatEther(await wallet.balance(brickTokenAddress)));
  });

  try {
    // console.log((await wallet.inputs(moonTokenAddress)).rows.map(v => v.amount));

    // await wallet.deposit(5000, moonTokenAddress);
    // await wallet.deposit(50000, brickTokenAddress);

    console.log('moon', (await wallet.balance(moonTokenAddress)).toNumber());
    console.log('brick', (await wallet.balance(brickTokenAddress)).toNumber());

    console.log(await wallet.rate(50, brickTokenAddress, moonTokenAddress));
    console.log(await wallet.swap(50, brickTokenAddress, moonTokenAddress));

    // await wallet.transfer(10, moonTokenAddress, wallet.address);

    console.log('moon', (await wallet.balance(moonTokenAddress)).toNumber());
    console.log('brick', (await wallet.balance(brickTokenAddress)).toNumber());

    // console.log(wallet.address);
    // console.log(await wallet.balance(brickTokenAddress));
    // await wallet.transfer(50000, brickTokenAddress, wallet.address);
    // console.log(await wallet.balance(brickTokenAddress));
    // await wallet.faucet();
    // console.log(await wallet.balance(moonTokenAddress));
    // await wallet.deposit(50000, brickTokenAddress);
    // console.log(await wallet.balance(brickTokenAddress));
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
