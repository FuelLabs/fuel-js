// Core
const { test } = require('zora');

// Local Imports
const _utils = require('../utils/utils');
const sync = require('./sync');
const LevelUpDB = require('../dbs/LevelUpDB');
const CacheDB = require('../dbs/CacheDB');
const MiddleCacheDB = require('../dbs/MiddleCacheDB');
const MysqlDB = require('../dbs/MysqlDB');
const env = require('../tests/test.environment');
const processEnv = require('../config/process');
let Sentry = null;

// Sentry Error Reporting
if (processEnv.sentry) {
  Sentry = require('@sentry/node');
  Sentry.init({ dsn: processEnv.sentry });
}

// Test verify block header
test('test syncing sequence', async t => {
  try {
    // Extended Test Methods
    const testSuite = env.extendTest(t);

    let db = null;
    let mempool = null;
    let accounts = null;
    let remote = null;
    let faucet = null;
    let commitments = null;
    const local = new LevelUpDB('./dbcache_test', false, true); // for local caching..
    // const localMiddle = new LevelUpDB('./dbcache_middle_test', false, true); // for local caching..

    // Mysql Mempool / Accounts are supported
    if (processEnv.mysql_host && !processEnv.nomysql) {
      remote = new MysqlDB({ // for storing remotly for lambda processing
        host: processEnv.mysql_host,
        port: parseInt(processEnv.mysql_port, 10),
        database: processEnv.mysql_database,
        user: processEnv.mysql_user,
        password: processEnv.mysql_password,
        table: 'keyvalues_test',
      });
      await remote.create();
      db = new CacheDB(local, remote);
      // db = new CacheDB(local, remote);

      if (!processEnv.verifier) {
        mempool = new MysqlDB({ // for storing mempool transaction data
          host: processEnv.mysql_host,
          port: parseInt(processEnv.mysql_port, 10),
          database: processEnv.mysql_database,
          user: processEnv.mysql_user,
          password: processEnv.mysql_password,
          table: 'mempool_test',
        });
        await mempool.create();

        faucet = new MysqlDB({ // for storing mempool transaction data
          host: processEnv.mysql_host,
          port: parseInt(processEnv.mysql_port, 10),
          database: processEnv.mysql_database,
          user: processEnv.mysql_user,
          password: processEnv.mysql_password,
          table: 'faucet_requests_test',
        });
        await faucet.create();

        commitments = new MysqlDB({ // for storing mempool transaction data
          host: processEnv.mysql_host,
          port: parseInt(processEnv.mysql_port, 10),
          database: processEnv.mysql_database,
          user: processEnv.mysql_user,
          password: processEnv.mysql_password,
          table: 'commitments_test',
        });
        await commitments.create();

        // const accountsLocal = new LevelUpDB('./dbaccounts_test', false, true); // for local caching..
        // const accountsLocalMiddle = new LevelUpDB('./dbaccounts_middle_test', false, true); // for local caching..
        const accountsRemote = new MysqlDB({ // for storing remote for lambda processing
          host: processEnv.mysql_host,
          port: processEnv.mysql_port,
          database: processEnv.mysql_database,
          user: processEnv.mysql_user,
          password: processEnv.mysql_password,
          table: 'accounts_test',
          indexValue: true, // secondary index
        });
        await accountsRemote.create();
        accounts = accountsRemote; // new CacheDB(accountsLocal, accountsRemote);
      }
    } else {
      db = local;
      mempool = new LevelUpDB('./mempool_test', false, true);
      accounts = new LevelUpDB('./accounts_test', false, true);
      remote = db;
    }

    if (processEnv.reset || 1) {
      await db.clear();
      await mempool.clear();
      await accounts.clear();
      await remote.clear();
      await commitments.clear();
    }

    // Construct Fuel Contract
    const { contract } = await env.constructFuel(env.accounts[0].address || env.address);

    // Private Keys for Various Aspects of Production
    const keys = {
      block_production_key: env.accounts[0].privateKey,
      faucet_key: env.accounts[0].privateKey, // not needed for sync..
      fraud_commitment_key: env.accounts[0].privateKey,
      transactions_submission_keys: [
        env.accounts[1].privateKey,
        env.accounts[1].privateKey,
        env.accounts[2].privateKey,
        // env.accounts[1].privateKey,
      ],
    };

    // Simulated Contract in seperate thread.. memory leaks unfortunatly for testing..
    const timeout = setTimeout(async () => {
      await env.simulatedWalletUsage(contract, remote, mempool, false, local, accounts, testSuite, faucet);
      // await env.simulatedContract(contract, remote, mempool, false, local, accounts, testSuite, faucet); // NO INtake
    }, 10);

    // Logger with Sentry support
    const logger = {
      log: console.log,
      time: console.time,
      timeEnd: console.timeEnd,
      error: console.error,
    };

    // Sync sequence which just keeps looping and syncing..
    await sync({ db,
      rpc: env.rpc,
      mempool,
      accounts,
      commitments,
      logger,
      contract,
      keys,
      cycleInterval: 1,
      maximumMempoolAge: 20, // _utils.minutes(1), // might be 10
      waitTime: 100,
      hardStop: _utils.big(16),
    });
  } catch (error) {
    console.error(error);
  }
});
