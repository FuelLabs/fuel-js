const utils = require('@fuel-js/utils');
const ethers = require('ethers');

// default root producers
const defaultRootProducers = 8;

// Convert Seed / Comma Seperated Operators to usable Wallets
function operatorsToWallets(config = {}) {
    // Operators specified
    utils.assert(config.operators, 'no operators specified');
  
    // Is array
    if (Array.isArray(config.operators)) {
      return config.operators.map(privateKey => {
        return new ethers.Wallet(privateKey, config.provider);
      }).slice(0, 128);
    }

    // Just a single private key
    if (config.operators.indexOf(',') === -1
      && config.operators.indexOf('0x') === 0) {
      return [
        new ethers.Wallet(config.operators, config.provider),
      ];
    }
  
    // Is a comma seperated list
    if (config.operators.indexOf(',') === 0) {
      return config.operators.trim().split(',').map(privateKey => {
        return new ethers.Wallet(privateKey.trim(), config.provider);
      }).slice(0, 128);
    }
  
    // Is a mnemonic seed phrase
    let wallets = [];
    for (var i = 0; i < defaultRootProducers; i++) {
      const _wallet = new ethers.Wallet.fromMnemonic(
        config.operators,
        "m/44'/60'/0'/1/" + i,
      );
      wallets.push(_wallet.connect(config.provider));
    }

    // Return wallets
    return wallets;
}

module.exports = operatorsToWallets;