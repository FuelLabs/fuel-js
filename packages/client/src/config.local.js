const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
const { local } = require('@fuel-js/down');
const ethers = require('ethers');
const leveldown = require('leveldown');
const prompts = require('prompts');
const { ERC20, Fuel, deployments } = require('@fuel-js/contracts');
const { v1 } = deployments;
const read = require('fs-readfile-promise');
const write = require('write');

function definedOr(value, or) {
  return typeof value !== "undefined" ? value : or;
}

// The confirguation object for the Fuel lambdas
function config(opts = process.env, _prefix = 'fuel_v1_') {
  const network = opts.network || opts[_prefix + 'network'];
  const resolve = key => definedOr(opts[key],
      (opts[_prefix + network + '_' + key]
       || opts[_prefix + 'default_' + key]));

   const networkObject = utils.getNetwork(network);

   // Network requirement
   utils.assert(network, '--network must be specified');
   utils.assert(network === 'rinkeby' || network === 'mainnet' || network === 'unspecified', 'only rinkeby and mainnet networks supported');
   utils.assert(resolve('infura')
    || resolve('etherscan')
    || network === 'unspecified'
    || resolve('rpc'), 'you must specify a provider URL or key, either Infura, Etherscan or an RPC URL');

   // Date formatting / method.
   const date = (d) => {
      return `${d.toISOString().slice(0, 10)} ${d.toLocaleTimeString()}`;
   }

  // console
  const _console = opts.console || {
    error: error => {
      console.log(`fuel-${date(new Date())}-ERROR! : ${error.message}`);
      console.error(error);
    },
    log: message => console.log(`fuel-${date(new Date())} : ${message}`),
  };

  // local provider
  let provider = opts.provider || null;
  let infura = resolve('infura');
  const etherscan = resolve('etherscan');

  if (infura === '$ENV') {
    infura = process.env[_prefix + 'default_infura'];
    _console.log('Using Infura from environment: ' + infura);
  }

  if (!provider && network !== 'unspecified') {
    if (infura || etherscan) {
      _console.log('Using API key: ' + (infura || etherscan).slice(0, 20) + '...');
  
      if (infura) {
        _console.log('Using Infura provider');
        provider = new ethers.providers.InfuraProvider(networkObject.name, infura);
      }
  
      if (etherscan) {
        _console.log('Using Etherscan provider');
        provider = new ethers.providers.EtherscanProvider(networkObject.name, etherscan);
      }
    } else {
      _console.log('Using RPC provider: ' + resolve('rpc') + ' on network: ' + networkObject.name);
      provider = new ethers.providers.JsonRpcProvider(resolve('rpc'), networkObject.name);
    }
  }

  // Console log the wallet address being used
  _console.log('Wallet/operator address used: ' + (opts.operator || {}).address);

  // The setup confirguation object.
  let _setup_config = {};

  // Lets setup the third party module.
  if (opts.setup) {
    _setup_config = opts.setup(network, resolve, { ...opts, _prefix, date });
  }

  // The DB to be used.
  let db = opts.db || null;

  // If the faucet is set and the faucet DB is available.
  if (opts.faucet && _setup_config.faucetDB) {
    db = _setup_config.faucetDB();
    _console.log('DB: faucet db selected.');
  }

  // If the oracle is set.
  if (!db && opts.oracle && _setup_config.oracleDB) {
    db = _setup_config.oracleDB();
    _console.log('DB: oracle db selected.');
  }

  // If the node DB is set.
  if (!db && !opts.faucet && !opts.oracle && _setup_config.nodeDB) {
    db = _setup_config.nodeDB();
    _console.log('DB: node db selected.');

    // If this DB is selected ensure archive is on.
    utils.assert(resolve('archive') === "true", 'archive must be on while using node DB');
  }

  // If local DB.
  if (!db && _setup_config.localDB) {
    db = _setup_config.localDB();
    _console.log('DB: local db from setup selected.');
  }

  // The default DB setting.
  if (!db) {
    db = database(local(leveldown('.fueldb-' + network)));
    _console.log('DB: default local db selected.');
  }

  // Minimum required to produce a block will be 8000.
  // Note min per root, is actually min per block.
  const minimumTransactionsPerRoot = opts.minimumTransactionsPerRoot || 100;

  // One hour
  const oneHour = 3600;

  // If the network is mainnet, we produce a block every 24 hours, otherwise every 1.
  let maximumTransactionAge = opts.maximumTransactionAge || (oneHour
      * (network === 'mainnet' ? 24 : 1)
      * 1000);

  // 15 second block times for local testnet.
  if (network === 'unspecified') {
    maximumTransactionAge = 15 * 1000;
  }

  // Setup ERC20 contract wrapper.
  const erc20 = new ethers.Contract(
    utils.emptyAddress,
    ERC20.abi,
    provider,
  );

  // return config object
  return {
    minimumTransactionsPerRoot,
    maximumTransactionAge,
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
    read,
    write,
    erc20: opts.erc20 || erc20,
    throttle: 2000,
    clear: resolve('clear'),
    produce: opts.produce,
    network: networkObject,
    networkSpecified: network,
    archive: resolve('archive') || false, // false,
    gas_limit: 4000000, // default gas limit
    confirmations: 7, // required block confirmations
    block_time: 13 * 1000,
    db,
    contract: new ethers.Contract(opts.contract || v1[network], Fuel.abi, provider), // selected Fuel contract object
    provider, // provider object
    operators: (opts.operator || {}).privateKey || '0x',
    proxy: opts.proxy,
    producer_address: opts.producer_address,
    remote_production: opts.remote_production || false,
    plugin: opts.plugin || null,
    port: opts.port || 3000,
    increaseBlock: opts.increaseBlock || null,
    faucetOperator: opts.faucetOperator || null,
    connectedOperator: new ethers.Wallet(
      (opts.operator || {}).privateKey || '0x',
      provider,
    ),
    release: opts.release,
    scanSize: parseInt(opts.scanSize || 10000, 10),
    pullLimit: opts.pullLimit,
    feeEnforcement: opts.feeEnforcement || false,
    clearAndStop: opts.clearAndStop,
    ..._setup_config,
  };
}

module.exports = config;
