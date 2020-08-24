function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function median(array) {
  const items = [...array].sort((a, b) => a.sub(b));
  const mid = items.length / 2;
  return mid % 1
    ? items[mid - 0.5]
    : (items[mid - 1].add(items[mid])).div(2);
}

// gasPrice, use an ethers provider object
// and it will do the rest, opts { sampleSize, sampleTarget }
async function gasPrice(provider = {}, opts = {}) {
  try {
    let transactionHashes = [];
    const gasPrices = [];
    const height = await provider.getBlockNumber();

    // make block promises, this can eventually be done in parallel
    for (let blockNumber = height;
      (blockNumber > 0 && transactionHashes.length < (opts.sampleTarget || 15));
      blockNumber--) {
      // eslint-disable-next-line
      const block = await provider.getBlock(blockNumber);

      // do 10 sample attempts
      for (let i = 0; i < (opts.sampleSize || 5); i++) {
        if (block.transactions && (block.transactions || {}).length > 0) {
          const randomSample = sample(block.transactions);

          if (randomSample) {
            transactionHashes.push(randomSample);
          }
        }
      }

      // remove deuplicates
      transactionHashes = [...new Set(transactionHashes)];
    }

    // transactionPrices
    const transactionPrices = [];

    // go through transaction hashes
    for (const transactionHash of transactionHashes) {
      if (transactionHash) {
        transactionPrices.push(provider.getTransaction(transactionHash));
      }
    }

    // grab all prices in parallel
    (await Promise.all(transactionPrices)).forEach(transaction => {
      gasPrices.push(transaction.gasPrice);
    });

    // get network gas price
    const network = await provider.getGasPrice();

    // add the network price in there as well
    gasPrices.push(network);

    // median
    const medianPrice = median(gasPrices);

    // sorted
    const sorted = gasPrices.sort((a, b) => a.sub(b));

    return {
      network,
      fast: sorted.slice(-1)[0],
      safe: [network, medianPrice].sort((a, b) => a.sub(b)).slice(-1)[0],
      median: medianPrice,
      low: sorted[0],
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = gasPrice;
