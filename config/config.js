
// Tokens
const addresses = {
  ropsten: {
    fuel: "0x7B8AB9e901c386C3a14FA96d687A85231836Df1D",
    ether: '0x0000000000000000000000000000000000000000',
    fakeDai: "0x353296f3D5cB1447A0971FF5cd795feaeD52e8FD",
  },
};

// Faucet
const faucet = {
  ropsten: {
    key: "0x05e3d36d5bfb49c29319e319413cff34bcf2a8df6575ac405a79d2c049d3c7b1be",
    value: "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394353296f3d5cb1447a0971ff5cd795feaed52e8fd836c63a7019102f050fe938943acc45f65568000000000",
    depositHashID: "0xe3d36d5bfb49c29319e319413cff34bcf2a8df6575ac405a79d2c049d3c7b1be",
    ethereumBlockNumber: "0x6c63a7",
    token: "0x353296f3d5cb1447a0971ff5cd795feaed52e8fd",
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
    "0x353296f3d5cb1447a0971ff5cd795feaed52e8fd": '1',
  },
};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
