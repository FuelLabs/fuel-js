const structs = require('./structs');
const _utils = require('../utils/utils');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  const proof = new structs.FillProof('0xaa');

  t.equal(proof.encoded, '0xaa', 'fill proof');

  const emptyLogger = new structs.EmptyLogger();

  t.equal(typeof emptyLogger.log, 'function', 'empty logger');

  const header = new structs.BlockHeader({
    producer: _utils.emptyAddress, // - blockProducer [32 bytes] -- padded address
    previousBlockHash: _utils.emptyBytes32, // - previousBlockHash [32 bytes]
    blockHeight: _utils.big(0), //- blockHeight [32 bytes]
    ethereumBlockNumber: _utils.big(0), // - ethereumBlockNumber [32 bytes]
    transactionRoots: [], // - transactionRoots [64 + dynamic bytes]
  });

  t.equal(header.producer, _utils.emptyAddress, 'block header');
  t.equal(header.previousBlockHash, _utils.emptyBytes32, 'block header');
  t.equal(header.blockHeight, _utils.big(0), 'block header');
  t.equal(header.height, _utils.big(0), 'block header');
  t.equal(header.ethereumBlockNumber, _utils.big(0), 'block header');
  t.equal(header.transactionRoots.length, 0, 'block header');
  t.equal(header.hash, '0x15a2b65ec4d06457127a810118521be7542b5fd912e1c8da1558436bd0c17ce4', 'hash');
});
