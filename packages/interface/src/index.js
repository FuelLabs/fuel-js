const Key = require('@fuel-js/key');

// The incrementing key index to make each key unique
let index = 0;

// The Fuel Database Key Structure
const db = {
  // Non-essential, Used for the Wallet => UTXO / Deposit / Root
  walletInput: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'uint32 token', 'bytes32 inputHash'),

  // Prunable, Input Hash => UTXO / Deposit / Root
  inputHash: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),

  // Essential, Input Metadata => UTXO / Deposit / Root
  inputMetadata: Key(index++, 'uint8 type', 'uint8 isWithdrawal',
    'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex', 'uint8 outputIndex'),

  // Prunable, Archival Inputs
  archiveHash: Key(index++, 'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),
  archiveMetadata: Key(index++, 'uint8 type', 'uint8 isWithdrawal',
    'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex', 'uint8 outputIndex'),

  // Prunable, Archival Transaction Record => transactionId
  archiveOwner: Key(index++, 'address owner', 'uint64 timestamp', 'bytes32 transactionId'),

  // Prunable, owner input
  owner: Key(index++, 'address owner', 'uint32 token', 'uint64 timestamp',
    'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),

  // Ignored, transaction metadata => transactionId
  transaction: Key(index++, 'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex'),

  // Prunable, transaction ID
  transactionId: Key(index++, 'bytes32 transactionHashId'),

  // Prunable, transaction metadata => transactionId
  transactionMetadata: Key(index++, 'uint32 blockHeight', 'uint8 rootIndex', 'uint32 transactionIndex'),

  // Essential, address id => address
  address: Key(index++, 'uint32 addressId'),

  // Prunable, Rate limiting for faucet
  limit: Key(index++, 'uint128 ip', 'uint64 unixhour'),

  // Essential, Address => Address ID
  addressId: Key(index++, 'address addr'),

  // Essential, token id => token
  token: Key(index++, 'uint32 tokenId'),

  // Prunable, contract address / info
  contract: Key(index++),
  tokenId: Key(index++, 'address token'),
  spent: Key(index++, 'uint8 type', 'bytes32 inputHash'),

  // Prunable, mempool transaction record
  mempool: Key(index++, 'uint64 timestamp', 'uint32 nonce', 'bytes32 transactionHashId'),

  // Prunable, root archive record
  root: Key(index++, 'uint32 blockHeight', 'uint8 rootIndex'),

  // Essential, block header
  block: Key(index++, 'uint32 blockHeight'),

  // Prunable, fee token
  fee: Key(index++, 'address token'),

  // Essential, deposit proof for processign
  deposit: Key(index++, 'uint32 blockNumber', 'address token', 'address owner'),

  // Essential, current State object where the client is at
  state: Key(index++),

  // Prunable, mempool commitment
  commitment: Key(index++),

  // Prunable, return data
  return: Key(index++, 'bytes32 inputHash', 'uint8 outputIndex'),

  // Essential, for witnesses
  caller: Key(index++, 'address owner', 'uint32 blockNumber'),

  // Essential, for rewinds
  unfinalized: Key(index++, 'uint32 blockNumber', 'bytes32 hash'),

  // Prunable, faucet position nonce and start
  faucet: Key(index++, 'uint64 start', 'uint32 nonce'),

  // Prunable, faucet position nonce and start
  balance: Key(index++, 'address owner', 'uint32 token'),

  // Prunable, negative change delta for an owner
  // spending in the mempool, similar to owner but in reverse
  increase: Key(index++, 'address owner', 'uint32 token',
    'uint64 timestamp', 'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),

  // Prunable, negative change delta for an owner spending
  // in the mempool, similar to owner but in reverse
  decrease: Key(index++, 'address owner', 'uint32 token',
    'uint64 timestamp', 'uint8 type', 'uint8 isWithdrawal', 'bytes32 inputHash'),
};

module.exports = {
  db,
};
