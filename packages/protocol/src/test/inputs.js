const { test, utils, BN, accounts } = require('@fuel-js/environment');
const inputs = require('../inputs');

module.exports = test('inputs', async t => {
  try {
  const data = '0x000100040101c5d2460186f7233c927e7db2dcc703c0e500b600';
  const decoded = inputs.decodePacked(data);

  t.equalBig(decoded[0].object().type, 0, 'type');
  t.equalBig(decoded[0].object().witnessReference, 1, 'witnessReference');
  t.equalBig(decoded[1].object().type, 0, 'type');
  t.equalBig(decoded[1].object().witnessReference, 4, 'witnessReference');
  t.equalBig(decoded[2].object().type, 1, 'type');
  t.equalBig(decoded[2].object().witnessReference, 1, 'witnessReferece');
  t.equalHex(decoded[2].object().owner, '0xc5d2460186f7233c927e7db2dcc703c0e500b600', 'owner');

  const invalidType = '0x0400';
  t.throws(() => inputs.decodePacked(invalidType), 'invalid type');

  const invalidSize = '0x00';
  t.throws(() => inputs.decodePacked(invalidSize), 'invalid size');

  const lengthUnderflow = '0x';
  t.throws(() => inputs.decodePacked(lengthUnderflow), 'length underflow');

  const lengthOverflow = '0x000100010001000100010001000100010001';
  t.throws(() => inputs.decodePacked(lengthOverflow), 'length overflow');

  } catch (err) {
    console.error(err);
  }
});
