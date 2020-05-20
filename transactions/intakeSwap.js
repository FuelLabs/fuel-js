const { utils } = require('ethers');
const {
  abi,
  big,
  BN,
  emptyAddress,
  emptyBytes32,
  RLP,
  hexToInt,
  bytes,
  lt,
  lte,
  gt,
  gte,
  normalizeKey,
  wait,
} = require('../utils/utils');

const {
  FuelInputTypes,
  FuelOutputTypes,
  FuelProofTypes,
  TransactionLengthByteSize,
  FuelDBKeys,
} = require('../interfaces/interfaces');

const errors = require('../errors/errors');

const {
  TypeDB,
  TypeHex,
  TypeBoolean,
  TypeObject,
} = require('../types/types');

const {
  // Block / Root Headers
  BlockHeader,
  GenesisBlock,
  TransactionRootHeader,
  TransactionMerkleProof,

  // Inputs
  TransactionInputUTXO,
  TransactionInputHTLC,
  TransactionInputChange,
  TransactionInputDeposit,

  // Outputs
  TransactionOutputUTXO,
  TransactionOutputWithdrawal,
  TransactionOutputChange,
  TransactionOutputHTLC,

  // Transactional Structures
  TransactionUnsigned,
  TransactionMetadata,
  TransactionWitness,
  TransactionData,
  TransactionLength,
  TransactionLengthSpecifier,
  EmptyTransactionLeaf,
  RealEmptyTransactionLeaf,
  TransactionLeaf,

  // Utility
  reduceTokenID,
  encodeSignature,
  decodeSignature,
  constructWitness,
  ecrecoverPacked,
  serializeRLP,

  // UTXO Proofs
  UTXOProof,
  getUTXO,
  getDeposit,
  encodeProofs,
  TransactionProofLengths,
  TransactionProofs,

  decodeUTXORLP,
  decodeDepositRLP,

  // Utility Proofs
  FillProof,
} = require('../structs/structs');
const { intakeTransaction } = require('./intakeTransaction');

// Enforce hex structure
function hex(val, length, message = '') {
  const len = utils.hexDataLength(val);

  if (len <= length) {
    return val;
  } else {
    throw new Error(message + ` Value ${val} should be length ${length}`);
    return;
  }
}

function lengthLTE(val, lessThanOrEqual, message = '') {
  if (parseInt(val, 10) <= lessThanOrEqual) {
    return val;
  } else {
    throw new Error(message + ` Length ${val} should be less than or equal to ${lessThanOrEqual}`);
    return;
  }
}

function intLT(val, lessThan, message = '') {
  if (parseInt(val, 16) < lessThan) {
    return parseInt(val, 16);
  } else {
    throw new Error(message + ` Value ${val} should be less than ${lessThan}`);
    return;
  }
}

function bigLTE(val, lessThanOrEqual, message = '') {
  const result = big(val);

  if (result.lte(lessThanOrEqual)) {
    return result;
  } else {
    throw new Error(message + ` Value ${val} should be less than or equal to ${lessThanOrEqual}`);
    return;
  }
}

function bigGT(val, greaterThan, message = '') {
  const result = big(val);

  if (result.gt(greaterThan)) {
    return result;
  } else {
    throw new Error(message + ` Value ${val} should be greater than ${greaterThan}`);
    return;
  }
}

// liquidity provider key
const signer = new utils.SigningKey(process.env.swapKey || process.env.swapkey);
const lower = v => String(v).toLowerCase();
const normalize = (...args) => args[0]
  + lower(args[1]).slice(2)
  + (args[2] !== undefined ? lower(args[2]).slice(2) : '');

