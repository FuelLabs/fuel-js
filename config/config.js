
// Tokens
const addresses = {
  ropsten: {
    fuel: "0x59bD11F8a5a833f26723D044CbB501a40C9C5E43",
    ether: '0x0000000000000000000000000000000000000000',
    fakeDai: "0xCF852d1295fD158D43D58ceD47F88f4f4ab0931C",
  },
};

// Faucet
const faucet = {
  ropsten: {
    key: "0x0548504dc36e13b88d358fc7cc4f1f9332505c008ca66a75f3bde8a224128d4d8a",
    value: "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394cf852d1295fd158d43d58ced47f88f4f4ab0931c836c3396019102f050fe938943acc45f65568000000000",
    depositHashID: "0x48504dc36e13b88d358fc7cc4f1f9332505c008ca66a75f3bde8a224128d4d8a",
    ethereumBlockNumber: "0x6c3396",
    token: "0xcf852d1295fd158d43d58ced47f88f4f4ab0931c",
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
    "0xcf852d1295fd158d43d58ced47f88f4f4ab0931c": '1',
  },
};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
