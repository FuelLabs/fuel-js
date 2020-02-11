
// Tokens
const addresses = {
  "ropsten": {
    "fuel": "0x1138E213210e48AE15615f817f2B8D43AC5AB199",
    "ether": "0x0000000000000000000000000000000000000000",
    "fakeDai": "0x399495Ae981C67822506b459658247dc55EE6d9a"
  },
  "goerli": {
    "fuel": "0x11f449629fCB4F9A6d2e9a25dA596941CD5f109F",
    "fakeDai": "0xc5a50D0a4B907299eB769258d753b05429Db6b9c",
    "ether": "0x0000000000000000000000000000000000000000"
  }
};

// Faucet
const faucet = {
  "ropsten": {
    "key": "0x051429c7d5a0205b345a1893aef3c4ed0e6de4e2de7fb73daea21e551456f9e7c9",
    "value": "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394399495ae981c67822506b459658247dc55ee6d9a836d9af2019102f050fe938943acc45f65568000000000",
    "depositHashID": "0x1429c7d5a0205b345a1893aef3c4ed0e6de4e2de7fb73daea21e551456f9e7c9",
    "ethereumBlockNumber": "0x6d9af2",
    "token": "0x399495ae981c67822506b459658247dc55ee6d9a",
    "account": "0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3"
  },
  "goerli": {
    "key": "0x05326220464d6712e8c062db549c37db9b43cc9f3d8d70e404300cb3ed17a91155",
    "value": "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394c5a50d0a4b907299eb769258d753b05429db6b9c8320fa7e019102f050fe938943acc45f65568000000000",
    "depositHashID": "0x326220464d6712e8c062db549c37db9b43cc9f3d8d70e404300cb3ed17a91155",
    "ethereumBlockNumber": "0x20fa7e",
    "token": "0xc5a50d0a4b907299eb769258d753b05429db6b9c",
    "account": "0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3"
  }
};

// Networks
const networks = {
  '3': 'ropsten',
  '5': 'goerli',
  '10': 'local',
};

// Ids
const ids = {
  "ropsten": {
    "0x0000000000000000000000000000000000000000": "0",
    "0x399495ae981c67822506b459658247dc55ee6d9a": "1"
  },
  "goerli": {
    "0x0000000000000000000000000000000000000000": "0",
    "0xc5a50d0a4b907299eb769258d753b05429db6b9c": "1"
  }
};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
