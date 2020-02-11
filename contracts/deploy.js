const { utils, Contract, Wallet, providers, ContractFactory } = require('ethers');
const _utils = require('../utils/utils');
const structs = require('../structs/structs');
const interfaces = require('../interfaces/interfaces');
const errors = require('../errors/errors');
const types = require('../types/types');
const HTTPProvider = require('ethjs-provider-http');
const FuelBytecode = require('./Fuel.code.js');
const FakeDaiBytecode = require('./FakeDai.code.js');
const { getReceipt } = require('../blocks/processBlock');
const write = require('write');
const oldConfig = require('../config/config');
const env = require('../config/process');
const MysqlDB = require('../dbs/MysqlDB');

types.TypeHex(env.block_production_key, 32);
types.TypeHex(env.faucet_key, 32);

const inputs = new MysqlDB({ // for storing remotly for lambda processing
  host: env.mysql_host,
  port: parseInt(env.mysql_port, 10),
  database: env.mysql_database,
  user: env.mysql_user,
  password: env.mysql_password,
  table: 'faucet_inputs',
  indexValue: false,
});

const web3Provider = new HTTPProvider(env.web3_provider);
const blockProducer = new Wallet(env.block_production_key,
  new providers.Web3Provider(web3Provider));
const faucetProducer = new Wallet(env.faucet_key,
  new providers.Web3Provider(web3Provider));
const faucetSigner = new utils.SigningKey(env.faucet_key);
const rpc = interfaces.FuelRPC({ web3Provider });

// Deployment of Network / Faucet
async function deploy() {
  try {
    // Create inputs table
    await inputs.create();

    const __chain_id = env.chain_id || '3'; // default to ropsten..
    const __network = oldConfig.networks[__chain_id];

    if (!__network) {
      throw new Error('Invalid chain ID or network not found in old configuration..');
    }

    console.log(`Fuel deployment sequence started on Chain ID ${__chain_id} "${__network}".`);

    // Fuel Factory
    const FuelFactory = new ContractFactory(interfaces.FuelInterface.abi,
      FuelBytecode,
      blockProducer);

    // Notice we pass in "Hello World" as the parameter to the constructor
    const fuelContract = await FuelFactory.deploy(blockProducer.address);
    await fuelContract.deployed();
    console.log('Fuel contract deployed to', fuelContract.address);

    // Check finalization delay
    if (!(await fuelContract.FINALIZATION_DELAY()).eq(50400)) {
      throw new Error('Invalid finalization delay!');
    }

    if (!(await fuelContract.SUBMISSION_DELAY()).eq(14400)) {
      throw new Error('Invalid submission delay!');
    }

    if (!(await fuelContract.BOND_SIZE()).eq(utils.parseEther('.1'))) {
      throw new Error('Invalid bond size!');
    }

    // Fuel Factory
    const FakeDaiFactory = new ContractFactory(interfaces.FakeDaiInterface.abi,
      FakeDaiBytecode,
      faucetProducer);

    // Notice we pass in "Hello World" as the parameter to the constructor
    const fakeDaiContract = await FakeDaiFactory.deploy(faucetProducer.address);
    await fakeDaiContract.deployed(env.chain_id || _utils.big(3));
    console.log('FakeDai contract deployed to', fakeDaiContract.address);

    // Mint stuff..
    const mintAmount = utils.parseEther('1000000000000000000000');
    const mintTx = await fakeDaiContract.mint(faucetProducer.address, mintAmount);
    await mintTx.wait();
    const mintReceipt = await rpc('eth_getTransactionReceipt', mintTx.hash);

    console.log('Mint tx status', mintReceipt.status);

    // Approval process.
    const approvalTx = await fakeDaiContract.approve(fuelContract.address, mintAmount);
    await approvalTx.wait();
    const approvalReceipt = await rpc('eth_getTransactionReceipt', approvalTx.hash);

    console.log('Approval tx status', approvalReceipt.status);

    // Connect to Fuel contract from faucet
    const faucetFuelContract = fuelContract.connect(faucetProducer);
    const depositTx = await faucetFuelContract.deposit(
        faucetProducer.address,
        fakeDaiContract.address,
        mintAmount);
    await depositTx.wait();
    const depositReceipt = await rpc('eth_getTransactionReceipt', depositTx.hash);

    console.log('Deposit tx status', depositReceipt.status);

    // Determine Deposit RLP
    const depositRLP = _utils.RLP.encode([
      faucetProducer.address,
      fakeDaiContract.address,
      _utils.big(depositReceipt.blockNumber).toHexString(),
      _utils.big(1).toHexString(),
      mintAmount.toHexString(),
    ]);
    const depositHashID = structs.constructDepositHashID({
      ethereumBlockNumber: _utils.big(depositReceipt.blockNumber),
      token: fakeDaiContract.address,
      account: faucetProducer.address,
    });
    console.log('Deposit Hash', depositHashID, 'Deposit RLP data', depositRLP);

    const __addresses = Object.assign({}, oldConfig.addresses, {
      [__network]: {
        fuel: fuelContract.address,
        fakeDai: fakeDaiContract.address,
        ether: '0x0000000000000000000000000000000000000000',
      },
    });
    const __faucet = Object.assign({}, oldConfig.faucet, {
      [__network]: {
        key: `${interfaces.FuelDBKeys.deposit}${depositHashID.slice(2)}`,
        value: `${depositRLP}`,
        depositHashID: `${depositHashID}`,
        ethereumBlockNumber: `${_utils.big(depositReceipt.blockNumber).toHexString()}`,
        token: `${String(fakeDaiContract.address).toLowerCase()}`,
        account: `${String(faucetProducer.address).toLowerCase()}`,
      },
    });
    const __ids = Object.assign({}, oldConfig.ids, {
      [__network]: {
        '0x0000000000000000000000000000000000000000': '0',
        [`${String(fakeDaiContract.address).toLowerCase()}`]: '1',
      },
    });

    // Add to faucets inputs
    await inputs.put(__faucet[__network].key, __faucet[__network].value);

    console.log('Writting details to ./config/config.js file..');
    await write('./config/config.js', `
// Tokens
const addresses = ${JSON.stringify(__addresses, null, 2)};

// Faucet
const faucet = ${JSON.stringify(__faucet, null, 2)};

// Networks
const networks = {
  '3': 'ropsten',
  '5': 'goerli',
  '10': 'local',
};

// Ids
const ids = ${JSON.stringify(__ids, null, 2)};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
`);

    console.log('Deployment sequence complete.');
    // Deposit / Hash / Stuff complete..
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

deploy()
.then(console.log)
.catch(console.error);
