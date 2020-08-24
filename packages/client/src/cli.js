#!/usr/bin/env node
'use strict';
const meow = require('meow');
const chalk = require('chalk');

function cli() {
  return meow(`

  ⚡ fuel [options]

  ${chalk.grey(`Options:`)}

    -n, --network         the ethereum network "rinkeby"; default "rinkeby"
    -r, --rpc             a standard Ethereum RPC provider (i.e. local go-ethereum)
    -i, --infura          an Infura service API key (--network must also be specified)
    -es, --etherscan      an Etherscan service API key (--network must also be specified)
    -e, --environment     use the environment variables to specify node paramaters
    -w, --wallet          path to a pbkdf2 encrypted Ethers wallet JSON file; default ".fuel-wallet.json"
    -c, --clear           clears the leveldb store

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
        alias: 'n'
      },
      infura: {
        type: 'string',
        alias: 'i'
      },
      etherscan: {
        type: 'string',
        alias: 'es'
      },
      rpc: {
        type: 'string',
        alias: 'r'
      },
      wallet: {
        type: 'string',
        alias: 'w'
      },
      produce: {
        type: 'boolean',
        alias: 'p'
      },
      clear: {
        type: 'boolean',
        alias: 'c'
      }
    }
  });
}

module.exports = cli;
