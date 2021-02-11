const { struct } = require('@fuel-js/struct');
const utils = require('@fuel-js/utils');

const METADATA_MAX = 8;

const Metadata = struct(`
  uint32 blockHeight,
  uint8 rootIndex,
  uint16 transactionIndex,
  uint8 outputIndex
`);

const MetadataDeposit = struct(`
  uint32 token,
  uint32 blockNumber
`);

const MetadataStructs = [Metadata, MetadataDeposit];

const MetadataSize = 8;
const InputDepositType = 1;
const InputRootType = 3;

function decodePacked(data = '0x', inputs = []) {
  let result = [];
  let index = 0;
  let pos = 0;
  const dataLength = utils.hexDataLength(data);

  for (; pos < dataLength;) {
    const _type = inputs[index].properties.type().get();
    const isDeposit = _type
      .eq(InputDepositType);
    const decoder = isDeposit
      ? MetadataDeposit
      : Metadata;
    const _result = decoder.decodePacked(utils.hexDataSub(data, pos));

    // Enforce root decode rules.
    if (_type.eq(InputRootType)) {
      utils.assert(_result.properties.transactionIndex().get().eq(0), 'metadata-transaction-root-index');
      utils.assert(_result.properties.outputIndex().get().eq(0), 'metadata-output-root-index');
    }

    // Add result to array.
    result.push(_result);
    pos += MetadataSize;
    index++;
  }

  utils.assert(pos === dataLength, 'metadata-length-mismatch');
  utils.assert(result.length > 0, 'metadata-underflow');
  utils.assert(result.length === inputs.length, 'metadata-inputs-mismatch');
  utils.assert(result.length <= METADATA_MAX, 'metadata-overflow');

  return result;
}

/// @notice Verify an array of decoded metadata objects for overflow with current tx, or block.
function verifyMetadata({
  metadata,
  block,
  rootIndex,
  transactionIndex,
}) {
  for (const data of metadata) {
    const isDeposit = typeof data.properties
      .blockNumber !== "undefined";

    // Check deposit metadata.
    if (isDeposit) {
      // Block number under.
      utils.assert(data.properties.blockNumber()
        .get().gt(0), 'metadata-deposit-height-underflow');
      
      // Block number over.
      utils.assert(data.properties.blockNumber()
        .get().lte(block.properties.blockNumber().get()),
        'metadata-deposit-height-overflow');
      
      // Num token overflow.
      utils.assert(data.properties.token()
        .get().lt(block.properties.numTokens().get()),
        'metadata-deposit-token-overflow');
    } else { // Not deposit.
      // Height underflow.
      utils.assert(data.properties.blockHeight()
        .get().gt(0), 'metadata-height-underflow');
      
      // Height overflow.
      utils.assert(data.properties.blockHeight()
        .get().lte(block.properties.height().get()),
        'metadata-height-overflow');

      // Check for root overflow in same block.
      if (data.properties.blockHeight().get()
        .eq(block.properties.height().get())) {
        utils.assert(rootIndex < block.properties.roots()
          .get().length,
          'metadata-root-index-overflow');

        // Check for transaction index overflow.
        if (data.properties.rootIndex().get()
          .eq(rootIndex)) {
          utils.assert(data.properties.transactionIndex()
            .get().lt(transactionIndex),
            'metadata-transaction-index-overflow');
        }
      }

      // Height overflow.
      utils.assert(data.properties.outputIndex()
        .get().lt(8),
        'metadata-output-index-overflow');
    }


  }
}

module.exports = {
  decodePacked,
  Metadata,
  MetadataDeposit,
  MetadataStructs,
  verifyMetadata,
  MetadataSize,
  METADATA_MAX,
};
