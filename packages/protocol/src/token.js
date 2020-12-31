const { struct } = require('@fuel-js/struct');
const utils = require('@fuel-js/utils');

// Token metadata.
const Token = struct(`
  bytes name,
  bytes symbol,
  bytes version,
  address addr,
  uint256 decimals
`);

// Bytes utils.
function toUtf8Bytes(text) {
    return utils.hexlify(utils.toUtf8Bytes(text));
}

// Utils.
function toUtf8String(hex) {
    return utils.toUtf8String(utils.arrayify(hex));
}

// The Ether Token metadata.
const EtherToken = Token({
    name: toUtf8Bytes('ether'),
    symbol: toUtf8Bytes('eth'),
    version: toUtf8Bytes('1.0.0'),
    addr: utils.emptyAddress,
    decimals: 18,
});

/// @dev A very fault taulerant token metadata collection mechanism.
/// @return Token
async function encodeTokenMetadata(token = '0x', config = {}) {
    if (token === utils.emptyAddress) return EtherToken;

    // Empty token data.
    const data = {
        name: '0x',
        symbol: '0x',
        version: '0x',
        addr: token,
        decimals: 0,
    };

    // If no ERC20 is configured.
    if (!config.erc20) return Token(data);

    // Attach erc20
    const contract = config.erc20.attach(token);

    // Get the ERC20 data from the contract.
    try {
        data.name = toUtf8Bytes(await contract.name());
    } catch (nameError) {}

    try {
        data.symbol = toUtf8Bytes(await contract.symbol());
    } catch (symbolError) {}

    try {
        data.version = toUtf8Bytes(await contract.version());
    } catch (versionError) {}

    try {
        data.decimals = await contract.decimals();
    } catch (decimalError) {}

    // Final return.
    return Token(data);
}

/// @dev A very fault taulerant token metadata collection mechanism.
/// @return Object
function decodeTokenMetadata(tokenStruct = {}) {
    return {
        name: toUtf8String(tokenStruct.properties.name().get()),
        version: toUtf8String(tokenStruct.properties.version().get()),
        decimals: tokenStruct.properties.decimals().get(),
        symbol: toUtf8String(tokenStruct.properties.symbol().get()),
        addr: tokenStruct.properties.addr().get(),
    };
}

// Exports.
module.exports = {
    Token,
    encodeTokenMetadata,
    decodeTokenMetadata,
};