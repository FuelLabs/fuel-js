// Core
const { test } = require('zora');
const {
  big, extendTest
} = require('./test.environment');
const { utils } = require('ethers');
const structs = require('../structs/structs');
const BN = require('bn.js');
const bn = v => new BN(big(v).toHexString().slice(2), 16);

const eq = (v1, v2) => big(v1).eq(big(v2));
const lt = (v1, v2) => big(v1).lt(big(v2));
const gt = (v1, v2) => big(v1).gt(big(v2));
const mod = (v1, v2) => big(v1).mod(big(v2));
const add = (v1, v2) => big(v1).add(big(v2));
const shr = (v1, v2) => big('0x' + bn(v2).shrn(bn(v1).toNumber()).toString(16));
const shl = (v1, v2) => big('0x' + bn(v2).shln(bn(v1).toNumber()).iand(Number.MAX_SAFE_INTEGER)); // big(bn(v1).shln(bn(v2)));
const and = (v1, v2) => big('0x' + bn(v1).and(bn(v2)).toString(16));
const or = (v1, v2) => big('0x' + bn(v1).or(bn(v2)).toString(16));
const div = (v1, v2) => big(v1).div(big(v2));
const mul = (v1, v2) => big(v1).mul(big(v2));
const sub = (v1, v2) => big(v1).sub(big(v2));
const smod = (v1, v2) => big(v1).mod(big(v2));

function testMerkleization(leafCount, transactionIndex, testSuite) {
  const transactionLeafs = (new Array(leafCount)).fill(0).map((v, i) =>
    new structs.FillProof('0x01' + String(i)),
  );
  const merkleRoot = structs.constructMerkleTreeRoot(transactionLeafs);
  const merkleProof = new structs.TransactionMerkleProof({
    transactionLeafs,
    transactionIndex,
  });
  let computedHash = merkleProof.oppositeLeafHash;

  // Iterate Through Merkle Proof Depths
  // https://crypto.stackexchange.com/questions/31871/what-is-the-canonical-way-of-creating-merkle-tree-branches
  for (let depth = big(0); lt(depth, merkleProof.proof.length); depth = add(depth, 1)) {
      // get the leaf hash
      let proofLeafHash = merkleProof.proof[depth];

      // Determine Proof Direction the merkle brand left:  tx index % 2 == 0
      switch (eq(smod(transactionIndex, 2), 0)) {

        // Direction is right branch
        case true:
            computedHash = utils.keccak256(computedHash + proofLeafHash.slice(2))
            break;

        // Direction is left branch
        case false:
            computedHash = utils.keccak256(proofLeafHash + computedHash.slice(2));
            break;

        default:
          throw new Error('Invalid index case'); // Direction is Invalid, Ensure no other cases!
      }

      // Shift transaction index right by 1
      transactionIndex = shr(1, transactionIndex);
  }

  testSuite.eq(computedHash, merkleRoot, 'Merkle root is correct');
}

// Test verify block header
test('merklization checks', async t => {
  try {
  // Extended Test Methods
    const testSuite = extendTest(t);

    testMerkleization(1, 0, testSuite);
    testMerkleization(2, 0, testSuite);
    testMerkleization(3, 0, testSuite);
    testMerkleization(4, 0, testSuite);

    testMerkleization(1, 1, testSuite);
    testMerkleization(2, 1, testSuite);
    testMerkleization(3, 1, testSuite);
    testMerkleization(4, 1, testSuite);

    testMerkleization(2, 1, testSuite);
    testMerkleization(3, 2, testSuite);
    testMerkleization(4, 2, testSuite);

    testMerkleization(3, 3, testSuite);
    testMerkleization(4, 3, testSuite);

    testMerkleization(10, 3, testSuite);
    testMerkleization(10, 9, testSuite);

    testMerkleization(20, 3, testSuite);
    testMerkleization(20, 9, testSuite);

    testMerkleization(255, 254, testSuite);
    testMerkleization(255, 254, testSuite);

  } catch (error) {
    console.error(error);
  }
});
