const ethers = require('ethers');
const abi = require('@fuel-js/abi');
const utils = require('@fuel-js/utils');
const { rewind } = require('@fuel-js/down');
const interface = require('@fuel-js/interface');
const leveldown = require('leveldown');
const database = require('@fuel-js/database');
const { v1 } = require('@fuel-js/deployments');

// The confirguation object for the Fuel lambdas
function config(opts = process.env, _prefix = 'fuel_v1_') {
  const network = opts.network || opts[_prefix + 'network'];
  const resolve = key => opts[key] || (opts[_prefix + network + '_' + key]
    || opts[_prefix + 'default_' + key]);

  // local provider
  let provider = null;
  if (resolve('infura') || resolve('etherscan')) {
    utils.assert(network, '--network must be specified');
    provider = ethers.getDefaultProvider(network, {
      etherscan: resolve('etherscan'),
      infura: resolve('infura'),
    });
  } else {
    utils.assert(network, '--network must be specified');
    provider = new ethers.providers.JsonRpcProvider(resolve('rpc'), network);
  }

  // coder, this is reconfigured later in sync
  const coder = {
    key: key => [
      interface.db.unfinalized,
      0,
      utils.keccak256(key)
    ],
  };

  const date = (d) => {
    return `${d.toISOString().slice(0, 10)} ${d.toLocaleTimeString()}`;
  }

  // return config object
  return {
    coder,
    emit: () => {}, // emmitter for new outputs
    console: {
      error: error => console.log(`fuel-${date(new Date())}-ERROR! : ${error.message}`),
      log: message => console.log(`fuel-${date(new Date())} : ${message}`),
    },
    clear: resolve('clear'),
    producer: resolve('produce'),
    network: utils.getNetwork(network),
    gas_limit: 4000000, // default gas limit
    confirmations: 6, // required block confirmations
    block_time: 13 * 1000,
    db: database(rewind(leveldown('.fueldb-' + network), coder)),
    contract: new ethers.Contract(opts.contract || v1[network], abi.Fuel, provider), // selected Fuel contract object
    provider, // provider object
    operators: resolve('operators'), // 0 is main operator, the rest are for root deployment
  };
}

module.exports = config;
