const app = require('./app');
const { test, utils, overrides } = require('@fuel-js/environment');
const { ERC20, OwnedProxy, Fuel } = require('@fuel-js/contracts');
const database = require('@fuel-js/database');
const { copy } = require('@fuel-js/down');
const leveldown = require('leveldown');
const ethers = require('ethers');
const schema = require('@fuel-js/interface');
const faucetPlugin = require('./faucetPlugin');
const Leader = require('../../logic/src/test/artifacts/LeaderSelection.json');
const Factory = require('../../logic/src/test/artifacts/TokenReleaseFactory.json');
const Multisig = require('../../logic/src/test/artifacts/Multisig.json');
const MultisigData = require('./test/artifacts/multisig.js');

test('testing leader node', async t => {
    // Setup Addresses
    const producer = t.wallets[0].address;
    const producerWallet = t.wallets[0];
    const cold = t.wallets[1].address;
    const coldWallet = t.wallets[1];
    const userA = producer; // t.wallets[2].address;
    const userAWallet = producerWallet; // t.wallets[2];
    const userB = t.wallets[3].address;
    const userBWallet = t.wallets[3];

   // Create multisig.
    const multisig = await t.deploy([
        'function addOwner(address owner)',
        'function submitTransaction(address,uint256,bytes)',
        'constructor(address[] _owners, uint _required)',
    ], MultisigData.bytecode, [
        [producer],
        1,
    ]);

    // Produce the Block Producer Proxy.
    const proxy = await t.deploy(OwnedProxy.abi, OwnedProxy.bytecode, [
        producer,
        multisig.address,
    ]);

    // Produce Fuel and the Genesis Hash.
    const genesisHash = utils.keccak256('0xdeadbeaf');
    const contract = await t.deploy(Fuel.abi, Fuel.bytecode, [
        proxy.address,
        10,
        4,
        4,
        utils.parseEther('.5'),
        "Fuel",
        "1.1.0",
        0,
        genesisHash,
    ]);

    // Release factory.
    const factory = await t.deploy(Factory.abi, Factory.bytecode, []);

    // Set the target in the proxy using the multisig.
    const setTargetData = proxy.interface.functions.setTarget.encode([
        contract.address,
    ]);
    await multisig.submitTransaction(
        proxy.address,
        0,
        setTargetData,
        overrides,
    );

    // Commit addresses.
    await t.wait(contract.commitAddress(producer, overrides),
        'commit addresses', Fuel.errors);
    await t.wait(contract.commitAddress(t.wallets[1].address, overrides),
        'commit addresses', Fuel.errors);

    // Produce the token.
    const totalSupply = utils.parseEther('100000000000000.00');
    const erc20 = await t.deploy(ERC20.abi, ERC20.bytecode, [producer, totalSupply]);

    // Create release.
    let releaseTx = await factory.createRelease(
        producer,
        {
            gasLimit: 4000000,
        },
    );
    releaseTx = await releaseTx.wait();

    // The release address.
    const release = releaseTx.events[2].args._release;

    // The getter contract for the leader system.
    const releaseContract = new ethers.Contract(
        release,
        [
            'function transferOwnership(address) external',
        ],
        t.wallets[0],
    );

    // Transfer owner.
    await releaseContract.transferOwnership(coldWallet.address, {
        gasLimit: 4000000,
    });

    // Transfer some tokens.
    await erc20.transfer(release, utils.parseEther('32000.0'), {
        gasLimit: 400000,
    });

    // The leader.
    const leader = await t.deploy(Leader.abi, Leader.bytecode, [
        coldWallet.address,
        contract.address,
        release,
        erc20.address,
        multisig.address,
    ]);

    const changeData = proxy.interface.functions.change.encode([
        leader.address,
    ]);
    await multisig.submitTransaction(
        proxy.address,
        0,
        changeData,
        overrides,
    );

    // Add the leader as the owner.
    const addLeaderOwner = multisig.interface.functions.addOwner.encode([
        leader.address,
    ]);
    await multisig.submitTransaction(
        multisig.address,
        0,
        addLeaderOwner,
        overrides,
    );

    // Make a Deposit for User A.
    const userAFunnel = await contract.funnel(producer);
    const userAAmount = utils.parseEther('10000000000000');

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
        release: true,
        forceClear: true,
        feeEnforcement: true,
    })
    .then(console.log)
    .catch(console.error);
});