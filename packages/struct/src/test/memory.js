const utils = require('@fuel-js/utils');
const struct1 = require('../index');

const SomeStruct1 = struct1.struct(`
  bytes32 nick1,
  bytes32 nick2,
  bytes32 nick3,
  bytes32 nick4,
  bytes32 nick5,
  bytes32 nick6,
  uint8 cool7
`);

utils.logMemory();

let arr = [];
for (var i = 0; i < 1000000; i++) {
  arr.push(new SomeStruct1({
    nick1: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    nick2: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    nick3: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    nick4: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    nick5: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    nick6: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    cool7: 1,
  }));
}

utils.logMemory();
