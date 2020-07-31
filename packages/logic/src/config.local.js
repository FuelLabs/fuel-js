const ethers = require('ethers');
const abi = require('@fuel-js/abi');
const { v1 } = { v1: {} };
const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
// const { v1 } = require('@fuel-js/deployments');

// The confirguation object for the Fuel lambdas
function config(opts = process.env, _prefix = 'fuel_v1_', noresolution = false) {
  const network = opts[_prefix + 'network'];
  const resolve = key => noresolution
    ? opts[key]
    : (opts[_prefix + network + '_' + key] || opts[_prefix + 'default_' + key]);

  // local provider
  const provider = ethers.getDefaultProvider(network, {
    infura: resolve('infura'),
  });

  // coder, this is reconfigured later in sync
  const coder = {};

  // return config object
  return {
    coder,
    emit: () => {}, // emmitter for new outputs
    console: console,
    network: utils.getNetwork(network),
    gasPrice: () => Promise.resolve('0x12a05f2000'), // 80 gwei
    gas_limit: 4000000, // default gas limit
    confirmations: 6, // required block confirmations
    block_time: 13 * 1000,
    db: database(rewind(leveldown(resolve('db') || '.fueldb-' + network), coder)),
    contract: new ethers.Contract(opts.contract || v1[network], abi.Fuel, provider), // selected Fuel contract object
    provider, // provider object
    operators: [], // 0 is main operator, the rest are for root deployment
  };
}

module.exports = config;
