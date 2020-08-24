const { test, utils } = require('@fuel-js/environment');
const schema = require('@fuel-js/interface');
const { struct } = require('@fuel-js/struct');
const encoding = require('../index');

module.exports = test('encoding', async t => {

  t.ok(encoding, 'available');
  t.throws(() => encoding.keyEncoding.encode(), 'empty');
  t.throws(() => encoding.keyEncoding.decode(), 'empty');
  t.throws(() => encoding.valueEncoding.encode(), 'empty');
  t.throws(() => encoding.valueEncoding.decode(), 'empty');

  t.equal(encoding.keyEncoding.encode(0, { bypassEncoding: true }), 0, 'bypass encode');
  t.equal(encoding.keyEncoding.encode(['0xaa']),
    Buffer.from(utils.RLP.encode(['0xaa']).slice(2), 'hex'), 'array hex');

  const complexKey = [schema.db.balance, utils.emptyAddress, '0x01' ];
  const complexKeyRLP = utils.RLP.encode(schema.db.balance.encode(complexKey.slice(1)));
  t.equal(encoding.keyEncoding.encode(complexKey),
    Buffer.from(complexKeyRLP.slice(2), 'hex'), 'array hex');

  t.equal(encoding.keyEncoding.decode(Buffer.from('aa', 'hex')), '0xaa', 'decode');

  t.equal(encoding.valueEncoding.encode(0, { bypassEncoding: true }),
    0, 'bypass decode');
  const TestStruct = struct(`uint256 value`);
  const testStruct = new TestStruct({ value: 0 });
  t.equal(encoding.valueEncoding.encode(testStruct),
    Buffer.from(testStruct.encodeRLP().slice(2), 'hex'), 'bypass decode');
  t.equal(encoding.valueEncoding.encode('0xaa'),
    Buffer.from(utils.RLP.encode('0xaa').slice(2), 'hex'), 'bypass decode');
  t.equal(encoding.valueEncoding.decode(Buffer.from(utils.RLP.encode('0xaa').slice(2), 'hex')),
    '0xaa', 'bypass decode');

});
