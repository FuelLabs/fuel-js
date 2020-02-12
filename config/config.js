
// Tokens
const addresses = {
  "ropsten": {
    "fuel": "0x2FA75F4a4F86b84E9568B4bf20a6B5466d5Bd9c1",
    "fakeDai": "0x3945df0b0776FA4cc42F2dD19aa4bf4DEe5b493b",
    "ether": "0x0000000000000000000000000000000000000000"
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
    "key": "0x05aa1908545e5bfd163641f91f9d307cd41fab5c723fe26bf261a91bc65b32af20",
    "value": "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b3943945df0b0776fa4cc42f2dd19aa4bf4dee5b493b836f9c46019102f050fe938943acc45f65568000000000",
    "depositHashID": "0xaa1908545e5bfd163641f91f9d307cd41fab5c723fe26bf261a91bc65b32af20",
    "ethereumBlockNumber": "0x6f9c46",
    "token": "0x3945df0b0776fa4cc42f2dd19aa4bf4dee5b493b",
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
    "0x3945df0b0776fa4cc42f2dd19aa4bf4dee5b493b": "1"
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
