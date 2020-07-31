const utils = require('@fuel-js/utils');

// return the genesis Ethereum block for this contract
async function genesis(config = {}) {
  try {
    // get logs
    const logs = await config.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      address: config.contract.address,
      topics: config.contract.filters.BlockCommitted(null, null, null, null, 0, null).topics,
    });

    return logs[0].blockNumber;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = genesis;
