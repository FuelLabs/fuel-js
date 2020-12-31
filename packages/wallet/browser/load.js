const regeneratorRuntime = require("regenerator-runtime");
// const Api = require('@fuel-js/api');
// const fuel = require('../dist/fuel.umd.min.js');
const fuel = require('../src/index');

// import fuel from "http://localhost:1234/fuel.umd.js";

(async () => {
    const pk = fuel.utils.hexlify(fuel.utils.randomBytes(32));

    const network = 'rinkeby';

    // create a new wallet with a new key
    const wallet = new fuel.Wallet(null, {
        privateKey: pk,
        network,
    });

    console.log('starting faucet for wallet', wallet.address);

    // get yourself some fake Moons
    await wallet.faucet();

    // establish faucet token id
    const faucetToken = fuel.constants.faucetToken;

    // Create 5 wallets.
    const wallets = (new Array(20)).fill(0).map(() => new fuel.Wallet(null, {
        privateKey: fuel.utils.hexlify(fuel.utils.randomBytes(32)),
        network,
    }));

    // Wallet of wallets.
    console.log('setting up wallets');
    for (const _wallet of wallets) {
        // send yourself some faucet token Tx to each address.
        await wallet.transfer(faucetToken, _wallet.address, '1', {
            units: 'ether',
        });
    }

    // 100 per wallet.
    async function sendLots(_wallet) {
        console.log('starting send load for wallet', _wallet.address);

        for (var k = 0; k < 100; k++) {
            // send yourself some faucet token
            const tx = await _wallet.transfer(faucetToken, fuel.utils.emptyAddress, '.01', {
                units: 'ether',
            });

            // get your fake moons balance
            console.log(`check out your tx: https://${network}.fuel.sh/tx/${tx.transactionId}`);
        }
    }

    // For each wallet send a bunch of tx.s
    await Promise.all(
        wallets.map(sendLots),
    );

    // get your fake moons balance
    console.log('my balance: ',
    await wallet.balance(faucetToken, { format: 'ether' }));

    for (var k = 0; k < 100; k++) {

        // send yourself some faucet token
        const tx = await wallet.transfer(faucetToken, fuel.utils.emptyAddress, '.1', {
            units: 'ether',
        });
        
        // get your fake moons balance
        console.log(`check out your tx: https://${network}.fuel.sh/tx/${tx.transactionId}`);

    }

})();
