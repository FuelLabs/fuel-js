const regeneratorRuntime = require("regenerator-runtime");
const fuel = require('../src/index');

(async () => {
    // Create a new wallet with a new key
    const wallet = new fuel.Wallet(window.ethereum, {
        // privateKey: pk,
        network: 'mainnet', 
    });

    wallet.on('deposit-funnel-receipt', console.log);
    wallet.on('deposit-commmitment-receipt', console.log);
    wallet.on('deposit', console.log);

    /*
    const pk = fuel.utils.hexlify(fuel.utils.randomBytes(32));
    const wallet2 = new fuel.Wallet(window.ethereum, {
        privateKey: pk,
        network: 'mainnet',
    });

    console.log('private key', pk);

    console.log(await wallet.transfer(
        0,
        wallet2.address,
        fuel.utils.parseEther('.0002'),
        {
            htlc: true,
            preImage: fuel.utils.keccak256('0xdeadbead'),
            expiry: 5000000,
        },
    ));
        */

    const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

    /*
    console.log(
        await wallet.deposit(
            usdcAddress,
            '0x1312d00', // fuel.utils.parseEther('20'),
            {
                gasLimit: 300000,
            },
        ),
    );

    console.log(await wallet.transfer(
        daiAddress,
        '0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C',
        fuel.utils.parseEther('.00002')));

    */
        /*
    console.log(await wallet.transfer(
        daiAddress,
        '0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C',
        fuel.utils.parseEther('.00002')));

    console.log(await wallet.transfer(
        daiAddress,
        '0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C',
        fuel.utils.parseEther('.00002')));

    /*
    console.log(
        await wallet.deposit(
            fuel.utils.emptyAddress,
            fuel.utils.parseEther('.001'),
            {
                gasLimit: 150000,
            },
        ),
    );
    */

})();
