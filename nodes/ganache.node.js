const ganache = require("ganache-core");
const { providerConfig } = require('../tests/test.environment.js');
const env = require('../config/process');

const server = ganache.server(providerConfig);

server.listen(env.port || 3000, function(err) {
  if (err) { console.error(err); }
});
