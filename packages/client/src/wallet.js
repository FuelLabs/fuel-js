const prompts = require('prompts');
const ethers = require('ethers');
const { sign } = require('crypto');
const { promises: fs } = require('fs')

// default wallet path
const defaultPath = '.fuel-wallet.json';

// wallet method
async function wallet(flags = {}, environment = {}) {
  try {
    const provided = flags.wallet;
    const _path = provided || defaultPath;
    let _wallet = null;
    let json = null;

    // if the user provided a wallet path, try to read it
    if (provided) {
      try {
        json = await fs.readFile(_path, 'utf8');
      } catch (readError) {
        throw new Error('Error reading wallet path: ' + readError.message);
      }
    }
    // if no wallet was provided, attempt to read the default path wallet
    if (!provided) {
      try {
        json = await fs.readFile(_path, 'utf8');
      } catch (_) {
        // ignore error
      }
    }

    // attempt to load, decrypto or create an Ethers wallet
    try {
      const message = json ?
        'Please enter your Fuel wallet decryption passphrase' :
        'Please enter a Fuel wallet encryption passphrase';

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

      // length check, only for new wallets
      if (!json && (password || '').length < 8) {
        throw new Error('password must be more than 8 characters');
      }

      // if no wallet present, attempt to load the JSON from password
      // otherwise create wallet
      if (json) {
        _wallet = await ethers.Wallet.fromEncryptedJson(json, password);
      } else {
        _wallet = ethers.Wallet.createRandom();
      }

      // encrypt and write to file if new wallet
      if (!json) {
        json = await _wallet.encrypt(password);
        await fs.writeFile(_path, json);
      }
    } catch (readError) {
      console.error('Wallet decryption error: ' + readError.message);
      throw new Error();
    }

    // return wallet object descrypted into memory
    return _wallet;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = wallet;
