#!/usr/bin/env node
'use strict';
const meow = require('meow');
const chalk = require('chalk');

function cli() {
  return meow(`

  ⚡ fuel [options]

  ${chalk.grey(`Options:`)}

    -n, --network           the ethereum network "mainnet"; default "mainnet"
    -r, --rpc               a standard Ethereum RPC provider (i.e. local go-ethereum)
    -i, --infura            an Infura service API key (--network must also be specified)
    -es, --etherscan        an Etherscan service API key (--network must also be specified)
    -e, --environment       use the environment variables to specify node paramaters
    -w, --wallet            path to a pbkdf2 encrypted Ethers wallet JSON file; default ".fuel-wallet.json"
    -c, --clear             clears the leveldb store
    -s, --serve             starts a local Fuel RPC server on http://localhost:3000; default false
    -p, --port              specify the Fuel RPC server port; default 3000
    -cr, --cors             cors domain for the Fuel RPC server; default http://localhost:1234
    -o, --oracle            start a price feed oracle for stablecoins and ether
    -f, --faucet            start a test network faucet
    -pr, --produce          start a block producing node
    -px, --proxy            ??should the node run as the proxy hot operator
    -ma, --maxMempoolAge    ??max age for transactions
    -ms, --minRootSize      ??unknown
    -ss, --scanSize         ??number of blocks to ingest when syncing

  ${chalk.grey(`Examples:`)}

  ${chalk.cyan(`  $ fuel --network="rinkeby" --rpc="http://localhost:8545"`)}
  `, {
    package: {},
    description: false,
    flags: {
      environment: {
        type: 'boolean',
        alias: 'e'
      },
      network: {
        type: 'string',
        alias: 'n',
      },
      infura: {
        type: 'string',
        alias: 'i',
      },
      etherscan: {
        type: 'string',
        alias: 'es',
      },
      wallet: {
        type: 'string',
        alias: 'w',
      },
      maxMempoolAge: {
        type: 'string',
        alias: 'ma',
      },
      minRootSize: {
        type: 'string',
        alias: 'ms',
      },
      db_path: {
        type: 'string',
        alias: 'db',
      },
      cors: {
        type: 'string',
        alias: 'cr',
      },
      faucet_wallet: {
        type: 'string',
        alias: 'fw',
      },
      deploy: {
        type: 'boolean',
        alias: 'd',
      },
      produce: {
        type: 'boolean',
        alias: 'pr',
      },
      clear: {
        type: 'boolean',
        alias: 'c',
      },
      forceClear: {
        type: 'boolean',
        alias: 'fc',
      },
      rpc: {
        type: 'string',
        alias: 'r',
      },
      privateKey: {
        type: 'string',
        alias: 'pk',
      },
      clear_and_stop: {
        type: 'boolean',
        alias: 'cs',
      },
      recover: {
        type: 'string',
        alias: 'rec',
      },
      nosync: {
        type: 'boolean',
        alias: 'ns',
      },
      port: {
        type: 'string',
        alias: 'p',
      },
      proxy: {
        type: 'boolean',
        alias: 'px',
      },
      oracle: {
        type: 'boolean',
        alias: 'o',
      },
      scanSize: {
        type: 'string',
        alias: 'ss',
      },
    }
  });
}

module.exports = cli;
