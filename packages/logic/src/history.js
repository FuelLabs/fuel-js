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

    // Max number of entries to grab
    const maximum = Math.min(parseInt(limit, 10), 64);

    // get transactions from range proof up to 64
    let transactions = await streamToArray(config.db.createReadStream({
      lte: interface.db.archiveOwner.encode([ owner, timestamp, transactionId ]),
      gte: interface.db.archiveOwner.encode([ owner, '0x00', utils.min_num ]),
      limit: Math.min(parseInt(limit, 10), 64),
      remote: true,
    }));

    // setup default proofs
    let proofs = [];

    // include up to 10 tx proofs using batch 1 round trip
    try {
      if (include && transactions.length) {
        proofs = await batch(config.db, transactions.map(data => {
          const [ _index, _owner, _timestamp, _transactionId ] = utils.RLP.decode(data.key);
  
          return [ interface.db.transactionId, data.value ];
        }), { remote: true });
      }
    } catch (err) {}

    // return transactions parsed, timestamp, transactionId, proof if available
    return transactions.map((data, index) => {
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
