const ganache = require("ganache-core");
const { providerConfig } = require('../tests/test.environment.js');

const server = ganache.server(providerConfig);

server.listen(process.env.port || 3000, function(err) {
  if (err) { console.error(err); }
});
