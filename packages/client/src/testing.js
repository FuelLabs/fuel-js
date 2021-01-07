const app = require('./app');
const { test, utils, overrides } = require('@fuel-js/environment');
const { ERC20, OwnedProxy, Fuel } = require('@fuel-js/contracts');
const database = require('@fuel-js/database');
const { copy } = require('@fuel-js/down');
const leveldown = require('leveldown');
const ethers = require('ethers');
const schema = require('@fuel-js/interface');
const faucetPlugin = require('./faucetPlugin');

test('testing node', async t => {
    // Setup Addresses
    const producer = t.wallets[0].address;
    const producerWallet = t.wallets[0];
    const cold = t.wallets[1].address;
    const coldWallet = t.wallets[1];
    const userA = producer; // t.wallets[2].address;
    const userAWallet = producerWallet; // t.wallets[2];
    const userB = t.wallets[3].address;
    const userBWallet = t.wallets[3];

    // Produce the Block Producer Proxy.
    const proxy = await t.deploy(OwnedProxy.abi, OwnedProxy.bytecode, [
        producer,
        cold,
    ]);

    // Produce Fuel and the Genesis Hash.
    const genesisHash = utils.keccak256('0xdeadbeaf');
    const contract = await t.deploy(Fuel.abi, Fuel.bytecode, [
        proxy.address,
        70, // finalization delay at 20
        4,
        4,
        utils.parseEther('1.0'),
        "Fuel",
        "1.0.0",
        0,
        genesisHash,
    ]);

    // Set proxy target to Fuel.
    const coldProxy = proxy.connect(coldWallet);
    await t.wait(coldProxy.setTarget(contract.address, overrides),
        'set target', OwnedProxy.errors);

    // Commit addresses.
    await t.wait(contract.commitAddress(producer, overrides),
        'commit addresses', Fuel.errors);
    await t.wait(contract.commitAddress(t.wallets[1].address, overrides),
        'commit addresses', Fuel.errors);

    // Produce the token.
    const totalSupply = utils.parseEther('100000000000000.00');
    const erc20 = await t.deploy(ERC20.abi, ERC20.bytecode, [producer, totalSupply]);

    // Make a Deposit for User A.
    const userAFunnel = await contract.funnel(producer);
    const userAAmount = utils.parseEther('100000000000000');

    // Trander for User A Deposit Funnel.
    await t.wait(erc20.transfer(userAFunnel, userAAmount, overrides), 'erc20 transfer');
    await t.wait(t.wallets[0].sendTransaction({
        ...overrides,
        value: userAAmount,
        to: userAFunnel,
    }), 'ether to funnel');

    // User A Deposit Ether.
    await t.wait(contract.deposit(userA, utils.emptyAddress, overrides),
        'ether deposit', Fuel.errors);

    // User A Deposit Token.
    await t.wait(contract.deposit(producer, erc20.address, overrides),
        'ether deposit', Fuel.errors);

    // Producer funnel.
    const producerAFunnel = await contract.funnel(producer);
    await t.wait(t.wallets[0].sendTransaction({
        ...overrides,
        value: userAAmount,
        to: producerAFunnel,
    }), 'ether to producer funnel');

    // Producer Deposit.
    await t.wait(contract.deposit(producer, utils.emptyAddress, overrides),
        'producer deposit', Fuel.errors);

    // If testing environment.
    let _console = null;
    if (process.env.FUEL_ENV === 'testing') {
        _console = {
            log: () => {},
            error: console.error,
        };
    }

    // Start the main app loop.
    await app({
        operator: producerWallet,
        proxy,
        console: _console,
        contract: contract.address,
        // db: ,
        setup: network => {
            return {
                localDB: () => database(copy(
                    leveldown('.fueldb-remote-' + network),
                    leveldown('.fueldb-' + network),
                )),
            };
        },
        plugin: async (state, config) => {
            // Set the fees
            await config.db.put([
                schema.db.fee,
                0,
            ], utils.parseEther('.00001'));
            await config.db.put([
                schema.db.fee,
                1,
            ], utils.parseEther('.00001'));

            // Run the faucet
            await faucetPlugin(state, config);

            // Increase block number.
            await t.increaseBlock(1);
        },
        increaseBlock: t.increaseBlock,
        provider: new ethers.providers.JsonRpcProvider('http://localhost:8545', 'unspecified'),
        network: 'unspecified',
        minimumTransactionsPerRoot: 2000,
        pullLimit: 12000,
        forceClear: true,
        feeEnforcement: true,
    })
    .then(console.log)
    .catch(console.error);
});