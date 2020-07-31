const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
const inferface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');

// rewind the database back
async function rewind(
  minBlockNumber = {},
  maxBlockNumber = {},
  config = {}) {
  try {
    for (var blockNumber = minBlockNumber;
      blockNumber.lt(maxBlockNumber);
      blockNumber = blockNumber.add(1)) {
      let batch = [];

      await streamToArray(config.db.createReadStream({
        gt: interface.db.unfinalized.encode([ blockNumber, utils.min_num ]),
        lt: interface.db.unfinalized.encode([ blockNumber, utils.max_num ]),
        local: true,
      }))
      .forEach(entry => {
        batch.push({ type: 'del', key: entry.key });
        batch.push({ type: 'del', key: entry.value });
      });

      await config.db.batch(batch);
    }
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = rewind;
