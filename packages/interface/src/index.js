const Key = require('@fuel-js/key');

let index = 0;
const db = {
  walletInput: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'uint32 token', 'bytes32 inputHash'),
  inputHash: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),
  inputMetadata: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex', 'uint8 outputIndex'),
  archiveHash: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),
  archiveMetadata: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex', 'uint8 outputIndex'),
  archiveOwner: Key(index++, 'address owner', 'uint64 timestamp', 'bytes32 transactionId'),
  owner: Key(index++, 'address owner', 'uint8 type', 'uint8 isWithdrawal', 'uint64 timestamp', 'bytes32 inputHash'),
  transaction: Key(index++, 'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex'),
  transactionId: Key(index++, 'bytes32 transactionHashId'),
  transactionMetadata: Key(index++, 'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex'),
  address: Key(index++, 'uint32 addressId'),
  limit: Key(index++, 'uint128 ip', 'uint64 unixhour'),
  addressId: Key(index++, 'address addr'),
  token: Key(index++, 'uint32 tokenId'),
  contract: Key(index++),
  tokenId: Key(index++, 'address token'),
  spent: Key(index++, 'uint8 type', 'bytes32 inputHash'),
  mempool: Key(index++, 'uint64 timestamp', 'uint32 nonce', 'bytes32 transactionHashId'),
  root: Key(index++, 'uint32 blockHeight', 'uint8 rootIndex'),
  block: Key(index++, 'uint32 blockHeight'),
  fee: Key(index++, 'address token'),
  deposit: Key(index++, 'uint32 blockNumber', 'address token', 'address owner'),
  state: Key(index++),
  commitment: Key(index++),
  return: Key(index++, 'bytes32 inputHash', 'uint8 outputIndex'),
  caller: Key(index++, 'address owner', 'uint32 blockNumber'),
  unfinalized: Key(index++, 'uint32 blockNumber', 'bytes32 hash'),
  faucet: Key(index++, 'uint64 start', 'uint32 nonce'),
};

module.exports = {
  db,
};
