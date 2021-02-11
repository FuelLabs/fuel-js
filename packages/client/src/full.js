// This will run a full simulation node locally (w/ faucet, local chain and environment)
const app = require('./app');
const faucetPlugin = require('./faucetPlugin');

// Start the main app loop.
app({
    plugin: faucetPlugin,
})
.then(console.log)
.catch(console.error);