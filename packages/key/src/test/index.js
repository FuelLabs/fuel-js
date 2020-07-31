const { test, utils } = require('@fuel-js/environment');
const Key = require('../index');

module.exports = test('key', async t => {

  const key = Key(1, 'uint8 type', 'uint32 num');
  const encoded = key.encode(['0x33', 22]);

  t.equalBig(encoded[0], '0x01');
  t.equalBig(encoded[1], '0x33');
  t.equalHex(encoded[2], '0x00000016');

  const key2 = Key(4, 'uint8 type', 'bytes32 num');
  const encoded2 = key2.encode(['0x33', utils.bigNumberify(22)]);

  t.equalBig(encoded2[0], '0x04');
  t.equalBig(encoded2[1], '0x33');
  t.equalHex(encoded2[2], '0x0000000000000000000000000000000000000000000000000000000000000016');

  const key3 = Key(4, 'uint8 type');
  t.throws(() => key3.encode(['0x3333']), 'key-length-overflow');
});
