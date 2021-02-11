const regeneratorRuntime = require("regenerator-runtime");
const fuel = require('../src/index');
const Api = require('@fuel-js/api');

(async () => {
    // Create a new wallet with a new key
    const wallet = new fuel.Wallet(window.ethereum, {
        network: 'mainnet', 
    });

    wallet.on('deposit-funnel-receipt', console.log);
    wallet.on('deposit-commmitment-receipt', console.log);
    wallet.on('deposit', console.log);

    const api = new Api('mainnet');

    /*
    const pk = fuel.utils.hexlify(fuel.utils.randomBytes(32));
    const wallet2 = new fuel.Wallet(window.ethereum, {
        privateKey: pk,
        network: 'mainnet',
    });

    console.log('private key', pk);
    */

    await wallet.sync();

    const dest = '0xc1e0Dc2deE0fb13000452259CBCD5b1a9023b4Fa';
    const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';

    console.log(
        await wallet.deposit(
            fuel.utils.emptyAddress,
            fuel.utils.parseEther('.1'),
        ),
    );

    /*
    console.log(fuel.utils.formatUnits(await wallet.estimateGasCost(
        usdcAddress,
        dest,
        fuel.utils.parseUnits('.0001', 6),
    ), 6));

    for (var i = 0; i < 30; i++) {
        console.log(await wallet.transfer(
            usdcAddress,
            dest,
            fuel.utils.parseUnits('.0001', 6),
        ));
        console.log(await wallet.transfer(
            usdtAddress,
            dest,
            fuel.utils.parseUnits('.0001', 6),
        ));
    }
    */

    /*
    console.log(
        await wallet.deposit(
            daiAddress,
            fuel.utils.parseEther('2'),
            {
                skipTransfer: true,
            },
        ),
    );

    console.log(await wallet.transfer(
        daiAddress,
        '0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C',
        fuel.utils.parseEther('.00002')));
    */

    /*
    console.log(
        await wallet.deposit(
            daiAddress,
            fuel.utils.parseEther('2'),
        ),
    );

    console.log(await wallet.transfer(
        daiAddress,
        '0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C',
        fuel.utils.parseEther('.00002')));

    return;

    console.log(
        await wallet.deposit(
            daiAddress,
            fuel.utils.parseEther('.1'),
        ),
    );

   console.log(
        await wallet.deposit(
            usdtAddress,
            fuel.utils.parseUnits('1', 6),
            {
                gasLimit: 300000,
            },
        ),
    );
    */

    /*
    */

    /*
    for (var i = 0; i < 30; i++) {
        console.log(await wallet.transfer(
            usdcAddress,
            dest,
            fuel.utils.parseUnits('.0435', 6),
        ));
        console.log(await wallet.transfer(
            usdtAddress,
            dest,
            fuel.utils.parseUnits('.0435', 6),
        ));
    }
    */

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