// intake transaction to the mempool
async function intakeSwap({
  transaction,
  db,
  mempool,
  accounts,
  force,
  batchAll,
  pubnub
}) {
  try {
    const decoded = RLP.decode(transaction);
    const inputs = decoded[0];
    const outputs = decoded[1];
    let witnesses = decoded[2];
    let recoveredWitnesses = [];
    let tokens = { a: big(2), b: big(3) };

    errors.assert(witnesses.length === 1, 'Must be one witness');
    errors.assert(inputs.length >= 3, 'Must be at least three inputs');
    errors.assert(outputs.length === 4, 'Must be four outputs');

    let [reserveA, reserveB,
      reserveAUTXO, reserveBUTXO, owner] = RLP.decode(await db.get(FuelDBKeys.swap));

    // inputs

    for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
      const input = inputs[inputIndex];
      const inputType = intLT(hex(input[0], 1), 4, 'Invalid input type');

      switch (inputType) {
        case FuelInputTypes.UTXO:
          inputs[inputIndex] = new TransactionInputUTXO({
            utxoID: hex(input[1], 32, 'Invalid UTXO ID'),
            witnessReference: intLT(hex(input[2], 1), 9, 'Invalid witness reference overflow'),
          });
          break;

        case FuelInputTypes.Deposit:
          inputs[inputIndex] = new TransactionInputDeposit({
            depositHashID: hex(input[1], 32, 'Invalid deposit hash ID'),
            witnessReference: intLT(hex(input[2], 1), 9, 'Invalid witness reference'),
          });
          break;

        case FuelInputTypes.HTLC:
          inputs[inputIndex] = new TransactionInputHTLC({
            utxoID: hex(input[1], 32, 'Invalid HTLC input UTXO ID'),
            witnessReference: intLT(hex(input[2], 1), 9, 'Invalid HTLC witness reference'),
            preImage: hex(input[3], 32, 'Invalid HTLC pre image'),
          });
          break;

        case FuelInputTypes.Change:
          inputs[inputIndex] = new TransactionInputChange({
            utxoID: hex(input[1], 32, 'Invalid input change UTXO ID'),
            witnessReference: intLT(hex(input[2], 1), 9, 'Invalid input witness reference'),
          });
          break;

        default: throw new FuelError('Invalid input type');
      }
    }

    // outputs 0

    for (let i = 0; i < outputs.length; i++) {
      const outputType = parseInt(hex(outputs[i][0], 1), 16);
      errors.assert(outputType === FuelOutputTypes.UTXO, 'Invalid output type');

      outputs[i] = new TransactionOutputUTXO({
        amount: big(hex(outputs[i][2], 32, 'Invalid transaction output amount')),
        owner: hex(outputs[i][3], 20, 'Invalid transaction output owner'),
        tokenID: big(hex(outputs[i][4], 4, 'Invalid transaction output token ID')),
      });
    }

    // input 1 is ours, witness ref must be right
    errors.assert(inputs[0].utxoID === reserveAUTXO, 'Invalid liquidity pool input utxo ID');
    errors.assert(inputs[0].witnessReference === 1, 'Invalid liquidity pool input witness reference');
    errors.assert(inputs[1].utxoID === reserveBUTXO, 'Invalid liquidity pool input utxo ID');
    errors.assert(inputs[1].witnessReference === 1, 'Invalid liquidity pool input witness reference');

    // if they want back type A, than their input is B, visa versa
    const inputToken = outputs[0].tokenID.eq(tokens.b) ? 'a' : 'b';
    const outputToken = inputToken === 'a' ? 'b' : 'a';
    const inputReserve = big(inputToken === 'a' ? reserveA : reserveB);
    const outputReserve = big(inputToken === 'a' ? reserveB : reserveA);

    errors.assert(outputs[2].amountBig.gt(inputReserve), 'input reserve amount must be greater than previous');
    errors.assert(outputs[3].amountBig.lt(outputReserve), 'output reserve amount must be less than previous');

    // if we were swapping moon to brick (brick is output)
    const inputAmount = outputs[2].amountBig.sub(inputReserve);
    const inputAmountWithFee = inputAmount.mul(997); // input * 997;
    const numerator = inputAmountWithFee.mul(outputReserve);
    const denominator = (inputReserve.mul(1000)).add(inputAmountWithFee);
    const amountToSend = numerator.div(denominator);

    /*
    +3 inputs (their input, liquidity pool input A, liquidity pool B)
    4 outputs UTXOs(sender out A, sender out B, pool out A, pool out B)
    2 witnesses (1. user, 2. liquidity provider)
    */

    // sender inputs 500 moon from a 700 input for bricks, pool of 1000 bricks, pool for moon is 1000
    // output 0 498 bricks to sender, exchanged amount of bricks
    // output 1 200 moon to sender, change
    // output 2 1500 moon to pool, new moon pool input
    // output 3 502 bricks to pool, new moon pool output

    errors.assert(outputs[0].amountBig.eq(amountToSend), `invalid amount sender receiving, got ${outputs[0].amountBig.toHexString()} should be ${amountToSend.toHexString()}`);
    errors.assert(outputs[2].amountBig.eq(inputReserve.add(inputAmount)), 'invalid input pool reserve amount');
    errors.assert(outputs[3].amountBig.eq(outputReserve.sub(amountToSend)), 'invalid output pool reserve amount');

    errors.assert(outputs[0].tokenID.eq(tokens[outputToken]), 'invalid output 0 token ID');
    errors.assert(outputs[1].tokenID.eq(tokens[inputToken]), 'invalid output 1 token ID');
    errors.assert(outputs[2].tokenID.eq(tokens[inputToken]), 'invalid output 2 token ID');
    errors.assert(outputs[3].tokenID.eq(tokens[outputToken]), 'invalid output 3 token ID');

    errors.assert(lower(outputs[2].owner) === lower(signer.address), 'Invalid output 2 owner must be signer');
    errors.assert(lower(outputs[3].owner) === lower(signer.address), 'Invalid output 3 owner must be signer');

    // Construct Unsigned Tx
    const unsignedTransaction = new TransactionUnsigned({ inputs, outputs });

    // Intake Tx
    const result = await intakeTransaction({
      transaction: unsignedTransaction.rlp([
        new TransactionWitness({
          v: hex(witnesses[0][0], 1),
          r: hex(witnesses[0][1], 32),
          s: hex(witnesses[0][2], 32),
        }),
        new TransactionWitness(constructWitness(unsignedTransaction, signer))
      ]),
      db,
      swap: inputToken === 'a'
        ? [inputToken === 'a', outputs[2].amountBig, outputs[3].amountBig, signer.address]
        : [inputToken === 'a', outputs[3].amountBig, outputs[2].amountBig, signer.address],
      mempool,
      accounts,
      batchAll,
      pubnub,
    });

    // Inserted success.
    return true;
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// Export modules
module.exports = {
  intakeSwap,
};
