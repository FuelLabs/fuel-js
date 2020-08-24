const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol');
const streamToArray = require('stream-to-array');

// handle the getting of the current balance logic
async function decrease(owner = '0x', token = '0x', amount = {}, config = {}) {
  try {
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];
    let balance = 0;
    try {
      balance = await config.db.get(balanceKey);
    } catch (balanceError) {}

    await config.db.put(balanceKey, utils.bigNumberify(balance).sub(amount));
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// increase a users balance
async function increase(owner = '0x', token = '0x', amount = {}, config = {}) {
  try {
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];

    let balance = 0;
    try {
      balance = await config.db.get(balanceKey);
    } catch (balanceError) {}

    await config.db.put(balanceKey, utils.bigNumberify(balance).add(amount));
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

const timeMin = '0x00';

// get the users current balance, factoring in mempool spends
async function get(owner = '0x', token = '0x', config = {}) {
  try {
    // balance key
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];

    // balance
    let balance = 0;
    try {
      balance = await config.db.get(balanceKey);
    } catch (balanceError) {}
    balance = utils.bigNumberify(balance);

    // negative balance deltas from the mempool
    const decreases = (await streamToArray(config.db.createReadStream({
      gte: interface.db.decrease.encode([ owner, token, timeMin, 0, 0, utils.min_num ]),
      lte: interface.db.decrease.encode([ owner, token, timeMin, 4, 1, utils.max_num ]),
      limit: config.balance_limit || 1500,
      remote: true,
    })))
    .reduce((acc, { value }) => {
      return acc.add(utils.bigNumberify(value));
    }, utils.bigNumberify(0));

    // negative balance deltas from the mempool
    const increases = (await streamToArray(config.db.createReadStream({
      gte: interface.db.increase.encode([ owner, token, timeMin, 0, 0, utils.min_num ]),
      lte: interface.db.increase.encode([ owner, token, timeMin, 4, 1, utils.max_num ]),
      limit: config.balance_limit || 1500,
      remote: true,
    })))
    .reduce((acc, { value }) => {
      return acc.add(utils.bigNumberify(value));
    }, utils.bigNumberify(0));

    // final current balance
    return balance.add(increases).sub(decreases);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = {
  decrease,
  increase,
  get,
};
