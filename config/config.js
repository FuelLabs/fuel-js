
// Tokens
const addresses = {
  ropsten: {
    fuel: "0x7b0c710e753993DB172b9E05808191CC322378cc",
    ether: '0x0000000000000000000000000000000000000000',
    fakeDai: "0x493AC959CB4bA60580640Be6B2d546c2bE21fA62",
  },
};

// Faucet
const faucet = {
  ropsten: {
    key: "0x059d3aa344265b75497618606fc476d009c90667e431d822d69d18e23a6109f586",
    value: "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394493ac959cb4ba60580640be6b2d546c2be21fa62836d307c019102f050fe938943acc45f65568000000000",
    depositHashID: "0x9d3aa344265b75497618606fc476d009c90667e431d822d69d18e23a6109f586",
    ethereumBlockNumber: "0x6d307c",
    token: "0x493ac959cb4ba60580640be6b2d546c2be21fa62",
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
    "0x493ac959cb4ba60580640be6b2d546c2be21fa62": '1',
  },
};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
