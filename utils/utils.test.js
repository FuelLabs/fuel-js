const {
  abi,
  big,
  BN,
  emptyAddress,
  emptyBytes32,
  RLP,
  eq,
  ipToHex,
  hexToIP,
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

  t.equal(ipToHex('234.23.12.331'), '0xc781ea170c82014b', 'ip tes');

  t.equal(ipToHex('00.00.00.00'), '0xc400000000', 'ip tes');

  t.equal(hexToIP('0xc400000000'), '0.0.0.0', 'ip reverse');

  t.equal(hexToIP('0xc781ea170c82014b'), '234.23.12.331', 'ip reverse');

  t.equal(eq('0xeded1d92a41ce3c6775e3f4baf17036288044eb6',
    '0xeDed1D92A41cE3C6775e3F4bAF17036288044Eb6'), true, 'eq check');
});
