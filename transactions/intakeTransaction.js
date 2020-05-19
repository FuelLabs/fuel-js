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
const MemoryDB = require('../dbs/MemoryDB');

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

const emptyRLP = RLP.encode('0x0');
const lower = v => String(v).toLowerCase();

// intake transaction to the mempool
async function intakeTransaction({ transaction, db, mempool, accounts, force, batchAll, swap, pubnub }) {
  try {
    TypeHex(transaction);
    TypeDB(db);
    TypeDB(mempool);
    if (typeof accounts !== 'undefined') { TypeDB(accounts); }
    if (typeof batchAll !== 'undefined') {
      TypeBoolean(batchAll);
      if (batchAll && (!db.supports.mysql || !mempool.supports.mysql || !accounts.supports.mysql)) {
        throw new Error('Batch all on, but mysql not activated!');
      }
    }
    if (typeof pubnub !== 'undefined') {
      TypeObject(pubnub);
    }
    TypeBoolean(force || false); // accept without considering fees
    errors.assert(transaction.length > 100 && transaction.length < 1200, 'Invalid transaction byte length');
    const decoded = RLP.decode(transaction);
    const zero = big(0);
    const SpentOutputHex = '0x1';

    // We take the current time at the very begining of execusion.
    // Could a tx be older than another, yet be dependant on it, should be??
    const _time = Math.floor((new Date()).getTime() / 1000);

    // Changable Vars
    let ins = {};
    let outs = {};
    let dupcheck = {};
    let inputs = decoded[0];
    let outputs = decoded[1];
    let witnesses = decoded[2];
    let greatestTokenID = zero;
    let greatestExpiry = zero;
    let isHTLC = false;
    let recoveredWitnesses = [];
    let inputHashes = [];
    let requiredTransactionHashes = [];
    let writes = [];
    let accountWrites = [];
    let accountSpendWrites = [];

    // DB Reads and Writes
    let reads = [
      { type: 'get', key: FuelDBKeys.blockTip },
      { type: 'get', key: FuelDBKeys.numTokens },
    ];
    const witnessesLength = lengthLTE(witnesses.length, 8, 'Witness length overflow');
    errors.assert(witnessesLength > 0, 'Witness length underflow');
    const inputsLength = lengthLTE(inputs.length, 8, 'Invalid inputs length overflow');
    errors.assert(inputsLength > 0, 'Invalid inputs length underflow');
    const outputsLength = lengthLTE(outputs.length, 8, 'Invalid outputs length overflow');
    errors.assert(outputsLength > 0, 'Invalid outputs length underflow');

    for (let inputIndex = 0; inputIndex < inputsLength; inputIndex++) {
      const input = inputs[inputIndex];
      const inputType = intLT(hex(input[0], 1), 4, 'Invalid input type');

      switch (inputType) {
        case FuelInputTypes.UTXO:
          inputs[inputIndex] = new TransactionInputUTXO({
            utxoID: hex(input[1], 32, 'Invalid UTXO ID'),
            witnessReference: intLT(hex(input[2], 1), witnesses.length, 'Invalid witness reference overflow'),
          });

          dupcheck[inputs[inputIndex].utxoID] = true;
          reads.push({ type: 'get', key: FuelDBKeys.UTXO
            + inputs[inputIndex].utxoID.slice(2) });
          reads.push({ type: 'get', key: FuelDBKeys.mempool
            + FuelDBKeys.UTXO.slice(2)
            + inputs[inputIndex].utxoID.slice(2) });
          writes.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].utxoID.toLowerCase().slice(2),
            value: SpentOutputHex,
            ignore: false,
            table: db.table,
          });
          accountSpendWrites.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].utxoID.toLowerCase().slice(2),
            value: null,
            table: accounts.table,
          });
          break;

        case FuelInputTypes.Deposit:
          inputs[inputIndex] = new TransactionInputDeposit({
            depositHashID: hex(input[1], 32, 'Invalid deposit hash ID'),
            witnessReference: intLT(hex(input[2], 1), witnesses.length, 'Invalid witness reference'),
          });

          dupcheck[inputs[inputIndex].depositHashID] = true;
          reads.push({ type: 'get', key: FuelDBKeys.deposit
            + inputs[inputIndex].depositHashID.slice(2) });
          reads.push({ type: 'get', key: FuelDBKeys.deposit
            + inputs[inputIndex].depositHashID.slice(2) });
          writes.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].depositHashID.toLowerCase().slice(2),
            value: SpentOutputHex,
            ignore: false, // this prevents double spending!
            table: db.table,
          });
          accountSpendWrites.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].depositHashID.toLowerCase().slice(2),
            value: null,
            table: accounts.table,
          });
          break;

        case FuelInputTypes.HTLC:
          inputs[inputIndex] = new TransactionInputHTLC({
            utxoID: hex(input[1], 32, 'Invalid HTLC input UTXO ID'),
            witnessReference: intLT(hex(input[2], 1), witnesses.length, 'Invalid HTLC witness reference'),
            preImage: hex(input[3], 32, 'Invalid HTLC pre image'),
          });

          dupcheck[inputs[inputIndex].utxoID] = true;
          reads.push({ type: 'get', key: FuelDBKeys.UTXO
            + inputs[inputIndex].utxoID.slice(2) });
          reads.push({ type: 'get', key: FuelDBKeys.mempool
            + FuelDBKeys.UTXO.slice(2)
            + inputs[inputIndex].utxoID.slice(2) });
          writes.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].utxoID.toLowerCase().slice(2),
            value: SpentOutputHex,
            ignore: false, // this prevents double spending!
            table: db.table,
          });
          accountSpendWrites.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].utxoID.toLowerCase().slice(2),
            value: null,
            table: accounts.table,
          });
          break;

        case FuelInputTypes.Change:
          inputs[inputIndex] = new TransactionInputChange({
            utxoID: hex(input[1], 32, 'Invalid input change UTXO ID'),
            witnessReference: intLT(hex(input[2], 1), witnesses.length, 'Invalid input witness reference'),
          });

          dupcheck[inputs[inputIndex].utxoID] = true;
          reads.push({ type: 'get', key: FuelDBKeys.UTXO
            + inputs[inputIndex].utxoID.slice(2) });
          reads.push({ type: 'get', key: FuelDBKeys.mempool
            + FuelDBKeys.UTXO.slice(2)
            + inputs[inputIndex].utxoID.slice(2) });
          writes.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].utxoID.toLowerCase().slice(2),
            value: SpentOutputHex,
            ignore: false, // this prevents double spending!
            table: db.table,
          });
          accountSpendWrites.push({
            type: 'put',
            key: FuelDBKeys.mempoolSpend
              + inputs[inputIndex].utxoID.toLowerCase().slice(2),
            value: null,
            table: accounts.table,
          });
          break;

        default: throw new FuelError('Invalid input type');
      }
    }

    // check for duplicate utxo / deposit hash keys..
    errors.assert(Object.keys(dupcheck).length === inputs.length, 'duplicate utxo or deposit hashes');

    for (let outputIndex = 0; outputIndex < outputsLength; outputIndex++) {
      const output = outputs[outputIndex];
      const outputType = parseInt(hex(output[0], 1), 16);

      switch (outputType) {
        case FuelOutputTypes.UTXO:
          outputs[outputIndex] = new TransactionOutputUTXO({
            amount: big(hex(output[2], 32, 'Invalid transaction output amount')),
            owner: hex(output[3], 20, 'Invalid transaction output owner'),
            tokenID: big(hex(output[4], 4, 'Invalid transaction output token ID')),
          });
          break;

        case FuelOutputTypes.Withdrawal:
          outputs[outputIndex] = new TransactionOutputWithdrawal({
            amount: big(hex(output[2], 32, 'Invalid output amount')),
            owner: hex(output[3], 20, 'Invalid output owner'),
            tokenID: big(hex(output[4], 4, 'Invalid output token ID')),
          });
          break;

        case FuelOutputTypes.HTLC:
          outputs[outputIndex] = new TransactionOutputHTLC({
            amount: big(hex(output[2], 32, 'Invalid output amount')),
            owner: hex(output[3], 20, 'Invalid output owner'),
            tokenID: big(hex(output[4], 4, 'Invalid output token ID')),
            digest: hex(output[5], 32, 'Invalid output digest'),
            expiry: big(hex(output[6], 4, 'Invalid output expiry')),
            returnWitnessReference: intLT(hex(output[7], 1,
                'Invalid output return witness reference'), witnesses.length,
                  'Invalid transaction output witness reference overflow'),
          });

          isHTLC = true;

          if (outputs[outputIndex].expiry.gt(greatestExpiry)) {
            greatestExpiry = outputs[outputIndex].expiry;
          }
          break;

        case FuelOutputTypes.Change:
          outputs[outputIndex] = new TransactionOutputChange({
            amount: big(hex(output[2], 32, 'Invalid output amount')),
            ownerAsWitnessIndex: intLT(hex(output[3], 1), witnesses.length, 'Invalid output owner as witness index'),
            tokenID: big(hex(output[4], 4, 'Invalid output token ID')),
          });
          break;

        default: throw new FuelError('Invalid output type');
      }

      if (outputs[outputIndex].tokenID.gt(greatestTokenID)) {
        greatestTokenID = outputs[outputIndex].tokenID;
      }

      const tokenIDNumber = String(outputs[outputIndex].tokenID.toNumber());

      // outs
      outs[tokenIDNumber] = (outs[tokenIDNumber] || zero)
        .add(outputs[outputIndex].amount);
    }

    // Construct Unsigned Tx
    const unsignedTransaction = new TransactionUnsigned({
      inputs,
      outputs,
    });
    const transactionHashId = unsignedTransaction.hash;

    // Recover Witnesses
    for (let witnessIndex = 0; witnessIndex < witnessesLength; witnessIndex++) {
      const rawWitness = witnesses[witnessIndex];
      const witness = new TransactionWitness({
        v: hex(rawWitness[0], 1),
        r: hex(rawWitness[1], 32),
        s: hex(rawWitness[2], 32),
      });

      // Recover Witnesses
      recoveredWitnesses[witnessIndex] = ecrecoverPacked(transactionHashId, witness.vrsSignature());
    }

    // Convert account writes..
    const _accountSpendWrites = inputs.map((input, _inputIndex) => Object
      .assign(accountSpendWrites[_inputIndex], {
      value: String(recoveredWitnesses[input.witnessReference]).toLowerCase(),
      table: accounts.table,
    }));

    console.log('gets to batch reads');

    // Do all DB reads at once, including most recent processed blockTip and numTokens..
    const getEntries = db.supports.batchReads
      ? await db.batch(reads)
      : (await Promise.all(reads.map(
      v => db.get(v.key),
    )));

    // Entries
    const memEntries = getEntries.reduce((acc, value, i) => Object.assign({}, acc, {
      [reads[i].key]: value,
    }), {});
    const blockTip = big(RLP.decode(memEntries[FuelDBKeys.blockTip] || emptyRLP));
    const numTokens = parseInt(RLP.decode(memEntries[FuelDBKeys.numTokens] || emptyRLP), 16);

    // Input Entires from DB
    const inputEntries = getEntries.slice(2); // blocktip, numtokens

    // Check Input / Output Values
    intLT(greatestTokenID, numTokens, 'Invalid token ID usage');

    if (isHTLC) {
      bigGT(greatestExpiry, blockTip, 'Invalid HTLC expiry');
    }

    // Empty RLP
    let metadata = [];

    // The distance between validation reads / writes must be thought through..
    // double spend potential in the validation gap.

    // map this properly
    // use utxo decode he..

    // Check entries
    let _inputIndex = 0;
    for (let entryIndex = 0;
        entryIndex < inputEntries.length;
        entryIndex += 2) {
      const entry = inputEntries[entryIndex] || null;
      const memPoolEntry = inputEntries[entryIndex + 1] || null;

      const spendableOutput = entry === null ? memPoolEntry : entry;
      const input = inputs[_inputIndex];
      let output = null;

      if (input.type === FuelInputTypes.Deposit) {
        errors.assert(entry !== null, 'Invalid input no spendable deposit exists'); // a db entry spend is available
        output = decodeDepositRLP(entry);
      } else {
        errors.assert(spendableOutput !== null, 'Invalid input no spendabe UTXO exists'); // either a db or mempool spend available
        output = decodeUTXORLP(spendableOutput);

        // enforce output here, must be behind current blockTip
        // this is due to syncing potentially being out of wack

        if (entry !== null) {
          bigLTE(output.blockHeight, blockTip); // something like this..
          metadata.push(serializeRLP([
            output.blockHeight,
            output.transactionRootIndex,
            output.transactionIndex,
            output.proof.outputIndex,
          ])); // needs to metadata
        } else {
          inputHashes.push(input.utxoID.toLowerCase());
          requiredTransactionHashes.push(output.proof.transactionHashId);
          metadata.push(serializeRLP([
            output.proof.transactionHashId, // this is to determine future placement
            output.proof.outputIndex, // store critical metadata details,
            input.utxoID.toLowerCase(), // we use this to check mempool status
          ])); // needs to be filled in, current block
        }
      }

      // Owner / Amount etc..
      // const txHashID = output.proof.transactionHashId;
      const owner = output.proof._ownerAddress;
      const amount = output.proof.amount;
      const tokenID = String(output.proof.tokenID.toNumber());
      const witnessReference = input.witnessReference;
      const witness = recoveredWitnesses[witnessReference] || '';

      // enfoce swap outputs
      if (swap) {
        if (_inputIndex <= 1) {
          errors.assert(lower(owner) === lower(swap[3]), 'Invalid first two inputs must be swap owner reserves');
        }
        if (_inputIndex > 1) {
          errors.assert(lower(owner) !== lower(swap[3]), 'Invalid attempt to spend non swap inputs');
        }
      }

      // Check owner
      errors.assert(owner.toLowerCase() === witness.toLowerCase(), 'Invalid owner not witness');

      // ints and amount
      ins[tokenID] = (ins[tokenID] || zero).add(amount);

      // Increase input index
      _inputIndex += 1;
    }

    // get token ids
    const tokenIDs = Object.keys(ins);

    // Ins must equal outs.
    for (let tokenIndex = 0; tokenIndex > tokenIDs.length; tokenIndex++) {
      const tokenID = tokenIDs[tokenIndex];

      errors.assert(ins[tokenID].eq(outs[tokenID]), 'Invalid transaction summing');
    }

    const outTokenIds = Object.keys(outs);

    // Ins must equal outs.
    for (let tokenIndex = 0; tokenIndex > outTokenIds.length; tokenIndex++) {
      const tokenID = outTokenIds[tokenIndex];

      errors.assert(outs[tokenID].eq(ins[tokenID]), 'Invalid transaction summing');
    }

    errors.assert(Object.keys(ins).length === Object.keys(outs).length, 'In types not equal out types.');

    const utxoIds = [];

    for (let outputIndex = 0; outputIndex < outputsLength; outputIndex++) {
      const output = outputs[outputIndex];
      const outputType = output.type;

      // Output Type
      const utxoProof = new UTXOProof({
        transactionHashId,
        outputIndex,
        type: outputType,
        amount: big(output.amount),
        owner: output.owner || output.ownerAsWitnessIndex,
        tokenID: big(output.tokenID),
        digest: output.digest,
        expiry: output.expiry,
        returnWitness: output.returnWitnessIndex,
        _ownerAddress: output.owner || recoveredWitnesses[output.ownerAsWitnessIndex],
      });

      // hash
      utxoIds[outputIndex] = utxoProof.hash;

      // Be careful here..
      const output_key = FuelDBKeys.mempool
        + (outputType !== FuelOutputTypes.Withdrawal
            ? FuelDBKeys.UTXO.slice(2)
            : FuelDBKeys.withdrawal.slice(2))
        + utxoProof.hash.toLowerCase().slice(2);

      // if pubnub is available
      if (pubnub) {
        try {
          await pubnub.publish({
            channel: String('0x'
              + String(process.env.chain_id) // chain id
              + utxoProof._ownerAddress.slice(2)).toLowerCase(), // owner address
            message: {
            	title: output_key,
            	description: utxoProof.rlp(),
            },
          });
        } catch (error) {
          console.error(error);
        }
      }

      writes.push({
        type: 'put',
        key: output_key,
        value: utxoProof.rlp(),
        ignore: false,
        table: db.table,
      });

      if (accounts) {
        accountWrites.push({
          type: 'put',
          key: output_key,
          value: String(utxoProof._ownerAddress).toLowerCase(),
          table: accounts.table,
        });
      }
    }
    const unixtime = big(_time).toHexString();

    // In keys and out keys
    const inKeys = Object.keys(ins);
    const outKeys = Object.keys(outs);

    // Check token id types
    errors.assert(inKeys.length === outKeys.length, 'Invalid inputs not equal to outputs');

    // Check keys
    for (var tokenIDKey = 0; tokenIDKey < inKeys.length; tokenIDKey++) {
      errors.assert(ins[inKeys[tokenIDKey]].eq(outs[inKeys[tokenIDKey]]), `Invalid inputs not equal to outputs, token ID ${inKeys[tokenIDKey]}`);
    }

    for (var tokenIDKey = 0; tokenIDKey < outKeys.length; tokenIDKey++) {
      errors.assert(ins[outKeys[tokenIDKey]].eq(outs[outKeys[tokenIDKey]]), `Invalid inputs not equal to outputs, token ID ${inKeys[tokenIDKey]}`);
    }

    const mempoolKey = FuelDBKeys.mempoolTransaction
        + unsignedTransaction.hash.toLowerCase().slice(2);
    const mempoolEntry = RLP.encode([
      unsignedTransaction.hash.toLowerCase(),
      unsignedTransaction.encoded, // payload for proecessing
      witnesses, // witnesses
      metadata, // metadata
      transaction, // the entire tx submission
      unixtime,
      inputHashes,
      requiredTransactionHashes, // required mempool transaction hashes
      big((new Date()).getTime()).toHexString(),
    ]);

    console.log('gets to swap');

    if (swap) {
      // here we identify a swap provider spend by two witness prop
      // owner == signer and second recovered witness == signer
      // output type === UTXO
      // than we database based upon swap key + tokenID
      // only one output per tokenID..
      const aFirst = swap[0];
      writes.push({
        type: 'put',
        key: FuelDBKeys.swap,
        value: RLP.encode([
          swap[1],
          swap[2],
          aFirst ? utxoIds[2] : utxoIds[3],
          aFirst ? utxoIds[3] : utxoIds[2],
          swap[3],
        ]),
        table: db.table,
      });

      console.log('swap entry', {
        type: 'put',
        key: FuelDBKeys.swap,
        value: RLP.encode([
          swap[1],
          swap[2],
          aFirst ? utxoIds[2] : utxoIds[3],
          aFirst ? utxoIds[3] : utxoIds[2],
          swap[3],
        ]),
        table: db.table,
      });
    }

    console.log('writes', writes);

    // We assume if it's mysql, they are all the same DB for now..
    if (batchAll) {
      // We batch all into a single set of writes and deletes.
      // We can make this more efficient (query for most, tx for spend puts)
      // Tx for spend gets of puts, but the rest can be just queries

      console.log('batch all');

      await db.batch(accountWrites
        .concat(_accountSpendWrites)
        .concat(writes)
        .concat([{
          type: 'put',
          key: mempoolKey,
          value: mempoolEntry,
          created: _time,
          table: mempool.table,
        }]), true);

      console.log('done');
    } else {
      // Account writes, this can be made more efficient with a single connection
      if (accounts) {
        await accounts.batch(accountWrites.concat(_accountSpendWrites));
      }

      // Attempt writes into results
      await db.batch(writes, true);

      // Notate tx in mempool, if this fails it can be healed later..
      await mempool.put(mempoolKey, mempoolEntry, true, true);
    }

    // Inserted success.
    return true;
  } catch (error) {
    console.error(error);
    // throw new errors.ByPassError(error);
  }
}

// Export modules
module.exports = {
  intakeTransaction,
};
