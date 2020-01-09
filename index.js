const Wallet = require('./wallet/wallet');
const { utils } = require('ethers');
const dbs = require('./dbs/index');

module.exports = {
  Wallet, utils, dbs
};
