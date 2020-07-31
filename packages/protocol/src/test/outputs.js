const { test, utils, BN, accounts } = require('@fuel-js/environment');
const outputs = require('../outputs');
const { combine } = require('@fuel-js/struct');

module.exports = test('outputs', async t => {

  const invalid = '0x';

  t.throw(() => outputs.decodePacked(invalid), 'inputs-output-underflow');
  t.throw(() => outputs.decodePacked('0xaa'), 'invalid-output-type');
  t.throw(() => outputs.decodePacked('0x00'), "inputs-output-mismatch");

  const valid = outputs.OutputTransfer({
    token: '0x00',
    amount: 50000,
    owner: t.wallets[0].address,
  });

  const encoded = combine([valid, valid, valid]);
  const decoded = outputs.decodePacked(encoded);

  t.equalHex(decoded[0].properties.owner().hex(), t.wallets[0].address, 'owner');
  t.equalHex(decoded[1].properties.owner().hex(), t.wallets[0].address, 'owner');
  t.equalHex(decoded[2].properties.owner().hex(), t.wallets[0].address, 'owner');

  const overflow = combine(new Array(outputs.OUTPUTS_MAX + 1).fill(valid));
  t.throw(() => outputs.decodePacked(overflow), 'inputs-output-overflow');

  const validMax = combine(new Array(outputs.OUTPUTS_MAX).fill(valid));
  t.equal(outputs.decodePacked(validMax).length, 8, 'max');

  const different = [
    outputs.OutputTransfer({
      token: '0x00',
      amount: 50000,
      owner: t.wallets[0].address,
    }),
    outputs.OutputWithdraw({
      token: '0x00',
      amount: 102,
      owner: '0x00',
    }),
    outputs.OutputHTLC({
      token: '0x00',
      amount: 3001,
      owner: t.wallets[0].address,
      digest: utils.emptyBytes32,
      expiry: 48,
    }),
    outputs.OutputReturn({
      data: ['0xaa'],
    }),
  ];
  const differendEncoded = combine(different);

  console.time('decode');
  const differentDecoded = outputs.decodePacked(differendEncoded);
  console.timeEnd('decode');

  t.equal(differentDecoded.length, 4, 'len');
  t.equalHex(differentDecoded[2].properties.digest().hex(), utils.emptyBytes32, 'digest');
  t.equalBig(differentDecoded[2].properties.expiry().hex(), 48, 'expiry');
  t.equalBig(differentDecoded[2].properties.amount().hex(), 3001, 'amount');
  t.equalBig(differentDecoded[1].properties.amount().hex(), 102, 'amount');
  const ids = outputs.decodeOwnerIds(different);
});
