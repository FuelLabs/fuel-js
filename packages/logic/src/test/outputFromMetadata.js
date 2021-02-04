const protocol = require('@fuel-js/protocol');
const utils = require('@fuel-js/utils');

/// @notice Proof from Metadata and Input.
/// @notice Proof from Metadata and Input.
async function outputFromMetadata({ metadata, config }) {
    const block = await protocol.block.BlockHeader.fromLogs(
      metadata.properties.blockHeight().get().toNumber(),
      config.contract,
    );
  
    utils.assert(block.properties, 'block-not-found');
  
    const rootIndex = metadata.properties.rootIndex().get().toNumber();
    const roots = block.properties.roots().get();
  
    // Check the root index isn't invalid.
    utils.assert(roots[rootIndex], 'roots-index-overflow');

    // Get the root from logs.
    const rootHash = roots[rootIndex];
    const logs = await config.contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      address: config.contract.address,
      topics: config.contract.filters.RootCommitted(rootHash).topics,
    });
  
    // Check root is real.
    utils.assert(logs.length > 0, 'no-root-available');
  
    // Parse log and build root struct.
    const log = config.contract.interface.parseLog(logs[0]);
    const root = new protocol.root.RootHeader({ ...log.values });
  
    // Get the root transaction data.
    const transactionData = await config.provider
      .getTransaction(logs[0].transactionHash);
    const calldata = config.contract.interface.parseTransaction(transactionData)
      .args[3];
  
    // attempt to decode the root from data.
    const transactions = protocol.root.decodePacked(calldata);
  
    // Selected transaction index.
    const transactionIndex = metadata.properties.transactionIndex().get();
  
    // Check index overflow.
    utils.assert(transactions[transactionIndex], 'transaction-index');
  
    // Check transaction output overflow.
    const transaction = protocol.transaction
      .decodePacked(transactions[transactionIndex]);
  
    // Check output index overflow.
    const outputIndex = metadata.properties.outputIndex().get();
  
    // Output index overflow check.
    utils.assert(transaction.outputs[outputIndex], 'output-index-overflow');

    // Output in question.
    return transaction.outputs[outputIndex];
}

module.exports = outputFromMetadata;