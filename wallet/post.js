const { assertNew } = require('../structs/structs');
const types = require('../types/types');
const _utils = require('../utils/utils');
const { FuelDBKeys, FuelInterface, ERC20Interface } = require('../interfaces/interfaces');
const { addresses, networks } = require('../config/config');
const errors = require('../errors/errors');
const { Contract } = require('ethers');
const { parseTransactions } = require('../blocks/parseTransactions');
const { transactionsFromReceipt } = require('../blocks/processBlock');
const { intakeTransaction } = require('../transactions/intakeTransaction');

// Test post
module.exports = (db, mempool, accounts, faucet) => async (url, args = {}) => {
  try {
    types.TypeString(url);
    types.TypeObject(args);

    if (url.indexOf('/get') !== -1) {
      types.TypeHex(args.key);

      return { data: { error: null, result: await db.get(args.key) }};
    }

    if (url.indexOf('/transact') !== -1) {
      types.TypeHex(args.transaction);

      const result = await intakeTransaction({
        transaction: args.transaction,
        db,
        mempool,
        accounts,
      });

      // send out result
      return { data: { error: null, result: result ? '0x1' : '0x0' }};
    }

    if (url.indexOf('/faucet') !== -1) {
      const ip = '0.0.0.0';
      TypeHex(args.address, 20);

      await db.set(FuelDBKeys.ip + ip, '1'); // SHOULD BE ,false); // prevent duplicates for issuance..
      await faucet.set(FuelDBKeys.ip + ip, args.address);

      // send out result
      return { data: { error: null, result: '0x1' }};
    }

    if (url.indexOf('/account') !== -1) {
      types.TypeHex(args.address, 20);

      // Get Block Number
      const dbKeys = await accounts.keys(args.address);
      const getAllEntries = await db.batch(dbKeys.map(key => ({
        type: 'get',
        key,
      })));

      // send out result
      return { data: { error: null, result: _utils.RLP.encode([dbKeys, getAllEntries]) }};
    }
  } catch (error) {
    throw new errors.ByPassError(error);
  }
};
