const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');
const getAssets = require('./assets');
const getHistory = require('./history');

async function getOwnerId(owner = '0x', config = {}) {
  try {
    return await config.db.get([ interface.db.addressId, owner ]);
  } catch (ownerIdError) {
    return '0x';
  }
}

// get user deposits
async function getDeposits(opts = {}, config = {}) {
  // stream deposits
  const deposits = await streamToArray(config.db.createReadStream({
    lte: interface.db.deposit2.encode([ opts.owner, opts.token, opts.blockNumber ]),
    gte: interface.db.deposit2.encode([ opts.owner, '0x00', '0x00' ]),
    limit: Math.min(parseInt(opts.limit, 10), 64),
    remote: true,
  }));

  // return deposits data
  return deposits.map(data => data.value);
}

// max address
const maxAddress = `0xffffffffffffffffffffffffffffffffffffffff`;

function getProfile(opts = {}, config = {}) {
  const {
    owner = '0x',
    token = '0x00',
    timestamp = '0xFFFFFFFFFFFFFFFF',
    blockNumber = '0xFFFFFFFF',
    depositToken = maxAddress,
    transactionId = utils.max_num,
    include = true,
    limit = 64,
  } = opts;

  return Promise.all([
    getAssets(owner, token, limit, config),
    getHistory({ owner, timestamp, transactionId, include, limit }, config),
    getOwnerId(owner, config),
    getDeposits({ owner, token: depositToken, blockNumber, limit }, config),
  ]);
}

module.exports = getProfile;
