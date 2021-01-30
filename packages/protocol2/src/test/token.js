const { bytecode } = require('./erc20.json');
const { test, utils } = require('@fuel-js/environment');
const { ERC20 } = require('@fuel-js/contracts');
const token = require('../token');

const abi = [
    ...ERC20.abi,
    'constructor(uint256 chainId_) public',
];

module.exports = test('token', async t => {
    // check if sync dbs the right values
    const producer = t.getWallets()[0].address;
    
    // Setup erc20.
    const totalSupply = utils.bigNumberify('0xFFFFFFFFFFFFFFFFFFFFFF');
    const erc20 = await t.deploy(abi, bytecode, [
        producer,
        totalSupply,
    ]);

    // Erc20.
    const someErc20 = erc20.attach(utils.emptyAddress);

    // Fake config object.
    const config = {
        erc20: someErc20,
    };

    const etherData = await token.encodeTokenMetadata(
        utils.emptyAddress,
        config,
    );

    const noErc20Data = await token.encodeTokenMetadata(
        erc20.address,
        { ...config, erc20: null },
    );

    const erc20Data = await token.encodeTokenMetadata(
        erc20.address,
        config,
    );

    const decodedEther = await token.decodeTokenMetadata(
        etherData
    );

    const noErc20Decode = await token.decodeTokenMetadata(
        noErc20Data
    );

    const erc20Decode = await token.decodeTokenMetadata(
        erc20Data
    );

    t.equal(decodedEther.name, 'ether');
    t.equalBig(decodedEther.decimals, 18);
    t.equal(noErc20Decode.name, '');
    t.equalBig(noErc20Decode.decimals, 0);
    t.equal(erc20Decode.name, 'Fake Dai Stablecoin');
    t.equal(erc20Decode.symbol, 'FDAI');
    t.equalBig(erc20Decode.decimals, 18);

});