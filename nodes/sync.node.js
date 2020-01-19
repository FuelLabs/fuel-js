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
let Sentry = null;

// CLI strategy is simply to move process.env into a CLI flag based object..

// Sentry Error Reporting
if (process.env.sentry) {
  Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.sentry });
}

// memwatch.on('stats', console.log);
if (process.env.memwatch) {
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
    const local = new LevelUpDB('./dbcache', false, true); // for local caching..

    // Mysql Mempool / Accounts are supported
    if (process.env.mysql_host && !process.env.verifier) {
      remote = new MysqlDB({ // for storing remotly for lambda processing
        host: process.env.mysql_host,
        port: parseInt(process.env.mysql_port, 10),
        database: process.env.mysql_database,
        user: process.env.mysql_user,
        password: process.env.mysql_password,
      });
      await remote.create();
      db = new CacheDB(local, remote);

      if (process.env.reset) {
        await db.clear();
      }

      if (!process.env.verifier) {
        mempool = new MysqlDB({ // for storing mempool transaction data
          host: process.env.mysql_host,
          port: parseInt(process.env.mysql_port, 10),
          database: process.env.mysql_database,
          user: process.env.mysql_user,
          password: process.env.mysql_password,
          created: true,
          table: 'mempool',
        });
        await mempool.create();

        commitments = new MysqlDB({ // for storing mempool transaction data
          host: process.env.mysql_host,
          port: parseInt(process.env.mysql_port, 10),
          database: process.env.mysql_database,
          user: process.env.mysql_user,
          password: process.env.mysql_password,
          table: 'commitments',
        });
        await commitments.create();

        // destroy current commitment
        // await mempool.del(FuelDBKeys.commitment);
        // await commitments.clear();

        const accountsRemote = new MysqlDB({ // for storing remote for lambda processing
          host: process.env.mysql_host,
          port: process.env.mysql_port,
          database: process.env.mysql_database,
          user: process.env.mysql_user,
          password: process.env.mysql_password,
          table: 'accounts',
          indexValue: true, // secondary index
        });
        await accountsRemote.create();
        accounts = accountsRemote;

        if (process.env.reset) {
          await commitments.clear();
          await mempool.clear();
          await accounts.clear();
        }
      }
    } else {
      db = local;
    }

    // Web3 Provider..
    const web3Provider = new HTTPProvider(process.env.web3_provider);

    // Fuel Contract
    const contract = FuelContract({
      address: config.addresses[config.networks[process.env.chain_id || 3]].fuel, // live fuel contract
      web3Provider,
    });

    // Private Keys for Various Aspects of Production
    const keys = !process.env.verifier ? {
      block_production_key: process.env.block_production_key,
      faucet_key: process.env.faucet_key, // not needed for sync..
      fraud_commitment_key: process.env.fraud_commitment_key,
      transactions_submission_keys: (process.env.transactions_submission_keys || '').split(',').map(v => v.trim()),
    } : {
      fraud_commitment_key: process.env.fraud_commitment_key,
    };

    // Fuel RPC
    const rpc = FuelRPC({
      web3Provider,
    });

    const gasLimit = process.env.gasLimit
      ? _utils.big(process.env.gasLimit) : _utils.big(4000000);

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
