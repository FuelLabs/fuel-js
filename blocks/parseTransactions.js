const { utils } = require('ethers');
const {
  hexToInt,
  bytes,
} = require('../utils/utils');

const {
  FuelConstants,
  TransactionLengthByteSize,
  FuelDBKeys,
} = require('../interfaces/interfaces');

const {
  assertOrFraud,
} = require('../errors/errors');

const {
  TypeArray,
  TypeNumber,
  TypeHex,
} = require('../types/types');

// parse a block of transactions, throw if any malfored
function parseTransactions(transactions) {
  // Enforce Types
  TypeHex(transactions);

  let index = 0;
  let leafs = [];
  let transactionLength = 0;

  do {
    // Parse Transactions
    const transactionsData = transactions.slice(2); // remove hex prefix
    transactionLength = hexToInt('0x' + (transactionsData.substr(index, TransactionLengthByteSize) || '00'));
    const leaf = '0x' + transactionsData.substr(index, bytes(transactionLength));
    const netLength = index + bytes(transactionLength);

    // Stop and return leafs // maybe adjust for if index > transaction length
    if (leafs.length > 0 && transactionLength === 0) { return leafs; }

    // Assert transaction length is not too short
    assertOrFraud(transactionLength > FuelConstants.TransactionSizeMinimum,
      FuelConstants.FraudCode_TransactionLengthUnderflow);

    // Assert transaction length is not too long
    assertOrFraud(transactionLength <= FuelConstants.TransactionSizeMaximum,
      FuelConstants.FraudCode_TransactionLengthOverflow);

    // Assert transaction length is not too long
    assertOrFraud(netLength <= transactionsData.length,
      FuelConstants.FraudCode_InvalidTransactionsNetLength);

    // mutable input is bad, but in JS most efficient!
    leafs.push(leaf);

    index = netLength;
  } while (transactionLength > 0);

  // Return leafs..
  return leafs;
}

module.exports = {
  parseTransactions,
};
