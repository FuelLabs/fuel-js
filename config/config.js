
// Tokens
const addresses = {
  ropsten: {
    fuel: "0xB01cbfd7AEDdAE55E7a56E153Ff5f8FD991f6AFB",
    ether: '0x0000000000000000000000000000000000000000',
    fakeDai: "0xa68bb214c94cb15Eae1E5c7F7b9E1074057824D9",
  },
};

// Faucet
const faucet = {
  ropsten: {
    key: "0x0543f7d8770031adcff53b475123c3830a3ccc6333d808173aa5b5da703069a5fa",
    value: "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394a68bb214c94cb15eae1e5c7f7b9e1074057824d9836cbe92019102f050fe938943acc45f65568000000000",
    depositHashID: "0x43f7d8770031adcff53b475123c3830a3ccc6333d808173aa5b5da703069a5fa",
    ethereumBlockNumber: "0x6cbe92",
    token: "0xa68bb214c94cb15eae1e5c7f7b9e1074057824d9",
    account: "0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3",
  },
};

// Networks
const networks = {
  '3': 'ropsten',
  '10': 'local',
};

// Ids
const ids = {
  ropsten: {
    '0x0000000000000000000000000000000000000000': '0',
    "0xa68bb214c94cb15eae1e5c7f7b9e1074057824d9": '1',
  },
};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
