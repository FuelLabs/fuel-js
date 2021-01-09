const write = require('write');
const read = require('fs-readfile-promise');
const prompts = require('prompts');
const ethers = require('ethers');
const { sign } = require('crypto');

// default wallet path
const defaultPath = '.fuel-wallet.json';

// wallet method
async function wallet(flags = {}, environment = {}) {
  try {
    const provided = flags.wallet;
    const _path = provided || defaultPath;
    let _wallet = null;
    let json = null;
    let message = null;

    // if the user provided a wallet path, try to read it
    if (provided) {
      try {
        json = await read(_path, 'utf8');
      } catch (readError) {
        throw new Error('Error reading wallet path: ' + readError.message);
      }
    }

    // attempt to load, decrypto or create an Ethers wallet
    try {

      // if no wallet was provided, attempt to read the default path wallet
      if (!provided) {
        try {
          json = await read(_path, 'utf8');
        } catch (readDefaultError) {
          // ignore defualt read error
        }
      }

      // default message
      message = 'Please enter a Fuel wallet encryption passphrase';

      // if the wallet was found or provided locally
      if (json) {
        message = 'Please enter your Fuel wallet decryption passphrase';
      }

      // Password.
      let password = '';

      // Get environmental password if not available.
      try {
        if (environment.fuel_v1_default_password) {
          password = environment.fuel_v1_default_password;

          console.log('Wallet password detected in the environment');
        } else {
          // ask for password
          const promptResult = await prompts({
            type: 'password',
            name: 'password',
            message,
          });

          password = promptResult.password;
        }
      } catch (promptError) {
        console.error('Password prompt error' + promptError.message);
        throw new Error(error.message);
      }

      // length check
      if (!json && (password || '').length < 8) {
        throw new Error('password must be more than 8 characters');
      }

      // if no json found, create a wallet
      if (!json) {
        _wallet = ethers.Wallet.createRandom();
      }

      // if no wallet present, attempt to load the JSON from password
      if (!_wallet) {
        try {
          _wallet = await ethers.Wallet.fromEncryptedJson(json, password);
        } catch (decryptError) {
          throw new Error(decryptError.message);
        }
      }

      // encrypto wallet JSON again
      json = await _wallet.encrypt(password);
    } catch (readError) {
      console.error('Wallet decryption error: ' + readError.message);
    }

    // write the JSON to the appropriate path
    await write(_path, json);

    // return wallet object descrypted into memory
    return _wallet;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = wallet;
