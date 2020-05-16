
// Tokens
const addresses = {
  "ropsten": {
    "fuel": "0x2FA75F4a4F86b84E9568B4bf20a6B5466d5Bd9c1",
    "fakeDai": "0x3945df0b0776FA4cc42F2dD19aa4bf4DEe5b493b",
    "ether": "0x0000000000000000000000000000000000000000"
  },
  "goerli": {
    "fuel": "0xFF1423B45cDF407c5B90e4391685cf48c223bE13",
    "fakeDai": "0x353296f3D5cB1447A0971FF5cd795feaeD52e8FD",
    "ether": "0x0000000000000000000000000000000000000000"
  },
  "rinkeby": {
    "fuel": "0xC3Bb6E0183808110ff3c1848053a660eDcb995b3",
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
    "key": "0x05737124f507526c1a0500e4ff0fe1a2439214722960f77808c9a89ed859c7e60c",
    "value": "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394353296f3d5cb1447a0971ff5cd795feaed52e8fd83294f54019102f050fe938943acc45f65568000000000",
    "depositHashID": "0x737124f507526c1a0500e4ff0fe1a2439214722960f77808c9a89ed859c7e60c",
    "ethereumBlockNumber": "0x294f54",
    "token": "0x353296f3d5cb1447a0971ff5cd795feaed52e8fd",
    "account": "0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3"
  },
  "rinkeby": {
    "key": "0x051ebc9182c0d867a6f2b62965b2794e9c5af91755a7a838d7763e31242ce15800",
    "value": "0xf8419499b722ccd2d6baf0325bf9524bc2e5d3411330b394c5a50d0a4b907299eb769258d753b05429db6b9c83632af7019102f050fe938943acc45f65568000000000",
    "depositHashID": "0x1ebc9182c0d867a6f2b62965b2794e9c5af91755a7a838d7763e31242ce15800",
    "ethereumBlockNumber": "0x632af7",
    "token": "0xc5a50d0a4b907299eb769258d753b05429db6b9c",
    "account": "0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3"
  }
};

// Networks
const networks = {
  '3': 'ropsten',
  '5': 'goerli',
  '4': 'rinkeby',
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
    "0x353296f3d5cb1447a0971ff5cd795feaed52e8fd": "1"
  },
  "rinkeby": {
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
