// get all account inputs from db
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');

async function requests(timeMin = '0x00',
  nonceMin = '0x00',
  timeMax = '0xFFFFFFFFFFFFFFFF',
  config = {}) {
  try {
    let entries = [];

    const inputs = (await streamToArray(config.db.createReadStream({
      gte: interface.db.faucet.encode([ timeMin, nonceMin ]),
      lte: interface.db.faucet.encode([ timeMax, '0xFFFFFFFF' ]),
      limit: 8,
      remote: true,
    })))
    .map(data => {
      const decoded = utils.RLP.decode(data.key);
      entries.push({
        key: data.key,
        timestamp: decoded[1],
        nonce: decoded[2],
        address: data.value,
      });
    });

    return entries;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = requests;
