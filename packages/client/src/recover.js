const utils = require('@fuel-js/utils');

/// @dev this will allow a database recovery from dump.
async function recover(dumpLocation = '', config = {}) {
    // Get the entries from the simulated DB.
    let dbEntries = JSON.parse(await config.read(
        dumpLocation,
    ));

    config.console.log(`Recovering ${dbEntries.length} entires`);

    // 20k per batch, safley 256 per payload for now, ~1.3 minutes per 100k writes
    const batchSize = 20000;
    const payloadSize = 256;
    const numberOfRetries = 10;

    // Make entries in db.
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
            config.console.log(`Error while processing, waiting.. ${error.message}`);

            // wait 10 seconds for potentially more connections
            await utils.wait(10000);
        }
    }

    config.console.log(`Restored successfully: ${dbEntries.length} entries.`);
}

// Export dump.
module.exports = recover;