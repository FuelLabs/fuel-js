// This will run a full simulation node locally (w/ faucet, local chain and environment)x
const faucet = require('./faucet');
const logic = require('@fuel-js/logic');

// The faucet plugin, that will run once sync has completed.
async function faucetPlugin(state = {}, config = {}) {
    // Log the process.
    config.console.log(`Faucet sequence plugin running...`);

    // Transact.
    const transact = (unsigned = '0x', witnesses = '0x') => {
        return logic.transact(
            unsigned,
            witnesses,
            0,
            config,
        );
    };

    // So here we run the faucet as a sync plugin.
    try {
        // Start the fauceting sequence.
        await faucet({
            ...config,
            transact,
            faucet_no_cycle: true,
            wallet_path: 'http://localhost:' + config.port, // so the wallet will ping the local db RPC endpoint
        });
    } catch (faucetError) {
        config.console.error('Faucet Error:');
        config.console.error(faucetError);
    }
}

module.exports = faucetPlugin;