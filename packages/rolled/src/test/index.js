const { test, utils, BN } = require('@fuel-js/environment');
const { encode, decode, Coder } = require('../index');

module.exports = test('coder test', async t => {
  t.equalHex(encode(['bytes1'], ['0xaa']), '0xaa');
  t.equalHex(encode(['bytes32'], [utils.hexZeroPad('0xaa', 32)]), utils.hexZeroPad('0xaa', 32));

  t.equalHex(encode(['uint8'], [0]), '0x00');
  t.equalHex(encode(['uint8'], ['0xaa']), '0xaa');
  t.equalHex(encode(['uint256'], ['0xaa']), utils.hexZeroPad('0xaa', 32));

  t.equalHex(encode(['address'], ['0xaa']), utils.hexZeroPad('0xaa', 20));

  t.equalHex(encode(['bytes1[]'], [['0xaa']]), '0x0001aa');
  t.equalHex(encode(['bytes1[]'], [['0xaa', '0xbb']]), '0x0002aabb');
  t.equalHex(encode(['bytes1[]'], [['0xaa', '0xbb', '0xee']]), '0x0003aabbee');

  t.equalHex(encode(['bytes2[]'], [['0xaaaa']]), '0x0001aaaa');
  t.equalHex(encode(['bytes2[]'], [['0xaaaa', '0xbbbb']]), '0x0002aaaabbbb');
  t.equalHex(encode(['bytes2[]'], [['0xaaaa', '0xbbbb', '0xeeee']]), '0x0003aaaabbbbeeee');

  t.equalHex(encode(['tuple(uint8)'], [['0x11']]), '0x11');
  t.equalHex(encode(['tuple(uint8, bytes2)'], [['0x11', '0xeeee']]), '0x11eeee');
  t.equalHex(encode(['tuple(uint8, tuple(uint16))'], [['0x11', ['0xeeee']]]), '0x11eeee');

  t.equalHex(encode(['tuple(uint8[])'], [[['0x11']]]), '0x000111');
  t.equalHex(encode(['tuple(uint8[], bytes2)'], [[['0x11'], '0xeeee']]), '0x000111eeee');
  t.equalHex(encode(['tuple(uint8, tuple(uint16[]))'], [['0x11', [['0xeeee']]]]), '0x110001eeee');

  t.equalHex(encode(['bytes1[3]'], ['0xaabbcc']), '0xaabbcc');
  t.equalHex(encode(['bytes1[*]'], [['0xaa', '0xbb', '0xcc']]), '0x03aabbcc');
  t.equal(decode(['bytes1[*]'], '0x03aabbcc'), [['0xaa', '0xbb', '0xcc']]);
  t.equal(decode(['bytes1[***]'], '0x000003aabbcc'), [['0xaa', '0xbb', '0xcc']]);

  t.equal(decode(['uint8', 'bytes1[*]'], '0xaa05bbccddeeff'), ['0xaa', ['0xbb', '0xcc', '0xdd', '0xee', '0xff']], 'basix');

  t.equalHex(encode(['bytes1[*][***]'], [[['0xaa', '0xbb'], ['0xaa', '0xbb']]]), '0x02000002aabb000002aabb', 'complex');

  // t.throw(() => decode(['bytes1'], '0x'), 'decode-offset-mismatch');
  // t.throw(() => decode(['bytes1'], '0xaabb'), 'decode-offset-mismatch');
  // t.throw(() => decode(['uint8', 'bytes1[*]'], '0xaa05bbccddee'), 'decode-offset-mismatch');

  const coder = new Coder(['uint8', 'bytes1[*]']);
  t.equal(coder.decode('0xaa05bbccddeeff'), ['0xaa', ['0xbb', '0xcc', '0xdd', '0xee', '0xff']], 'coder basix');

  const coder2 = new Coder(['bytes1[*][***]']);
  t.equalHex(coder2.encode([[['0xaa', '0xbb'], ['0xaa', '0xbb']]]), '0x02000002aabb000002aabb', 'coder complex');

  t.equalHex(coder2.encode([[['0xaa', '0xbb'], ['0xaa', '0xbb']]]), '0x02000002aabb000002aabb', 'coder complex');

});
