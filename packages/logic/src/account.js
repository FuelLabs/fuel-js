// get all account inputs from db
const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');

async function account(
    owner = '0x',
    timeMin = '0x00',
    timeMax = '0xFFFFFFFFFFFFFFFF',
    token = null,
    proof = false,
    config = {}) {
  try {
    const token_min = token ? token : '0x00';
    const token_max = token ? token : '0xFFFFFFFF';

    const inputs = (await streamToArray(config.db.createReadStream({
      gte: interface.db.owner.encode([ owner, token_min, timeMin, 0, 0, utils.min_num ]),
      lte: interface.db.owner.encode([ owner, token_max, timeMax, 4, 1, utils.max_num ]),
      limit: config.account_limit || 1000,
      remote: true,
    })))
    .map(data => {
      // old api
      if (!proof) {
        // owner: Key(index++, 'address owner', 'uint8 type', 'uint8 isWithdrawal', 'uint64 timestamp', 'bytes32 inputHash'),
        // owner: Key(index++, 'address owner', 'uint32 token', 'uint64 timestamp', 'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),
        // return utils.RLP.decode(data.key);
        const decoded = utils.RLP.decode(data.key);
        return ['0x00', decoded[1], decoded[4], decoded[5], decoded[3], decoded[6]];
      }

      // if not proof
      return [
        utils.RLP.decode(data.key),
        data.value,
      ];
    });

    return inputs;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = account;
