const app = require('./app');

// Start the main app loop.
app()
.then(console.log)
.catch(console.error);