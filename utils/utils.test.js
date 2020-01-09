const {
  abi,
  big,
  BN,
  emptyAddress,
  emptyBytes32,
  RLP,
  eq,
} = require('./utils');
const { utils } = require('ethers');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const a = RLP.encode("0x01");

  t.equal(a, '0x01', 'rlp encode');

  const b = big(1);

  t.equal(1, b.toNumber(), 'big numberify');

  const c = emptyAddress;

  t.equal(20, utils.hexDataLength(c), 'empty address');

  t.equal(eq('0xeded1d92a41ce3c6775e3f4baf17036288044eb6',
    '0xeDed1D92A41cE3C6775e3F4bAF17036288044Eb6'), true, 'eq check');
});
