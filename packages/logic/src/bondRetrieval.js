const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const interface = require('@fuel-js/interface');
const operatorsToWallets = require('./operatorsToWallets');

/// @dev this will retrieve bonds from blocks that have finalized.
/// @dev the last retrieved marker actually describes the next block up to be retrieved.
/// @dev it is increased after last retrieval is a success.
async function bondRetrieval(state = {}, config = {}) {
    // Get last retrieved block from the db, start at block 1.
    let lastRetrieved = utils.bigNumberify(1);
    try {
        lastRetrieved = utils.bigNumberify(await config.db.get([
            interface.db.lastRetrieved,
        ]));
    } catch (dbError) {}

    /// Get last block.
    let lastBlockRetrieved = protocol.block.BlockHeader({});
    try {
        lastBlockRetrieved = protocol.block.BlockHeader(await config.db.get([
            interface.db.block,
            lastRetrieved,
        ]));
    } catch (blockError) {}

    // If the block is empty or genesis, don't retrieve.
    if (lastBlockRetrieved.properties.height().get().lte(0)) return;

    // Check finaliation of the next up block.
    if (state.properties.blockNumber().get()
        .lte((lastBlockRetrieved.properties.blockNumber()
        .get().add(config.FINALIZATION_DELAY)))) return;

    // Log the retrieval has begin.
    config.console.log(`Starting bond retrieval for block: ${
        lastRetrieved.toNumber()
    }`);

    // Proposed block height and root index
    const operators = operatorsToWallets(config);
    const blockProducer = operators[0]; // first operator is block producer

    // Production operator.
    const productionOperator = config.proxy
      ? config.proxy.address
      : blockProducer.address;

    // If producer is the production operator.
    if (lastBlockRetrieved.properties.producer()
        .hex().toLowerCase() === productionOperator.toLowerCase()) {

        // The contract for block production.
        const contract = config.contract.connect(blockProducer); // rootProducers[rootIndex]);

        // Stub for tx.
        let retrievalTx = null;

        // Options.
        const txOptions = {
            gasLimit: 4000000,
        };

        // Retrieval.
        try {
            // If the operator is a proxy, handle that, otherwise just normal transaciton.
            if (config.proxy) {
                // Commit transaction encoded data.
                const bondWithdraw = contract.interface.functions.bondWithdraw.encode([
                    lastBlockRetrieved.encodePacked(),
                ]);

                // Set block commitment.
                const txValue = 0;
                retrievalTx = await config.proxy.transact(
                    config.contract.address,
                    txValue, // no value.
                    bondWithdraw,
                    txOptions,
                );
            } else {
                // Retrieval transaction.
                retrievalTx = await contract.bondWithdraw(
                    lastBlockRetrieved.encodePacked(),
                    txOptions,
                );
            }

            // Wait for retrieval.
            retrievalTx = await retrievalTx.wait();
        } catch (retrievalError) {
            config.console.error(`Bond retreival error during transaction for block ${
                lastRetrieved.toNumber()
            }`);
            config.console.error(retrievalError);
            return;
        }
    } else {
        config.console.log(`Skipping retrieval for block: ${
            lastRetrieved.toNumber()
        } as operator is not the producer for this block.`);
    }

    // Increase last retrieved and write to DB.
    lastRetrieved = lastRetrieved.add(1);
    try {
        await config.db.put([
            interface.db.lastRetrieved,
        ], lastRetrieved);

        config.console.log(`Bond successfully retrieved for block: ${
            lastRetrieved.toNumber() - 1
        }`);
    } catch (dbError) {
        console.log(dbError);
        config.console.error(`Error while writting last retrieved, manual increase required from ${
            lastRetrieved.toNumber()
        }`);
    }
}

// Export.
module.exports = bondRetrieval;