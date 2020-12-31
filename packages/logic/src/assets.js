// get all account inputs from db
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');
const protocol = require('@fuel-js/protocol');

// This would just have to give both balances, but that's okay.
// It simply decides to look at either the mempool or sync balance.
async function assets(owner = '0x', token = '0x', limit = 128, config = {}) {
  try {
    // Go through all the users balances and grab all of them.
    return (await streamToArray(config.db.createReadStream({
      gte: interface.db.balance.encode([ owner, token ]),
      lte: interface.db.balance.encode([ owner, '0xFFFFFFFF' ]),
      limit: Math.min(parseInt(limit, 10), 128),
      remote: true,
    })))
    .map(data => {
      // each onchain asset
      const [_index, _owner, _token] = utils.RLP.decode(data.key);

      // Decode the balance.
      const balObject = protocol.addons.Balance(data.value);

      // Balance.
      let balance = null;

      // This will return the final balance.
      if (balObject.properties.transactionHashId()
        .get() !== utils.emptyBytes32) {
          balance = balObject.properties.mempoolBalance()
            .get();
      } else {
        balance = balObject.properties.syncBalance()
            .get();
      }

      // return the token and the balance for each asset
      return [_token, balance];
    });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = assets;
