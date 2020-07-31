const mysql = require('@fuel-js/mysql');
const abi = require('@fuel-js/abi');
const { provider, wallets } = require('@fuel-js/environment');
const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
const interface = require('@fuel-js/interface');
const { copy, rewind } = require('@fuel-js/down');
const ethers = require('ethers');
const leveldown = require('leveldown');
const memdown = require('memdown');

// The confirguation object for the Fuel lambdas
function config(opts = process.env, _prefix = 'fuel_v1_') {
  const network = 'unspecified';
  const resolve = key => opts[_prefix + network + '_' + key]
    || opts[_prefix + 'default_' + key];

  // coder
  const coder = {
    key: key => [
      interface.db.unfinalized,
      0,
      utils.keccak256(key)
    ],
  };

  // return config object
  return {
    coder,
    blockHeight: opts.blockHeight,
    console: console,
    network: utils.getNetwork(network),
    gasPrice: () => Promise.resolve('0x12a05f2000'), // 80 gwei
    gas_limit: 4000000,
    confirmations: 0,
    block_time: 13 * 1000,
    db: database(copy(mysql({
      host: resolve('mysql_host'),
      port: parseInt(resolve('mysql_port') || 0, 10),
      database: resolve('mysql_database'),
      user: resolve('mysql_user'),
      password: resolve('mysql_password'),
      table: _prefix + network,
    }), rewind(memdown(), coder))),
    contract: opts.contract || new ethers.Contract(opts.address, abi.Fuel, provider),
    provider,
    operators: [
      wallets[0].privateKey,
      wallets[1].privateKey,
      wallets[2].privateKey,
      wallets[3].privateKey,
      wallets[4].privateKey,
    ],
  };
}

module.exports = config;
