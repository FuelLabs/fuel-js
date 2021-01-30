const { struct } = require('@fuel-js/struct');
const utils = require('@fuel-js/utils');
const transaction = require('./transaction');
const { merkleTreeRoot } = require('./merkle');

const MAX_ROOT_SIZE = 57600;
const MaxTransactionsInRoot = 2048;
const MIN_ROOT_SIZE = 44;

const RootHeader = struct(`
  address rootProducer,
  bytes32 merkleTreeRoot,
  bytes32 commitmentHash,
  uint256 rootLength,
  uint256 feeToken,
  uint256 fee
`);

const dataFromLog = async (log = {}, contract = {}) => {
  try {
    const transaction = await contract.provider.getTransaction(log.transactionHash);
    return contract.interface.parseTransaction(transaction).args[3];
  } catch (error) {
    throw new utils.ByPassError(error);
  }
};

const decodePacked = (data = '0x') => {
  const dataLength = utils.hexDataLength(data);
  let transactions = [];
  let pos = 0;

  for (;pos < dataLength;) {
    const length = utils.hexToInt(utils.hexDataSub(data, pos, 2)) + 2;

    utils.assert(length > transaction.TransactionSizeMinimum, "transaction-length-underflow");
    utils.assert(length < transaction.TransactionSizeMaximum, "transaction-length-overflow");

    transactions.push(utils.hexDataSub(data, pos, length));
    pos += length;
  }

  utils.assert(pos === dataLength, "net-length-overflow");
  utils.assert(transactions.length > 0, 'transaction-index-underflow');
  utils.assert(transactions.length < MaxTransactionsInRoot, 'transaction-index-overflow');

  return transactions;
};

RootHeader.fromLogs = async function (indexOrRoot, block = {}, contract = {}, transactions = false) {
  try {
    const logs = await contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      address: contract.address,
      topics: contract.filters.RootCommitted(!block
        ? indexOrRoot
        : block.properties.roots().get()[indexOrRoot]).topics,
    });

    const log = contract.interface.parseLog(logs[0]);
    return new RootHeader({ ...log.values });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
};

RootHeader.fromLogsByIndex = async function (index, block, contract, transactions = false) {
  return RootHeader.fromLogs(index, block, contract, transactions);
};

RootHeader.fromLogsByHash = async function (hash, contract, transactions = false) {
  return RootHeader.fromLogs(hash, null, contract, transactions);
};

const Leaf = struct('bytes1[**] data');
const transactions = leafs => '0x' + leafs.map(v => v.encodePacked().slice(2)).join('');
const encodePacked = transactions;

module.exports = {
  RootHeader,
  Leaf,
  merkleTreeRoot,
  transactions,
  MAX_ROOT_SIZE,
  MaxTransactionsInRoot,
  encodePacked,
  decodePacked,
  dataFromLog,
};
