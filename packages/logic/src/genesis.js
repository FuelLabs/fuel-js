const utils = require('@fuel-js/utils');

// Block numbers.
const blockNumbers = {
  "v1": {
      "mainnet": 11738472,
      "rinkeby": 7957768
  }
};

// Return the genesis Ethereum block for this contract.
async function genesis(config = {}) {
  try {
    let fromBlock = 0;

    // Mainnet patch.
    if (config.network.chainId === 1) {
      fromBlock = blockNumbers.v1.mainnet;
    }

    // Rinkeby patch.
    if (config.network.name === 'rinkeby') {
      fromBlock = blockNumbers.v1.rinkeby;
    }

    // Get logs.
    const logs = await config.provider.getLogs({
      fromBlock,
      toBlock: 'latest',
      address: config.contract.address,
      topics: config.contract.filters.BlockCommitted(null, null, null, null, 0, null).topics,
    });

    // Return the genesis block number log.
    return logs[0].blockNumber;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = genesis;
