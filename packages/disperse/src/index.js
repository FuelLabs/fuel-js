const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const { Wallet } = require('@fuel-js/wallet');

// zero value
const zero = utils.bigNumberify(0);

// the total amount of value being sent
function totalValue(values = []) {
  return values.reduce((acc, { value }) => {
    return acc.add(utils.bigNumberify(value));
  }, zero);
}

// resolve number to a bignumber
function resolveNumber(int = 0) {
  return utils.bigNumberify(utils.bigNumberify(int).toNumber());
}

// owner db key
function ownerKey(owner = '0x', eventId = 0, config = {}) {
  return utils.RLP.encode(config.prefix, owner, resolveNumber(eventId));
}

// transaction key
function transactionKey(transactionId = '0x', eventId = 0, config = {}) {
  return utils.RLP.encode(config.prefix, transactionId, resolveNumber(eventId));
}

// send one tx to setup disperal amount and change
// the rest of the dispersal transactions will be databased in config.db
// it will create a seperate key to manage the dispersal outputs
async function disperse(wallet = {}, token = 0, eventId = 0, values = [], config = {}) {
  try {
    // get total balance being sent and check wallet balance
    const total = totalValue(values);
    const available = await wallet.balance();

    // prefix and config setup
    const prefix = config.prefix;

    // assert the wallet has enough balance
    utils.asssert(available.gte(total), 'wallet-balance-underflow');

    // dispersal key generation
    const dispersalWallet = new Wallet(null, {
      network: (await wallet.getNetwork()).name,
    });

    // transfer from the wallet to the key
    const submission = await wallet.transfer(token, dispersalWallet.address, total);

    // assert the key has the correct balance for multi-send
    utils.assert((await dispersalWallet.balance(token)).gte(total), 'dispersal-wallet-underflow');

    // assert db prefix
    // here disperse all txs and database in config.db
    // one output to many outputs each time, database all txs, don't send them
    for (let i = 0; i < 0; i++) {
      const transaction = await dispersalWallet.transfer(dispersalWallet.address, token, targetValue, {
        raw: true,
        inputs: [],
        outputs: [],
      });
    }

    // return the details about the initial submission, the wallet key used to disperse and amount
    return {
      submission,
      wallet: dispersalWallet,
      amount: total,
    };
  } catch (disperseError) {
    throw new utils.ByPassError(disperseError);
  }
}

// database keys
// [prefix, owner, eventId] => transactionId
// [prefix, transactionId, eventId] => [ unsigned, witnesses, parent, spentHex ]

// this will pickup/claim the dispersal txs for this account
// this will use the config db to lookup the necessary dispersals
async function claim(owner = '0x', eventId = 0, config = {}) {
  // lookup
  let transactionId = utils.RLP.decode(await config.db.get(ownerKey(owner, eventId, config)));
  let submission = null;
  const claims = [];

  // work it's way back through the transaction tree
  while (transactionId) {
    try {
      // get the transaction from the db, if it's not available, it has already been sent
      const [
        unsigned,
        witnesses,
        parent,
      ] = utils.RLP.decode(await config.db.get(transactionKey(
        transactionId,
        eventId,
        config,
      )));

      // claim
      claims.push([ unsigned, witnesses, transactionId ]);

      // set the id to the parent
      transactionId = parent;
    } catch (transactionAvailable ) {
      transactionId = null;
    }
  }

  // reverse the claims to highest root first, attempt to spend all claims down the tree
  for (const [ unsigned, witnesses, transactionId ] of claims.reverse()) {
    try {
      // send each tx sequentiall on pickup
      submission = await config.transact(unsigned, witnesses, 0, config);

      // if the tx was sent successfully we delete if from the db
      await config.db.del(transactionKey(
        transactionId,
        eventId,
        config,
      ));
    } catch (transactError) {}
  }

  // return the final submission, which is the claim to the user themselves
  return submission;
}

module.exports = {
  totalValue,
  disperse,
  claim,
};
