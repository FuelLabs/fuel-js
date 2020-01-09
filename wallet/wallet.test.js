const _utils = require('../utils/utils');
const Wallet = require('./wallet');
const { utils } = require('ethers');
const dbs = require('../dbs/dbs');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const signer = new utils.SignerKey(utils.randomBytes(32)); // warning: not secure entropy generation..
  const { faucet, transfer, tokens } = new Wallet({ signer, db: new dbs.localStorage() });

  await faucet();

  await transfer(500, tokens.fakeDai, signer.address);

  console.log(`Your hot key is ${signer.privateKey} at address ${signer.address}, save it!`);
});
