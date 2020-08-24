const { test, BN, accounts } = require('@fuel-js/environment');
const utils = require('@fuel-js/utils');
const { struct, decompose, chunk, pack, combine, chunkJoin } = require('../index');

module.exports = test('struct', async t => {
  const A = struct('uint8 nick');
  const a = new A({ nick: 1 });

  t.equalHex(a.encodePacked(), '0x01', 'uint8');

  const R = struct(`uint8 nick, bytes32 john, bytes1[], address`);
  const r = new R({
    nick: 90,
    john: utils.hexZeroPad('0xaaaa', 32),
    _2: ['0xaa', '0xbb'],
    _3: utils.hexZeroPad('0xbb', 20),
  });

  t.equalBig(r.sizePacked(), 1 + 32 + 2 + 2 + 20, 'size packed');

  const r2 = new R({}); // test empty defaults
  t.equalBig(r2.properties.nick().get(), 0, 'property check empty');
  t.equalHex(r2.properties.john().get(), utils.hexZeroPad('0x0', 32), 'property check empty');
  t.equalBig(r2.properties._2().get(), [], 'property check empty');
  t.equalBig(r2.properties._3().get(), utils.hexZeroPad('0x0', 20), 'property check empty');

  // special encode of object
  const r3 = new R({
    nick: 1,
    _2: r.encodePackedBytes(),
  });

  t.equalHex(r3.encodePackedBytes()[0], '0x01', 'check bytes arr');

  t.equal(r.encode(), '0x000000000000000000000000000000000000000000000000000000000000005a000000000000000000000000000000000000000000000000000000000000aaaa000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000bb0000000000000000000000000000000000000000000000000000000000000002aa00000000000000000000000000000000000000000000000000000000000000bb00000000000000000000000000000000000000000000000000000000000000', 'encoding');
  t.equal(r.encodePacked(), '0x5a000000000000000000000000000000000000000000000000000000000000aaaa0002aabb00000000000000000000000000000000000000bb', 'packed encoding');

  const rD = r.decode('0x000000000000000000000000000000000000000000000000000000000000005a000000000000000000000000000000000000000000000000000000000000aaaa000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000bb0000000000000000000000000000000000000000000000000000000000000002aa00000000000000000000000000000000000000000000000000000000000000bb00000000000000000000000000000000000000000000000000000000000000');

  t.equalBig(r.properties.nick().get(), 90, 'property check');
  r.properties.nick().set(85);
  t.equalBig(r.properties.nick().get(), 85, 'property check');

  t.equalHex(rD.values()[0], utils.bigNumberify(90), 'abi decoding');
  t.equalHex(rD.values()[1], utils.hexZeroPad('0xaaaa', 32), 'abi decoding');
  t.equalHex(rD.values()[3], utils.hexZeroPad('0xbb', 20), 'abi decoding');

  const rRLP = r.decodeRLP(r.encodeRLP());

  t.equalHex(rRLP.values()[0], utils.bigNumberify(85), 'rlp decoding');
  t.equalHex(rRLP.values()[1], utils.hexZeroPad('0xaaaa', 32), 'rlp decoding');
  t.equal(rRLP.values()[2], ['0xaa', '0xbb'], 'rlp decoding');
  t.equalHex(rRLP.values()[3], utils.hexZeroPad('0xbb', 20), 'rlp decoding');

  t.equalHex(rRLP.keccak256(), r.keccak256(), 'hash check');
  t.equalHex(rRLP.keccak256Solidity(), r.keccak256Solidity(), 'hash check');
  t.equalHex(rRLP.keccak256Packed(), utils.keccak256(r.encodePacked()), 'hash check');

  const Kevin = struct('uint8 nick, bytes32 john, bytes1[*], address');

  const time = [utils.timestamp(), utils.timestamp()];
  const bla = Kevin({
    nick: '0xcc',
    john: rRLP.keccak256Packed(),
    _2: '0xeebb',
    _3: accounts[0].address,
  }, time);

  const bla2 = Kevin({
    nick: '0xcc',
    john: rRLP.keccak256Packed(),
    _2: '0xeebb',
    _3: accounts[0].address,
  }, bla);

  t.equalBig(bla.properties._2().get()[0], '0xee', 'chunk');
  t.equalBig(bla.properties._2().get()[1], '0xbb', 'chunk');
  t.equalBig(bla.getAddon()[0], time[0], 'check addon array');
  t.equalBig((Kevin.decodeRLP(bla.encodeRLP())).getAddon()[0], time[0], 'check addon array');
  t.equalBig(Kevin.decodeRLP(bla2.encodeRLP(), Kevin).getAddon().keccak256Packed(),
    bla.keccak256Packed(), 'successful getAddon decode');

  const Unsigned = struct(
    `bytes1[**] inputs,
    bytes1[**] outputs,
    bytes32[*] data,
    uint256 signatureFeeToken,
    uint256 signatureFee`,
  );

  const _Transaction = struct(`
    uint16 length,
    bytes8[*] metadata,
    bytes1[**] witnesses,
    bytes1[**] inputs,
    bytes1[**] outputs
  `);

  const unsigned = Unsigned({
    inputs: ['0xaa', '0xbb'],
    outputs: '0xaabb',
    data: [utils.emptyBytes32],
  });

  const tx = _Transaction({
    metadata: [utils.randomBytes(8), utils.randomBytes(8)],
    inputs: '0xaabb',
    outputs: '0xaabb',
    witnesses: utils.randomBytes(70),
  });

  t.equal(utils.hexDataLength(unsigned.encodePacked()), unsigned.sizePacked(), 'size packed');
  t.equal(utils.hexDataLength(tx.encodePacked()), tx.sizePacked(), 'size packed');

  const RootHeader = struct(`
    uint64 timestamp,
    uint32 rightmostIndex,
    uint32 blockHeight,
    uint32 blockNumber,
    uint8 rootIndex,
    bytes32 transactionHash,
    bytes1[] chunks
  `);

  t.equal(typeof RootHeader({}).encodePacked(), 'string', 'encode');

  const emptyRootHeadr = RootHeader({
    chunks: ['0xaa', '0xbb']
  });

  t.equal(emptyRootHeadr.properties.timestamp().keccak256(),
    utils.keccak256(emptyRootHeadr.properties.timestamp().hex()), 'keccak256');

  t.equal(emptyRootHeadr.properties.timestamp().solidityKeccak256(),
    utils.solidityKeccak256(['uint64'], [emptyRootHeadr.properties.timestamp().hex()]), 'solidityKeccak256');

  t.equal(emptyRootHeadr.properties.chunks().hex(), '0xaabb', 'chunk join hex');

  t.equal(emptyRootHeadr.properties.chunks().index(), 6, 'index');

  t.equal(emptyRootHeadr.object().rootIndex, 0, 'object check');

  emptyRootHeadr.setAddon(); // empty
  emptyRootHeadr.setAddon(tx);

  const addonTest = _Transaction(emptyRootHeadr.getAddon());

  t.equal(addonTest.properties.outputs().hex(), '0xaabb', 'struct addon');

  t.equal(emptyRootHeadr.types()[5], 'bytes32', 'types');

  const packedEmptyDecoded = emptyRootHeadr.decodePacked(emptyRootHeadr.encodePacked());

  t.equal(packedEmptyDecoded.properties.chunks().hex(), '0xaabb', 'chunk join hex');

  t.equal(packedEmptyDecoded.packedDataLength(),
    utils.hexDataLength(emptyRootHeadr.encodePacked()), 'packed data length');

  const subArrayStruct = struct(`uint8 val`);

  t.equal(subArrayStruct.decode(utils.hexZeroPad('0xbb', 32)).properties.val().hex(), '0xbb', 'decode');

  const rootBySubStruct = RootHeader({
    chunks: new subArrayStruct({ val: '0xaa' }),
  });

  t.ok(rootBySubStruct.values(), 'values with sub struct');

  t.ok(decompose([{ _hex: '0xaa' }], true), 'values with sub struct');
  t.ok(decompose([{ _hex: '0xaa' }], false), 'values with sub struct');
  t.ok(decompose(['0xaa'], true), 'values with sub struct');
  t.ok(decompose(['0xaa'], false), 'values with sub struct');

  t.equal(chunk('0xaabb'), ['0xaa', '0xbb'], 'hex chunks');

  t.ok(struct(), 'empty struct');
  t.throws(() => struct(`tuple(uint256)`), 'tuple throw struct');

  t.equal(pack(new subArrayStruct(), '0xbb'), ['0x00', '0xbb'], 'pack');
  t.equal(pack(new subArrayStruct({ val: '0xaa' }), '0xbb'), ['0xaa', '0xbb'], 'pack');
  t.equal(pack(), [], 'empty pack');
  t.equal(combine(), '0x', 'empty combine')
  t.equal(combine([ new subArrayStruct({ val: '0xaa' }), new subArrayStruct({ val: '0xbb' }) ]), '0xaabb', 'combine')

  t.ok(RootHeader(), 'empty struct defaults');

  // overflow checks
  const rootOverflow = RootHeader({
    timestamp: utils.emptyBytes32,
    rightmostIndex: '0xaabbccdd'
  });
});
