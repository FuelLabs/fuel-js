
// Tokens
const addresses = {
  "ropsten": {
    "fuel": "0x2FA75F4a4F86b84E9568B4bf20a6B5466d5Bd9c1",
    "fakeDai": "0x3945df0b0776FA4cc42F2dD19aa4bf4DEe5b493b",
    "ether": "0x0000000000000000000000000000000000000000"
  },
  "goerli": {
    "fuel": "0x4E49185B26E93c94f243E0C64eEfE33Aa980e42c",
    "fakeDai": "0xCF852d1295fD158D43D58ceD47F88f4f4ab0931C",
    "ether": "0x0000000000000000000000000000000000000000"
  }
};

// Faucet
const faucet = {
  "ropsten": {
    "key": "0x05aa1908545e5bfd163641f91f9d307cd41fab5c723fe26bf261a91bc65b32af20",
    "value": "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b3943945df0b0776fa4cc42f2dd19aa4bf4dee5b493b836f9c46019102f050fe938943acc45f65568000000000",
    "depositHashID": "0xaa1908545e5bfd163641f91f9d307cd41fab5c723fe26bf261a91bc65b32af20",
    "ethereumBlockNumber": "0x6f9c46",
    "token": "0x3945df0b0776fa4cc42f2dd19aa4bf4dee5b493b",
    "account": "0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3"
  },
  "goerli": {
    "key": "0x05634d3bfa50daa372c9d19d5df81f38e566dcaf6b3dccd076c8d9e4aadec53ad8",
    "value": "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394cf852d1295fd158d43d58ced47f88f4f4ab0931c83213d8e019102f050fe938943acc45f65568000000000",
    "depositHashID": "0x634d3bfa50daa372c9d19d5df81f38e566dcaf6b3dccd076c8d9e4aadec53ad8",
    "ethereumBlockNumber": "0x213d8e",
    "token": "0xcf852d1295fd158d43d58ced47f88f4f4ab0931c",
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
    "0x3945df0b0776fa4cc42f2dd19aa4bf4dee5b493b": "1"
  },
  "goerli": {
    "0x0000000000000000000000000000000000000000": "0",
    "0xcf852d1295fd158d43d58ced47f88f4f4ab0931c": "1"
  }
};

module.exports = {
  addresses,
  networks,
  faucet,
  ids,
};
