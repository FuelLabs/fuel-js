const { Wallet, providers, utils, dbs } = require('../index');

(async ()=>{
  let privateKey = process.env.test_privateKey; // test_privateKey3
  const wallet = new Wallet({
     signer: new utils.SigningKey(privateKey),
     provider: new providers.InfuraProvider('rinkeby', '3cfef7d48afb4f26be007e5c07260d9a'), // 'https://rinkeby.infura.io/v3/3cfef7d48afb4f26be007e5c07260d9a'),
     network: 'rinkeby',
     chainId: 4,
  });

  const moonTokenAddress = '0xf4130d9b5a3b9cf81ab1e4f4bbd9a6ca6c28de17';
  const brickTokenAddress = '0x6292f268e6d2e9952d759e6fd7571024bb04da3f';

  await wallet.sync();

  await wallet.listen(async () => {
    console.log('Balance', utils.formatEther(await wallet.balance(brickTokenAddress)));
  });

  try {
    // console.log(await wallet.inputs(moonTokenAddress));
    // console.log(await wallet.inputs(brickTokenAddress));

    console.log(await wallet.tokenID(moonTokenAddress));
    console.log(await wallet.tokenID(brickTokenAddress));

    // await wallet.deposit(utils.parseEther('1000000'), moonTokenAddress);
    // await wallet.deposit(utils.parseEther('1000000'), brickTokenAddress);

    console.log('moon', (await wallet.balance(moonTokenAddress)));
    console.log('brick', (await wallet.balance(brickTokenAddress)));

    // console.log(wallet.address);

    // console.log(await wallet.rate(50, brickTokenAddress, moonTokenAddress));
    // console.log(await wallet.swap(50, moonTokenAddress, brickTokenAddress));

    // await wallet.transfer(utils.parseEther('1000000'), moonTokenAddress, wallet.address);
    // await wallet.transfer(utils.parseEther('1000000'), brickTokenAddress, wallet.address);

    console.log('moon', (await wallet.balance(moonTokenAddress)));
    console.log('brick', (await wallet.balance(brickTokenAddress)));

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
