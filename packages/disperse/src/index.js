// a script to disperse tokens to thousands/millions of accounts
// transactions can be stored and dispersed by users
// accounts = [ ['0x...addr', '0x45'], ... ]
// config we use the .db and .operators property
// dispersal txs should mark their parent tx to create a liniage
const utils = require('@fuel-js/common/utils');
const protocol = require('@fuel-js/protocol');

// this will disperse tokens to thousands of accounts from a single input
function disperse(accounts = [], deposit = '0x', config = {}) {
}

// this will pickup/claim the dispersal txs for this account
function claim(account = '0x', config = {}) {
}

module.exports = {
  disperse,
  claim,
};
