/// @dev This will download and or resubmit the mempool.
const mempool = require('./mempool');
const transact = require('./transact');
const protocol = require('@fuel-js/protocol');
const utils = require('@fuel-js/utils');

/// @dev backup mempool.
async function backup(config = {}) {
    utils.assert(config.write, 'no config write activated');

    // Backup data.
    let data = [];

    // Get the db scan point.
    let scanPoint = protocol.addons.ScanPoint({});

    // Keep downloading the mempool.
    while (true) {
        // Grab transactions from mempool.
        const entries = await mempool({
            ...scanPoint.object(),
            limit: 5000,
        }, config);

        // On last entry break.
        if (entries.length === 1
            && entries[1].transactionHashId === scanPoint.properties
                .minTransactionId().hex()) {
            break;
        };

        // Break when no more entires left.
        if (!entries.length) {
            break;
        }

        // Go through tx's
        for (const {
            end,
            transaction,
            transactionHashId,
        } of entries) {
            // Skip the first because the mempool scan is GTE.
            if (transactionHashId === scanPoint.properties.minTransactionId().hex()) {
                continue;
            }

            // Add the encoded tx payload.
            data.push(transaction.encodeRLP());
            
            // Add scan point to DB.
            scanPoint = protocol.addons.ScanPoint({
                minTimestamp: end.timestamp,
                minNonce: end.nonce,
                minTransactionId: end.transactionId,
            });
        }
    }

    // Mempool backup path.
    const backup_path = 'mempool-backup.json';

    // Write this to a file.
    await config.write(backup_path, JSON.stringify(data));
}

/// @dev resubmit mempool.
async function restore(path = '', config = {}) {
    utils.assert(config.read, 'no config read activated');
    let data = null;

    // if the user provided a wallet path, try to read it
    try {
        data = JSON.parse(await config.read(path, 'utf8'));
    } catch (readError) {
        throw new Error('Error reading mempool backup ' + readError.message);
    }

    // Restore console.
    config.console.log(`Transactions to be restored: `, data);

    // Go through transactions and resubmit them.
    for (const transactionRLP of data) {
        // Decode the mempool transaciton.
        const transaction = protocol.transaction._Transaction.decodeRLP(
            transactionRLP,
            protocol.addons.Transaction,
        );
        const addon = transaction.getAddon();

        // Build unsigned tx.
        const unsigned = protocol.transaction
        .Unsigned({
            inputs: transaction.properties.inputs().get(),
            outputs: transaction.properties.outputs().get(),
            data: addon.properties.data().get(),
            signatureFeeToken: addon.properties.signatureFeeToken().get(),
            feeToken: addon.properties.signatureFee().get(),
        });

        // Attempt to transact this transaciton from the mempool.
        try {
            await transact(
                unsigned.encodeRLP(),
                transaction.properties.witnesses().get(),
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

module.exports = {
    backup,
    restore,
};