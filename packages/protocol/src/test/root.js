const { test, utils, BN, accounts } = require('@fuel-js/environment');
const root = require('../root');
const transaction = require('../transaction');

module.exports = test('root', async t => {

  t.throw(() => root.decodePacked('0x'), "transaction-index-underflow");
  t.throw(() => root.decodePacked('0x002a'), "transaction-length-underflow");
  t.throw(() => root.decodePacked('0x0044'), 'hex-data-overflow');

  const normal = root.Leaf({ data: utils.randomBytes(400) });

  t.equalHex(normal.encodePacked(), root.decodePacked(normal.encodePacked())[0], 'single');

  const packed = root.encodePacked([normal, normal, normal]);
  const decoded = root.decodePacked(packed);

  t.equalHex(decoded[0], normal.encodePacked(), 'check');
  t.equalHex(decoded[1], normal.encodePacked(), 'check');
  t.equalHex(decoded[2], normal.encodePacked(), 'check');
  t.equalBig(decoded.length, 3, 'length');

  const valid = root.Leaf({ data: utils.randomBytes(160) });
  const validPacked = root.encodePacked((new Array(root.MaxTransactionsInRoot - 1)).fill(valid));
  const decodeValidPacked = root.decodePacked(validPacked);

  const overflowPacked = root.encodePacked((new Array(root.MaxTransactionsInRoot)).fill(valid));

  t.throw(() => root.decodePacked(overflowPacked), 'transaction-index-overflow');
});
