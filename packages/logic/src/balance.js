const utils = require('@fuel-js/utils');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol');
const streamToArray = require('stream-to-array');
const emptyTxHash = utils.emptyBytes32;

// Deposit increase.
// This will increase the mempool and sync balance.
// But won't notify signal the baton change.

// This is the withdraw account used for balances of funds withdrawn.
function withdrawAccount(address = '0x') {
  return utils.hexDataSlice(utils.keccak256(address + 'dead'), 12, 32);
}

// This will handle the balance update puts, if it fails, it will write to a dump
async function put(key, obj, config) {
  try {
    await config.db.put(key, obj);
  } catch (putError) {
    config.console.error('Balance put error');
    config.console.error(putError);
    config.console.error(`Attempting to write to dump for: ${
      JSON.stringify(key)
    } ${
      JSON.stringify(obj.object())
    }`);

    if (config.write) {
      await config.write('./balance-dump.json', JSON.stringify([{
        type: 'put',
        key: key[0].encode([key[1], key[2]]),
        value: obj.encodeRLP(),
      }]));
      config.console.error('Balance dump write success');
    }

    throw new utils.ByPassError(putError);
  }
}

// handle the getting of the current balance logic
async function mempoolDecrease(
  owner = '0x',
  token = '0x',
  amount = {},
  config = {},
  transactionHashId = '0x') {
  try {
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];
    let balance = 0;
    let balObject = protocol.addons.Balance({});
    try {
      balObject = protocol.addons.Balance(
        await config.db.get(balanceKey),
      );

      // If no mempool balance available.
      if (balObject.properties
        .transactionHashId()
        .get() === emptyTxHash) {
        balance = balObject.properties.syncBalance().get();
      } else {
        balance = balObject.properties.mempoolBalance().get();
      }
    } catch (balanceError) {}

    // balance
    balance = utils.bigNumberify(balance)
      .sub(amount);

    if (balance.lt(0)) {
      throw new Error(`owner: ${owner} token: ${token} ${amount} ${balance.toHexString()} ${JSON.stringify(balObject.object())} balance negative on mempool decrease`);
    }

    // Balance.
    balObject.properties.mempoolBalance().set(
      balance,
    );
    balObject.properties.transactionHashId().set(
      transactionHashId,
    );

    await put(balanceKey, balObject, config);
    // await config.db.put(balanceKey, balObject);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// increase a users balance
async function increaseSyncAndMempool(
  owner = '0x',
  token = '0x',
  amount = {},
  config = {},
  transactionHashId = '0x') {
  try {
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];

    let balance = 0;
    let balObject = protocol.addons.Balance({});
    let mempoolBalance = 0;
    try {
      balObject = protocol.addons.Balance(
        await config.db.get(balanceKey),
      );
      balance = balObject.properties.syncBalance().get();
      mempoolBalance = balObject.properties.mempoolBalance().get();
    } catch (balanceError) {}

    // If the sync is up to the mempool transaciton hash, remove it!
    if (balObject.properties.transactionHashId()
      .get() === transactionHashId) {
      balObject.properties.transactionHashId().set(
        emptyTxHash,
      );
      balObject.properties.mempoolBalance().set(
        0,
      );
    }

    // Increase the sync balance in both cases.
    balObject.properties.syncBalance().set(
      utils.bigNumberify(balance).add(amount),
    );

    // If the mempool balance is being used, than increase it.
    if (balObject.properties.transactionHashId()
    .get() !== emptyTxHash) {
      balObject.properties.mempoolBalance().set(
        utils.bigNumberify(mempoolBalance).add(amount),
      );
    }
    await put(balanceKey, balObject, config);
    // await config.db.put(balanceKey, balObject);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// increase a users balance
async function mempoolIncrease(
  owner = '0x',
  token = '0x',
  amount = {},
  config = {},
  transactionHashId = '0x') {
  try {
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];

    let balance = 0;
    let balObject = protocol.addons.Balance({});
    try {
      balObject = protocol.addons.Balance(
        await config.db.get(balanceKey),
      );
      
      // If no mempool balance available.
      if (balObject.properties.transactionHashId()
        .get() === emptyTxHash) {
        balance = balObject.properties.syncBalance().get();
      } else {
        balance = balObject.properties.mempoolBalance().get();
      }
    } catch (balanceError) {}

    // Balance.
    balObject.properties.mempoolBalance().set(
      utils.bigNumberify(balance).add(amount),
    );
    balObject.properties.transactionHashId().set(
      transactionHashId,
    );

    await put(balanceKey, balObject, config);
    // await config.db.put(balanceKey, balObject);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// handle the getting of the current balance logic
async function decrease(
  owner = '0x',
  token = '0x',
  amount = {},
  config = {},
  transactionHashId = '0x') {
  try {
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];
    let balance = 0;
    let balObject = protocol.addons.Balance({});
    try {
      balObject = protocol.addons.Balance(
        await config.db.get(balanceKey),
      );
      balance = balObject.properties.syncBalance().get();
    } catch (balanceError) {}

    // balance
    balance = utils.bigNumberify(balance)
      .sub(amount);

    if (balance.lt(0)) {
      throw new Error(`owner: ${owner} token: ${token} ${balance.toHexString()} balance negative on decrease`)
    }

    // Balance.
    balObject.properties.syncBalance().set(
      balance,
    );

    // If the sync is up to the mempool transaciton hash, remove it!
    if (balObject.properties.transactionHashId()
      .get() === transactionHashId) {
      balObject.properties.transactionHashId().set(
        emptyTxHash,
      );
      balObject.properties.mempoolBalance().set(
        0,
      );
    }

    await put(balanceKey, balObject, config);
    // await config.db.put(balanceKey, balObject);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// increase a users balance
async function increase(
  owner = '0x',
  token = '0x',
  amount = {},
  config = {},
  transactionHashId = '0x') {
  try {
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];

    let balance = 0;
    let balObject = protocol.addons.Balance({});
    try {
      balObject = protocol.addons.Balance(
        await config.db.get(balanceKey),
      );
      balance = balObject.properties.syncBalance().get();
    } catch (balanceError) {}

    // If the sync is up to the mempool transaciton hash, remove it!
    if (balObject.properties.transactionHashId()
      .get() === transactionHashId) {
      balObject.properties.transactionHashId().set(
        emptyTxHash,
      );
      balObject.properties.mempoolBalance().set(
        0,
      );
    }

    // Balance.
    balObject.properties.syncBalance().set(
      utils.bigNumberify(balance).add(amount),
    );
    await put(balanceKey, balObject, config);
    // await config.db.put(balanceKey, balObject);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

const timeMin = '0x00';

// get the users current balance, factoring in mempool spends
async function get(
  owner = '0x',
  token = '0x',
  config = {}) {
  try {
    // balance key
    const balanceKey = [
      interface.db.balance,
      owner,
      token,
    ];

    // balance
    let balance = 0;
    let balObject = protocol.addons.Balance({});
    try {
      balObject = protocol.addons.Balance(
        await config.db.get(balanceKey),
      );
      balance = balObject.properties.syncBalance().get();
    } catch (balanceError) {}
    balance = utils.bigNumberify(balance);

    // final bal.
    let finalBalance = 0;

    // If there is a transaction hash id present
    // we use mempool otherwise sync.
    if (balObject.properties.transactionHashId()
      .get() !== emptyTxHash) {
        finalBalance = balObject.properties.mempoolBalance()
          .get();
    } else {
        finalBalance = balObject.properties.syncBalance()
          .get();
    }

    return finalBalance;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = {
  withdrawAccount,
  increaseSyncAndMempool,
  mempoolDecrease,
  mempoolIncrease,
  decrease,
  increase,
  get,
};
