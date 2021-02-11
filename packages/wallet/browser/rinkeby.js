const regeneratorRuntime = require("regenerator-runtime");
const fuel = require('../src/index');
const Api = require('@fuel-js/api');
const { setInterval, setTimeout } = require("timers");

(async () => {
    // Create a new wallet with a new key
    const wallet = new fuel.Wallet(window.ethereum, {
        network: 'rinkeby', 
    });

    wallet.on('deposit-funnel-receipt', console.log);
    wallet.on('deposit-commmitment-receipt', console.log);
    wallet.on('deposit', console.log);

    const api = new Api('rinkeby');

    await wallet.sync();

    await wallet.faucet();

    console.log(await wallet.transfer(
        1,
        '0x73813909482106190c0e0Fa220028d7787c221Dc',
        await wallet.balance(1),
    ));

})();