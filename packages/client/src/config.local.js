const abi = require('@fuel-js/abi');
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const database = require('@fuel-js/database');
const { local } = require('@fuel-js/down');
const { v1 } = require('@fuel-js/deployments');
const ethers = require('ethers');
const leveldown = require('leveldown');
const prompts = require('prompts');

function definedOr(value, or) {
  return typeof value !== "undefined" ? value : or;
}

// The confirguation object for the Fuel lambdas
function config(opts = process.env, _prefix = 'fuel_v1_') {
  const network = opts.network || opts[_prefix + 'network'];
  const resolve = key => definedOr(opts[key],
      (opts[_prefix + network + '_' + key]
       || opts[_prefix + 'default_' + key]));

   // Network requirement
   utils.assert(network, '--network must be specified');
   utils.assert(network === 'rinkeby', 'only rinkeby network supported');
   utils.assert(resolve('infura') || resolve('etherscan') || resolve('rpc'), 'you must specify a provider URL or key, either Infura, Etherscan or an RPC URL');

  // local provider
  let provider = null;
  if (resolve('infura') || resolve('etherscan')) {
    provider = ethers.getDefaultProvider(network, {
      etherscan: resolve('etherscan'),
      infura: resolve('infura'),
    });
  } else {
    provider = new ethers.providers.JsonRpcProvider(resolve('rpc'), network);
  }

  const date = (d) => {
    return `${d.toISOString().slice(0, 10)} ${d.toLocaleTimeString()}`;
  }

  // console
  const _console = {
    error: error => console.log(`fuel-${date(new Date())}-ERROR! : ${error.message}`),
    log: message => console.log(`fuel-${date(new Date())} : ${message}`),
  };

  // Console log the wallet address being used
  _console.log('Wallet address used: ' + opts.operator.address);

  // return config object
  return {
    emit: () => {}, // emmitter for new outputs
    console: _console,
    continue: () => { return opts.loop.continue; },
    prompt: {
      confirm: question => prompts({
          type: 'confirm',
          name: 'confirm',
          message: question,
        })
        .then(result => Promise.resolve(result.confirm))
        .catch(error => Promise.reject(error)),
    },
    clear: resolve('clear'),
    produce: false,
    network: utils.getNetwork(network),
    archive: resolve('archive') || false, // false,
    gas_limit: 4000000, // default gas limit
    confirmations: 6, // required block confirmations
    block_time: 13 * 1000,
    db: database(local(leveldown('.fueldb-' + network))),
    contract: new ethers.Contract(opts.contract || v1[network], abi.Fuel, provider), // selected Fuel contract object
    provider, // provider object
    operators: opts.operator.privateKey, // 0 is main operator, the rest are for root deployment
  };
}

module.exports = config;
