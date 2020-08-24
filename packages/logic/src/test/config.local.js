const abi = require('@fuel-js/abi');
const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
const interface = require('@fuel-js/interface');
const { copy } = require('@fuel-js/down');
const ethers = require('ethers');
const memdown = require('memdown');
const { v1 } = { v1: {} };

// The confirguation object for the Fuel lambdas
function config(opts = process.env, _prefix = 'fuel_v1_', noresolution = false) {
  const network = opts.network || opts[_prefix + 'network'];
  const resolve = key => noresolution
    ? opts[key]
    : (opts[_prefix + network + '_' + key] || opts[_prefix + 'default_' + key]);

  // local provider
  const provider = opts.provider || ethers.getDefaultProvider(network, {
    infura: resolve('infura'),
  });

  // return config object
  return {
    archive: true,
    rootLengthTarget: opts.rootLengthTarget,
    produce: opts.produce,
    minimumTransactionsPerRoot: opts.minimumTransactionsPerRoot || 0,
    emit: () => {}, // emmitter for new outputs
    console: console,
    continue: opts.continue,
    network: utils.getNetwork(network),
    gasPrice: () => Promise.resolve('0x12a05f2000'), // 80 gwei
    gas_limit: 4000000, // default gas limit
    confirmations: 0, // required block confirmations
    block_time: 0, // 13 * 1000,
    db: database(copy(memdown(), memdown())),
    contract: opts.contract || {}, // new ethers.Contract(opts.contract || v1[network], abi.Fuel, provider), // selected Fuel contract object
    provider, // provider object
    operators: opts.operators || [], // 0 is main operator, the rest are for root deployment
  };
}

module.exports = config;
