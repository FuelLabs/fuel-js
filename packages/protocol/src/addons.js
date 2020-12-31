const { struct } = require('@fuel-js/struct');
const metadata = require('./metadata');
const inputs = require('./inputs');

const UTXO = struct(`
  uint64 timestamp,
  uint32 blockHeight,
  uint8 rootIndex,
  uint32 transactionIndex,
  uint32 outputIndex,
  uint32 blockNumber
`);

const Deposit = struct(`
  uint64 timestamp,
  bytes32 transactionHash
`);

const BlockHeader = struct(`
  uint64 timestamp,
  bytes32 transactionHash
`);

const RootHeader = struct(`
  uint64 timestamp,
  address blockProducer,
  uint32 rightmostIndex,
  uint32 blockHeight,
  uint32 blockNumber,
  uint8 rootIndex,
  bytes32 transactionHash
`);

const Transaction = struct(`
  bytes1[] transaction,
  uint32 blockHeight,
  uint8 rootIndex,
  uint32 transactionIndex,
  uint8 inputsLength,
  uint8 outputsLength,
  uint8 witnessesLength,
  uint32 blockNumber,
  uint64 timestamp,
  bytes32[] data,
  uint32 signatureFeeToken,
  uint256 signatureFee,
  bytes32[] spendableOutputs,
  bytes[][] deltas,
  bytes[][] outputProofs,
  bytes[][] inputProofs,
  bytes1[] inputTypes
`);

const Commitment = struct(`
  uint64 startTimestamp,
  uint64 startNonce,
  bytes32 startTransactionId,
  uint64 endTimestamp,
  uint64 endNonce,
  bytes32 endTransactionId,
  uint32 blockHeight,
  uint32 blockNumber,
  bytes32 transactionHash,
  bytes32[] roots
`);

// This is used for third party block production.
const CommitmentWait = struct(`
  uint64 time,
  bytes32[] roots,
  bytes[][] processed
`);

function metadataFromProofs(_inputs = [], proofs = []) {
  let result = [];

  for (var i = 0; i < _inputs.length; i++) {
    if (_inputs[i].properties.type().get().toNumber() === inputs.InputTypes.Deposit) {
      result.push(metadata.MetadataDeposit(proofs[i].object()));
    } else if (_inputs[i].properties.type().get().toNumber() === inputs.InputTypes.Root) {
      const addon = proofs[i].getAddon();
      result.push(metadata.Metadata(RootHeader(addon.object ? addon.object() : {}).object()));
    } else {
      const addon = proofs[i].getAddon();
      result.push(metadata.Metadata(UTXO(addon.object ? addon.object() : {}).object()));
    }
  }

  return result;
}

// Scan point struct.
// This is the point or tx last scanned from the mempool.
const ScanPoint = struct(`
    uint64 minTimestamp,
    uint64 minNonce,
    bytes32 minTransactionId
`);

// This is the balance struct used for tracking.
const Balance = struct(`
  uint256 syncBalance,
  uint256 mempoolBalance,
  bytes32 transactionHashId
`);

// Delta changes.
const Delta = struct(`
  uint256 amount,
  uint32 token,
  address account,
  uint8 isIncrease
`);

module.exports = {
  UTXO,
  RootHeader,
  BlockHeader,
  ScanPoint,
  Deposit,
  Balance,
  Delta,
  Transaction,
  Commitment,
  CommitmentWait,
  metadataFromProofs,
};
