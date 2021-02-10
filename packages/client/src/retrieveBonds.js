const protocol = require('@fuel-js/protocol');

// @dev Retrieve bonds from a given contract.
async function retrieveBonds(address = null, config = {}) {
    // The Fuel contract.
    let contract = config.contract;

    // If a secondary address specified, then use this.
    if (address) {
        // Attahc new address.
        contract = contract.attach(address);
    }

    // Attahc operator.
    contract = contract.connect(config.connectedOperator);

    // Scan through all logs
    const logs = await contract.provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: contract.address,
        topics: contract.filters.BlockCommitted(null, null, null, null, null).topics,
    });

    // Go through each log.
    for (const log of logs) {
        // Decode log.
        const parsedLog = contract.interface.parseLog(log);

        // Block header.
        const blockHeader = new protocol.block.BlockHeader({
            ...parsedLog.values,
            blockNumber: log.blockNumber,
        });

        // Skip genesis block.
        if (blockHeader.properties.height().get().lte(0)) {
            continue;
        }

        // If not continue, stop.
        if (!config.continue()) {
            break;
        }

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
                    blockHeader.encodePacked(),
                ]);

                // Set block commitment.
                const txValue = 0;
                retrievalTx = await config.proxy.transact(
                    contract.address,
                    txValue, // no value.
                    bondWithdraw,
                    txOptions,
                );
            } else {
                // Retrieval transaction.
                retrievalTx = await contract.bondWithdraw(
                    blockHeader.encodePacked(),
                    txOptions,
                );
            }

            // Wait for retrieval.
            retrievalTx = await retrievalTx.wait();
        } catch (retrievalError) {
            config.console.error(`Bond retreival error during transaction for block ${
                blockHeader.properties.height().get().toNumber()
            }`);
            config.console.error(retrievalError);
        }
    }
}

module.exports = retrieveBonds;