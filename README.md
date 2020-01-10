# Fuel Core

Essential JavaScript architecture for the Fuel side chain.

## Install

```sh
npm install --save fuel-core
```

## Usage

```js
import { Wallet, utils, dbs } from "fuel-core";

const signer = new utils.SigningKey(utils.randomBytes(32)); // warning: not secure entropy generation..
const { faucet, transfer, tokens } = new Wallet({ signer, db: new dbs.Index() });

await faucet();

await transfer(500, tokens.fakeDai, signer.address);
```

## Deposit / Withdraw Usage

```js
import { Wallet, utils, dbs } from "fuel-core";

const wallet = new Wallet({
  signer: utils.SigningKey(utils.randomBytes(32)),
  provider: window.web3.currentProvider,
  db: new dbs.Index(),
  chainId: 3, // default is 3, 1 is mainnet
});

await wallet.deposit(1000, wallet.tokens.ether /*, { from: eth_accounts[0] } */);

console.log(await wallet.balance(wallet.tokens.ether));

await wallet.withdraw(500, wallet.tokens.ether); // make a withdrawal

await wallet.retrieve(await wallet.withdrawals(0)); // wait 2 weeks to fire this..
```

## Syncing

```js
const { sync } = new Wallet(...);

// Sync your wallet DB with the Fuel API
await sync();
```

## Wallet

```js
new Wallet({
  signer, // [Object] ethers Signer object
  provider, // [Object] web3 provider object
  db: new dbs.Memory(), // [Object] database object
  chainId: '3' // [String | Number] mainnet or '3' ropsten
});
```

### Databases

```js
const { dbs } = require('fuel-core');

new dbs.Index(...); // Based on window.localStorage
new dbs.Level({ ... }); // Level store (level)
new dbs.Memory({ ... }); // Memory storage (memdown)
```

## Running a Node

```sh
git clone https://github.com/fuellabs/fuel-core
# setup your environment variables (described below)
npm install
# then run one of the following commands
```

- Full Sync - `npm run node-sync` runs a full node with mempool optionality with remote MySQL DB
- Faucet - `npm run node-faucet` runs a faucet node (for fund requests/dispersal of test tokens)
- Verifier `npm run node-verifier` runs a verifier node (no mempool or block production)
- Gancache `npm run node-ganache` runs a local Ganache server

## Building and Deploying

- Build Fuel `npm run build-fuel` builds the Fuel.sol contracts, writes artifacts
- Deploy Fuel `npm run deploy-fuel` deploys Fuel based on environmental configuration

## Running a Test MySQL Sync Node

1) Fill out environment variables.
2) One instance:
```sh
npm run node-ganache
```
3) Another instance:
```sh
npm run test-node-sync
```

### Environment Variables

Set these in your `~/.bashrc` or `~/.bash_profile` to operate the sync and dispersal nodes.

```sh
# Web3 HTTP Provider (string - url.. Infura or Other *Required*)
web3_provider="https://.."

# MySQL Database Environment (string[s] - mysql connection settings, optional for sync or verifier nodes)
# mysql_host
# mysql_port
# mysql_database
# mysql_user
# mysql_password

# Keys (string - 64 byte hex)
# block_production_key=0x..
# fraud_commitment_key=0x..
# transactions_submission_keys=0x..[, 0x...]

# Faucet (string - hex)
# faucet_key=0x..

# Faucet (numberish - hex | number)
# faucet_token_id=1
# faucet_dispersal_amount=0x..

# Sentry Error Reporting (optional)
# sentry=https://..

# Monitor Memory (boolish, optional)
# memwatch=1

# Verifier Only (no block production, only fraud commitments etc..) (boolish, optional)
# verifier=1

# Chain Identifier (number, eventually 1 Mainnet or 3 Ropsten are supported, default: 3)
# chain_id=3

# Gas Limit (string - hex)
# gasLimit=0x..
```

## Help out

There is always a lot of work to do, and will have many rules to maintain. So please help out in any way that you can:

- Create, enhance, and debug fuel-core rules (see our guide to ["Working on rules"](./.github/CONTRIBUTING.md)).
- Improve documentation.
- Chime in on any open issue or pull request.
- Open new issues about your ideas for making `fuel-core` better, and pull requests to show us how your idea works.
- Add new tests to *absolutely anything*.
- Create or contribute to ecosystem tools.
- Spread the word!

We communicate via [issues](https://github.com/fuellabs/fuel-core/issues) and [pull requests](https://github.com/fuellabs/fuel-core/pulls).

## Important documents

- [Changelog](CHANGE_LOG.md)
- [License](https://raw.githubusercontent.com/fuellabs/fuel-core/master/LICENSE)

## Licence

This project is licensed under the Apache-2.0 license, Copyright (c) 2020 Fuel labs. For more information see LICENSE

```
Copyright 2020 Fuel Labs

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
