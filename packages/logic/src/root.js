const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol2');
const struct = require('@fuel-js/struct');
const interface = require('@fuel-js/interface');
const transact = require('./transact');
const operatorsToWallets = require('./operatorsToWallets');
const transaction = require('@fuel-js/protocol2/src/transaction');

/// @dev Transacting a single or all the root transactions if posisble.
async function transactRoot(log = {}, root = {}, config = {}) {
    // Check if block production is on.
    if (!config.produce) return;

    // Proposed block height and root index
    const operators = operatorsToWallets(config);
    const blockProducer = operators[0]; // first operator is block producer

    // Check if the block producer is the operator.
    const productionOperator = config.proxy
      ? config.proxy.address
      : blockProducer.address;

    // Get the operator.
    const operator = await config.contract.operator();

    // Check if production operator is third-party or not.
    // If not third-party we don't do advanced root production.
    if (productionOperator !== operator) {
        return;
    }

    // Root producer.
    const rootProducer = await root.properties.rootProducer().get();

    // If this is our root, we do not do advanced root production on it.
    if (rootProducer === blockProducer.address
        || rootProducer === productionOperator) {
        return;
    }

    // Get the root transaction data.
    const transactionData = await config.provider
        .getTransaction(log.transactionHash);
    const calldata = config.contract.interface.parseTransaction(
        transactionData
    ).args[3];

    // attempt to decode the root from data.
    const transactions = protocol.root.decodePacked(calldata);

    // Get wallets.
    const wallets = operatorsToWallets(config);

    // Is third party.
    let isThirdParty = true;

    // If root producer not a wallet, then process.
    for (const wallet of wallets) {
        // Check address.
        if (wallet.address === rootProducer) {
            isThirdParty = false;
        }
    }

    // Don't process if it's from the producer, not third party.
    if (!isThirdParty) return;

    // Iterate through txs.
    for (const tx of transactions) {
        // Check transaction output overflow.
        const transaction = protocol.transaction
            .decodePacked(tx);

        // This covers the UTXO data hashes for each input in this tx.
        // The map of this is stored in the db.
        let data = [];

        // Go through each input and build the data array.
        for (var i = 0; i < transaction.inputs.length; i++) {
            const _input = transaction.inputs[i];
            const _metadata = transaction.metadata[i];
            const _type = _input.properties.type()
                .get().toNumber();
            const _isWithdraw = _type === protocol.inputs.InputTypes.Withdraw
                ? 1 : 0;
        
            // Handle different kinds of inputs.
            switch (_type) {
                case protocol.inputs.InputTypes.Transfer:
                    // Push data into data array.
                    data.push(
                    await config.db.get([
                        interface.db.inputMetadataHash,
                        _type,
                        _isWithdraw,
                        _metadata.properties.blockHeight().get(),
                        _metadata.properties.rootIndex().get(),
                        _metadata.properties.transactionIndex().get(),
                        _metadata.properties.outputIndex().get(),
                    ]),
                    );
                    break;

                case protocol.inputs.InputTypes.Deposit:
                    // Get the deposit amount.
                    const _amount = await config.contract.depositAt(
                        _input.properties.owner().hex(),
                        _metadata.properties.token().get(),
                        _metadata.properties.blockNumber().get(),
                    );

                    // Look up deposit details namely, amount.
                    data.push(
                        protocol.deposit.Deposit({
                            value: _amount,
                            owner: _input.properties.owner().hex(),
                            token: _metadata.properties.token().get(),
                            blockNumber: _metadata.properties.blockNumber().get(),
                        }).keccak256(),
                    );
                    break;

                case protocol.inputs.InputTypes.Root:
                    // Look up the block, than the root hash, than the root.
                    const _block = await protocol.block.BlockHeader.fromLogs(
                        _metadata.properties.blockHeight().get().toNumber(),
                        config.contract,
                    );

                    // Get the root index, than root hash.
                    const _rootIndex = _metadata.properties.rootIndex().get();
                    const _rootHash = _block.properties.roots().get()[_rootIndex];
                    
                    // Than get the logs for this root hash.
                    const _logs = await config.contract.provider.getLogs({
                        fromBlock: 0,
                        toBlock: 'latest',
                        address: config.contract.address,
                        topics: config.contract.filters.RootCommitted(_rootHash).topics,
                    });

                    // Than get the root header.
                    const _log = config.contract.interface.parseLog(_logs[0]);
                    const _root = new protocol.root.RootHeader({ ..._log.values });

                    // Look up root log.
                    data.push(
                        _root.keccak256Packed(),
                    );
                    break;

                case protocol.inputs.InputTypes.HTLC:
                    // Push data into data array.
                    data.push(
                        await config.db.get([
                            interface.db.inputMetadataHash,
                            _type,
                            _isWithdraw,
                            _metadata.properties.blockHeight().get(),
                            _metadata.properties.rootIndex().get(),
                            _metadata.properties.transactionIndex().get(),
                            _metadata.properties.outputIndex().get(),
                        ]),
                    );
                    break;

                default:
                    utils.assert(0, 'invalid-type');
            }
        }

        // Build unsigned tx.
        const unsigned = protocol.transaction
        .Unsigned({
            inputs: transaction.inputs,
            outputs: transaction.outputs,
            data,
            signatureFeeToken: root.properties.feeToken().get(),
            feeToken: root.properties.fee().get(),
        });

        try {
            await transact(
                unsigned.encodeRLP(),
                struct.combine(transaction.witnesses),
                0,
                {
                    ...config,
                    feeEnforcement: false,
                },
            );
        } catch (transactError) {
            config.console.error(transactError);
        }
    }
}

module.exports = transactRoot;