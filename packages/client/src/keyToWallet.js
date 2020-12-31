const write = require('write');
const read = require('fs-readfile-promise');
const prompts = require('prompts');
const ethers = require('ethers');
const utils = require('@fuel-js/utils');

// default wallet path
const defaultPath = '.fuel-wallet.json';

// Convert a key to a wallet.
async function keyToWallet(flags = {}, env = {}) {
  try {
    const provided = flags.wallet;
    const privateKey = flags.privateKey;

    // Producing wallet file for private key.
    console.log('Producing wallet file for private key.');

    // Check private key.
    utils.assert(utils.hexDataLength(privateKey) === 32, 
        'please provide a valid private key');

    // Path selection and wallet setup.
    const _path = provided || defaultPath;
    let _wallet = new ethers.Wallet(privateKey);
    let json = null;

    // attempt to load, decrypto or create an Ethers wallet
    try {
      // ask for password
      const { password } = await prompts({
        type: 'password',
        name: 'password',
        message: 'Please select an 8+ char password for this private key wallet file.',
      });

      // length check
      if (password.length < 8) {
        throw new Error('password must be more than 8 characters');
      }

      // encrypto wallet JSON again
      json = await _wallet.encrypt(password);
    } catch (readError) {
      console.error(readError);
    }

    // write the JSON to the appropriate path
    await write(_path, json);

    // Wallet log.
    console.log(`Wallet file produced to: ${_path}`);

    // return wallet object descrypted into memory
    return _wallet;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = keyToWallet;
