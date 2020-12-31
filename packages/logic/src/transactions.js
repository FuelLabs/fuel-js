// get all account inputs from db
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');

async function transactions(blockHeight = 0, rootIndex = 0, config = {}) {
  try {
    return (await streamToArray(config.db.createReadStream({
      gte: interface.db.transactionMetadata.encode([ blockHeight, rootIndex, 0 ]),
      lte: interface.db.transactionMetadata.encode([ blockHeight, rootIndex, 2048 ]),
      limit: 2048,
      remote: true,
    })))
    .map(data => data.value);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = transactions;
