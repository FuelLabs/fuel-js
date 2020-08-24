const abi = require('@fuel-js/abi');
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const database = require('@fuel-js/database');
const { local } = require('@fuel-js/down');
const { v1 } = require('@fuel-js/deployments');
const ethers = require('ethers');
const memdown = require('memdown');
const leveljs = require('level-js');

function definedOr(value, or) {
  return typeof value !== "undefined" ? value : or;
}

// The confirguation object for the Fuel lambdas
function config(opts = process.env, _prefix = 'fuel_v1_') {
  const network = opts.network || opts[_prefix + 'network'];
  const resolve = key => definedOr(opts[key],
      (opts[_prefix + network + '_' + key]
       || opts[_prefix + 'default_' + key]));

   // local provider
   let provider = opts.provider;

   // Network requirement
   utils.assert(network, '--network must be specified');
   utils.assert(network === 'rinkeby', 'only rinkeby network supported');
   utils.assert(provider || resolve('infura') || resolve('etherscan') || resolve('rpc'), 'you must specify a provider URL or key, either Infura, Etherscan or an RPC URL');

  if (!opts.provider) {
    if (resolve('infura') || resolve('etherscan')) {
      provider = ethers.getDefaultProvider(network, {
        etherscan: resolve('etherscan'),
        infura: resolve('infura'),
      });
    } else {
      provider = new ethers.providers.JsonRpcProvider(resolve('rpc'), network);
    }
  }

  const date = (d) => {
    return `${d.toISOString().slice(0, 10)} ${d.toLocaleTimeString()}`;
  }

  // return config object
  return {
    emit: () => {}, // emmitter for new outputs
    continue: () => { return opts.loop.continue; },
    console: {
      error: error => (opts.console || console).log(`fuel-${date(new Date())}-ERROR! : ${error.message}`),
      log: message => (opts.console || console).log(`fuel-${date(new Date())} : ${message}`),
    },
    prompt: {
      confirm: () => true,
    },
    clear: resolve('clear'),
    produce: false,
    network: utils.getNetwork(network),
    archive: false,
    gas_limit: 4000000, // default gas limit
    confirmations: 6, // required block confirmations
    block_time: 13 * 1000,
    blockHeight: resolve('blockHeight'),
    db: database(local(leveljs('fueldb-' + network))),
    contract: new ethers.Contract(opts.contract || v1[network], abi.Fuel, provider), // selected Fuel contract object
    provider, // provider object
    operators: resolve('operators'), // 0 is main operator, the rest are for root deployment
  };
}

module.exports = config;
