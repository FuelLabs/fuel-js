// get all account inputs from db
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const batch = require('@fuel-js/batch');
const streamToArray = require('stream-to-array');

// get the transaction history of a specific owner / account, include up to 10 proofs if necssary
async function history(opts = {}, config = {}) {
  try {
    const {
      owner = '0x',
      nonce = '0xFFFFFFFF',
      timestamp = '0xFFFFFFFFFFFFFFFF',
      transactionId = utils.max_num,
      limit = 64,
      include = false,
    } = opts;

    // get transactions from range proof up to 64
    let transactions = await streamToArray(config.db.createReadStream({
      lte: interface.db.archiveOwner.encode([ owner, timestamp, transactionId ]),
      gte: interface.db.archiveOwner.encode([ owner, '0x00', utils.min_num ]),
      limit: Math.min(parseInt(limit, 10), 64),
      remote: true,
    }));

    // setup default proofs
    let proofs = [];

    // Retrieved [tx hash] => timestamp.
    let retrieved = {};

    // Always take the most recent one.
    transactions.forEach(data => {
      const [ _index, _owner, _timestamp, _transactionId ] = utils.RLP.decode(data.key);

      // Retrieved.
      if (utils.bigNumberify(_timestamp).gt(retrieved[_transactionId] || 0)) {
        // set retrieved hash.
        retrieved[_transactionId] = _timestamp;
      }
    });

    // Filter only the most recent tx.
    const filteredTransactions = transactions.filter(data => {
      const [ _index, _owner, _timestamp, _transactionId ] = utils.RLP.decode(data.key);

      // Return true if it's the latest tx.
      if (retrieved[_transactionId] === _timestamp) {
        return true;
      }

      // Return false. 
      return false;
    });

    // include up to 10 tx proofs using batch 1 round trip
    try {
      if (include && transactions.length) {
        proofs = await batch(config.db, filteredTransactions.map(data => {
          return [ interface.db.transactionId, data.value ];
        }), { remote: true });
      }
    } catch (err) {}

    // return transactions parsed, timestamp, transactionId, proof if available
    return filteredTransactions.map((data, index) => {
      // parse the key
      const [ _index, _owner, _timestamp, _transactionId ] = utils.RLP.decode(data.key);

      // include transaction proof if avaiable
      const proof = include && proofs[index] ? [ proofs[index].value ] : [];

      // return timestamp and transactionId
      return [ _timestamp, data.value, ...proof ];
    });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = history;
