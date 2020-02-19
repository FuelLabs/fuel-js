const { Wallet, utils } = require('../index');

const { faucet, transfer, listen, balance, tokens, address } = new Wallet({
   signer: new utils.SigningKey(utils.randomBytes(32)),
   api: 'https://fuel-lambda.fuellabs.now.sh/',
});

(async ()=>{
  await listen(async () => {
    console.log('Balance', utils.formatEther(await balance(tokens.fakeDai)));
  });

  await faucet();

  await transfer(500, tokens.fakeDai, address);

  console.log('done!');
})();
