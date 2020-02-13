// Local Imports
const { utils, Wallet } = require('ethers');
const sync = require('./sync');
const _utils = require('../utils/utils');
const LevelUpDB = require('../dbs/LevelUpDB');
const CacheDB = require('../dbs/CacheDB');
const MysqlDB = require('../dbs/MysqlDB');
const HTTPProvider = require('ethjs-provider-http');
const { FuelContract, FuelRPC, FuelDBKeys } = require('../interfaces/interfaces');
const config = require('../config/config');
const env = require('../config/process');
let Sentry = null;

// CLI strategy is simply to move env into a CLI flag based object..

// Sentry Error Reporting
if (env.sentry) {
  Sentry = require('@sentry/node');
  Sentry.init({ dsn: env.sentry });
}

// memwatch.on('stats', console.log);
if (env.memwatch) {
  const memwatch = require('node-memwatch');
  memwatch.on('leak', console.log);
  memwatch.on('stats', console.log);
}

// Node routine
async function node() {
  // Logger with Sentry support
  const logger = {
    log: console.log,
    time: console.time,
    timeEnd: console.timeEnd,
    error: v => {
      console.error(v);
      if (Sentry) {
        Sentry.captureException(v);
      }
    },
  };

  try {
    let db = null;
    let mempool = null;
    let accounts = null;
    let remote = null;
    let commitments = null;
    const local = new LevelUpDB('./dbcache' + '_' + env.network, false, true); // for local caching..

    // Mysql Mempool / Accounts are supported
    if (env.mysql_host && !env.verifier) {
      remote = new MysqlDB({ // for storing remotly for lambda processing
        host: env.mysql_host,
        port: parseInt(env.mysql_port, 10),
        database: env.mysql_database,
        user: env.mysql_user,
        password: env.mysql_password,
      });
      await remote.create();
      db = new CacheDB(local, remote);

      if (env.reset) {
        await db.clear();
      }

      if (!env.verifier) {
        mempool = new MysqlDB({ // for storing mempool transaction data
          host: env.mysql_host,
          port: parseInt(env.mysql_port, 10),
          database: env.mysql_database,
          user: env.mysql_user,
          password: env.mysql_password,
          table: 'mempool',
        });
        await mempool.create();

        commitments = new MysqlDB({ // for storing mempool transaction data
          host: env.mysql_host,
          port: parseInt(env.mysql_port, 10),
          database: env.mysql_database,
          user: env.mysql_user,
          password: env.mysql_password,
          table: 'commitments',
        });
        await commitments.create();

        // destroy current commitment
        // await mempool.del(FuelDBKeys.commitment);
        // await commitments.clear();

        const accountsRemote = new MysqlDB({ // for storing remote for lambda processing
          host: env.mysql_host,
          port: env.mysql_port,
          database: env.mysql_database,
          user: env.mysql_user,
          password: env.mysql_password,
          table: 'accounts',
          indexValue: true, // secondary index
        });
        await accountsRemote.create();
        accounts = accountsRemote;

        if (env.reset) {
          await commitments.clear();
          await mempool.clear();
          await accounts.clear();
        }
      }
    } else {
      db = local;
    }

    // Web3 Provider..
    const web3Provider = new HTTPProvider(env.web3_provider);

    // Fuel Contract
    const contract = FuelContract({
      address: config.addresses[config.networks[env.chain_id || 3]].fuel, // live fuel contract
      web3Provider,
    });

    // Private Keys for Various Aspects of Production
    const keys = !env.verifier ? {
      block_production_key: env.block_production_key,
      faucet_key: env.faucet_key, // not needed for sync..
      fraud_commitment_key: env.fraud_commitment_key,
      transactions_submission_keys: (env.transactions_submission_keys || '').split(',').map(v => v.trim()),
    } : {
      fraud_commitment_key: env.fraud_commitment_key,
    };

    // Fuel RPC
    const rpc = FuelRPC({
      web3Provider,
    });

    const gasLimit = env.gasLimit
      ? _utils.big(env.gasLimit) : _utils.big(4000000);

    // Sync sequence which just keeps looping and syncing..
    await sync({
      db,
      mempool,
      accounts,
      rpc,
      commitments,
      logger,
      contract,
      keys,
      gasLimit,
      confirmationBlocks: 10, // wait for 10 conf blocks ahead before procesing..s
      cycleInterval: 15,
      waitTime: 1000,
      maximumMempoolAge: _utils.minutes(10),
    });
  } catch (error) {
    console.log(error);
    logger.error(error);
  }
}

// Run the application.
node()
.then(console.log)
.catch(console.log);
