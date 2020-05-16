const Wallet = require('./wallet/wallet');
const { utils, providers } = require('ethers');
const dbs = require('./dbs/index');

module.exports = {
  Wallet,
  providers,
  utils,
  dbs
};
