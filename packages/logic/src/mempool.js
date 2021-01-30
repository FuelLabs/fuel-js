// get data from the mempool
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol2');
const streamToArray = require('stream-to-array');

async function mempool(opts = {}, config = {}) {
  try {
    const {
        minTimestamp = 0,
        minNonce = '0x00',
        minTransactionId = utils.min_num,
        maxTimestamp = utils.timestamp(),
        maxNonce = '0xFFFFFFFF',
        maxTransactionId = utils.max_num,
        limit = 1000,
      } = opts;

    const transactions = (await streamToArray(config.db.createReadStream({
      gte: interface.db.mempool.encode([ minTimestamp, minNonce, minTransactionId ]),
      lte: interface.db.mempool.encode([ maxTimestamp, maxNonce, maxTransactionId ]),
      limit,
      remote: true,
    })))
    .map(data => {
      // Timestamp and TransactionId from the key
      const [index, timestamp, nonce, transactionHashId] = utils.RLP.decode(data.key);

      // We get the Transaction
      return {
        timestamp,
        transactionHashId,
        end: {
          timestamp,
          nonce,
          transactionId: transactionHashId,
        },
        transaction: protocol.transaction._Transaction(
          data.value,
          null,
          protocol.addons.Transaction,
        ),
      };
    });

    return transactions || [];
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = mempool;
