const regeneratorRuntime = require("regenerator-runtime");
// const Api = require('@fuel-js/api');
// const fuel = require('../dist/fuel.umd.min.js');
const fuel = require('../src/index');

// import fuel from "http://localhost:1234/fuel.umd.js";

(async () => {
  const pk = fuel.utils.hexlify(fuel.utils.randomBytes(32));

  // create a new wallet with a new key
  const wallet = new fuel.Wallet(window.ethereum, {
    // privateKey: pk,
    network: 'rinkeby',
  });

  console.log('starting faucet for wallet', wallet.address);

  // get yourself some fake Moons
  await wallet.faucet();

  // establish faucet token id
  const faucetToken = fuel.constants.faucetToken;

  // get your fake moons balance
  console.log('my balance: ',
    await wallet.balance(faucetToken, { format: 'ether' }));

  // send yourself some faucet token
  const tx = await wallet.transfer(faucetToken, wallet.address, '4.5', { units: 'ether' });

  // get your fake moons balance
  console.log('check out your tx: https://rinkeby.fuel.sh/tx/' + tx.transactionId);
})();
