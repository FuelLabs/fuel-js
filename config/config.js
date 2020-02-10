
// Tokens
const addresses = {
  ropsten: {
    fuel: "0x1138E213210e48AE15615f817f2B8D43AC5AB199",
    ether: '0x0000000000000000000000000000000000000000',
    fakeDai: "0x399495Ae981C67822506b459658247dc55EE6d9a",
  },
};

// Faucet
const faucet = {
  ropsten: {
    key: "0x051429c7d5a0205b345a1893aef3c4ed0e6de4e2de7fb73daea21e551456f9e7c9",
    value: "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394399495ae981c67822506b459658247dc55ee6d9a836d9af2019102f050fe938943acc45f65568000000000",
    depositHashID: "0x1429c7d5a0205b345a1893aef3c4ed0e6de4e2de7fb73daea21e551456f9e7c9",
    ethereumBlockNumber: "0x6d9af2",
    token: "0x399495ae981c67822506b459658247dc55ee6d9a",
    account: "0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3",
  },
};

// Networks
const networks = {
  '3': 'ropsten',
  '5': 'goerli',
  '10': 'local',
};

// Ids
const ids = {
  ropsten: {
    '0x0000000000000000000000000000000000000000': '0',
    "0x399495ae981c67822506b459658247dc55ee6d9a": '1',
  },
};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
