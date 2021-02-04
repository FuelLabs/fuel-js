const protocol = require('@fuel-js/protocol');
const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
const { simulate } = require('@fuel-js/down');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');
const memdown = require('memdown');
const balance = require('./balance');
const mempool = require('./mempool');

// This will reconsile the account balances of users mempool / sync.
async function reconcileMempoolBalance(config = {}) {
    // Log this process.
    // config.console.log('reconsiling balances');

    // Get the db scan point.
    let scanPoint = protocol.addons.ScanPoint({});

    // Try to get the current scan point if available.
    try {
        scanPoint = protocol.addons.ScanPoint(await config.db.get([ 
            interface.db.scanPoint,
        ]));
    } catch (error) {}

    // The starting options.
    const options = {
        ...scanPoint.object(),
        limit: 2000,
    };

    // Grab transactions from mempool.
    const entries = await mempool(options, config);

    // Mark off last end.
    let lastEnd = null;

    // We are gonna do all the balance work locally.
    // We do this in a simulation DB locally.
    utils.assert(config.db.supports.local, 'db must support .local');
    const db = database(simulate(config.db.supports.local, memdown()));

    // setup a local config but with the new simulation db
    const local = { ...config, db };

    // Go through tx's
    try {
        for (const {
            end,
            transaction,
            transactionHashId,
        } of entries) {
            // Skip the first because the mempool scan is GTE.
            if (transactionHashId === scanPoint.properties.minTransactionId().hex()) {
                continue;
            }

            // Get the transaction addon.
            const addon = transaction.getAddon();

            // Put this spend locally (it's already in the remote db from transact).
            let inputIndex = 0;

            // Input types.
            const inputTypes = addon.properties.inputTypes().get();

            // Go through spent data and write those spents locally.
            for (const data of addon.properties.data().get()) {
                // Get input type.
                const inputType = inputTypes[inputIndex];

                // Put spent locally.
                await config.db.put([interface.db.spent, inputType, data ], '0x01', {
                    local: true,
                    remote: false,
                });

                // Increase input index.
                inputIndex++;
            }

            // Deltas.
            const deltas = addon.properties
                .deltas()
                .get()
                .map(deltaRLP => protocol.addons.Delta.decodeRLP(
                    deltaRLP,
                ));

            // Increases first
            for (const delta of deltas) {
                // If an increase
                if (delta.properties.isIncrease()
                    .get().eq(1)) {
                    await balance.mempoolIncrease(
                        delta.properties.account().hex(),
                        delta.properties.token().hex(),
                        delta.properties.amount().get(),
                        local,
                        transactionHashId);
                }
            }

            // Than do all the decreases
            for (const delta of deltas) {
                // If an increase
                if (delta.properties.isIncrease()
                    .get().eq(0)) {
                    await balance.mempoolDecrease(
                        delta.properties.account().hex(),
                        delta.properties.token().hex(),
                        delta.properties.amount().hex(),
                        local,
                        transactionHashId);
                }
            }

            // Set the last end.
            lastEnd = {
                minTimestamp: end.timestamp,
                minNonce: end.nonce,
                minTransactionId: end.transactionId,
            };
        }
    } catch (errorWhileProcessing) {
        config.console.error('Error while processing reconsiling balances');
        config.console.error(errorWhileProcessing);

        throw new utils.ByPassError(errorWhileProcessing);
    }

    // Get the entries from the simulated DB.
    let dbEntries = (await streamToArray(db.createReadStream({
        deleted: true,
    }))).map(entry => ({
        type: 'del',
        key: entry.value,
    })).concat((await streamToArray(db.createReadStream({
        beforedeleted: true,
    }))).map(entry => ({
        type: 'put',
        key: entry.key,
        value: entry.value,
    }))).concat((await streamToArray(db.createReadStream({
        afterdeleted: true,
    }))).map(entry => ({
        type: 'put',
        key: entry.key,
        value: entry.value,
    })));

    // 20k per batch, safley 256 per payload for now, ~1.3 minutes per 100k writes
    const batchSize = 20000;
    const payloadSize = 256;
    const numberOfRetries = 10;

    // Db entry.
    if (dbEntries.length > 0) {
        config.console.log(`Reconsiling ${dbEntries.length} account balances.`);
    }

    // Make 20k groups of batches, execute them in parallel in payloads of 128 writes each
    try {
        for (var retry = 0; retry < numberOfRetries; retry++) {
            try {
                // We attempt a large 20k batch size first, if it fails, than we try smaller batch sizes
                const batchAttemptSize = Math.round(batchSize / (retry + 1));

                // attempt 20k batchs
                for (var bindex = 0; bindex < dbEntries.length; bindex += batchAttemptSize) {
                    const _entries = dbEntries.slice(bindex, bindex + batchAttemptSize);
                    let batches = [];

                    // build the payloads
                    for (var index = 0; index < _entries.length; index += payloadSize) {
                        batches.push(config.db.batch(_entries.slice(index, index + payloadSize)));
                    }

                    // send entire batch and payloads in parallel
                    await Promise.all(batches);
                }

                // if all is well, break retry cycle, carry on..
                break;
            } catch (error) {
                // If on the last retry, than throw an error.
                if (retry > numberOfRetries - 2) {
                  throw new utils.ByPassError(error);
                }
      
                // wait 10 seconds for potentially more connections
                await utils.wait(10000);

                // let the terminal know a batch error has occured
                config.console.error(`batch processing of balances`);
            }
        }

        // Add scan point to DB.
        if (lastEnd !== null) {
            await config.db.put([ 
                interface.db.scanPoint,
            ], protocol.addons.ScanPoint(lastEnd));
        }
    } catch (batchWriteError) {
        // This is a catastrophic write error.
        // We will dump the dels and puts so we can force recover from this event.
        // Then we would add in the block header after.
        config.console.error(`catastrophic batch write error during balance recons.`);
        config.console.error(batchWriteError);

        // if File system is available, write a dump for recovery.
        // This is used for recovery in a write error situation.
        if (config.write) {
            await config.write(
                './balance-rec-write-dump.json',
                JSON.stringify(dbEntries),
            );
            await config.write(
                './balance-rec-scanpoint-dump.json',
                JSON.stringify(protocol.addons.ScanPoint(lastEnd).object()),
            );
            config.console.error(`dump successfully created`);
        }

        // Throw an error now.
        throw new utils.ByPassError(batchWriteError);
    }

    // clear the cache / simulation db
    await db.clear();
}

module.exports = reconcileMempoolBalance;