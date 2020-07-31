#!/usr/bin/env node
'use strict';
const meow = require('meow');
const chalk = require('chalk');
const logic = require('@fuel-js/logic');
// const config = require('./config.local');
const config = require('./config.fuellabs');

const cli = meow(`

  ⚡ fuel [options]

  ${chalk.grey(`Options:`)}

    -n, --network         the ethereum network "rinkeby"; default "rinkeby"
    -r, --rpc             a standard Ethereum RPC provider (i.e. local go-ethereum)
    -i, --infura          an Infura service API key (--network must also be specified)
    -es, --etherscan      an Etherscan service API key (--network must also be specified)
    -e, --environment     use the environment variables to specify node paramaters
    -o, --operators       a comma (,) seperated list or seed phrase of Ethereum private keys used for block, root and fraud commitments

  ${chalk.grey(`Examples:`)}

  ${chalk.cyan(`  $ fuel --network="ropsten" --rpc="http://localhost:8545"`)}
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
    operators: {
      type: 'string',
      alias: 'o'
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

const settings = config({
  network: 'rinkeby',
  ...cli.flags,
  ...(cli.flags.environment ? process.env : {}),
});
logic.sync(settings);
