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
  eq,
  lt,
  lte,
  gt,
  gte,
  normalizeKey,
  wait,
} = require('../utils/utils');
const _utils = require('../utils/utils');
const {
  FuelInterface,
  FuelUtilityInterface,
  ERC20EventsInterface,
  ERC20Interface,
  FuelEventsInterface,
  FuelConstants,
  FuelErrorCodes,
  FuelFraudNames,
  FuelFraudCodes,
  FuelConstantsCode,
  FuelInputTypes,
  FuelOutputTypes,
  FuelProofTypes,
  TransactionLengthByteSize,
  FuelDBKeys,
} = require('../interfaces/interfaces');
const interfaces = require('../interfaces/interfaces');
const errors = require('../errors/errors');
const structs = require('../structs/structs');

const {
  TypeDB,
  TypeProvider,
  TypeFunction,
  TypeRPC,
  TypeArray, TypeInstance,
  TypeString, TypeDefined,
  TypeNumber, TypeBoolean, TypeAddress,
  TypeHex, TypeBigNumber, TypeObject,
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
  constructDepositHashID,
  constructWithdrawalHashID,
  serializeRLP,
  constructMerkleTreeRoot,

  // UTXO Proofs
  UTXOProof,
  getUTXO,
  getDeposit,
  encodeProofs,
  TransactionProofLengths,
  TransactionProofs,
  EmptyUTXOProofs,
  TransactionProof,
  OverflowingTransactionMerkleProof,

  // Utility Proofs
  EmptyProof,
  FillProof,

  // Malformed Block Proofs
  MalformedBlockProof,
  BlockFraudProofLengths,
  BlockTransactions,
  BlockFraudProof,

  // Transaction Fraud Proofs
  BytesEncode,
  ProofType,
  MalformedTransactionProof,
  InvalidTransactionProof,
  InvalidTransactionInputProof,
  InvalidTransactionDoubleSpendProof,
  WithdrawalProof,
  SummingProof,
  DepositProof,
  UserWithdrawalProof,
  BondWithdrawalProof,
} = require('../structs/structs');

const { parseTransactions } = require('../blocks/parseTransactions');
const MemoryDB = require('../dbs/MemoryDB');

// Simulation DB, clear every block
const SimulationDB = require('../dbs/SimulationDB');

// Verify Amount Length
function verifyAmountLength(amountLength) {
  const len = hexToInt(amountLength);

  // Assert amounts length greater than zero
  errors.assertOrFraud(len > 0,
    FuelConstants.FraudCode_TransactionOutputAmountLengthUnderflow);

  // Assert amounts length less than 33 (i.e 1 <> 32)
  errors.assertOrFraud(len <= 32,
    FuelConstants.FraudCode_TransactionOutputAmountLengthOverflow);

  // Amount length
  return len;
}

// A wrapped version which checks for overflow and throws fraud
function _substr(str, start, len) {
  if (start > str.length
      || (start + len) > str.length) {
    errors.assertOrFraud(0, FuelConstants.FraudCode_ComputedTransactionLengthOverflow);
  }

  // substr
  return str.substr(start, len);
}

function constructDigest(preImage) {
  TypeHex(preImage, 32);

  return utils.keccak256(preImage);
}

// Do this in single WHILE loop, efficiency discovered here..
// Combine with the parseTransactions routine, use same memory array for leafs and processed tx;s
// That should greatly reduce memory footprint and speed up parsing by not having so many promises / functions..
// Transaction Leaf, returns TransactionLeaf, throws malformed transaction error
function parseTransaction({ transactionLeaf, transactionIndex, db, block,
    root, numTokens, validateBlockAndRoot, accounts, transactions }) {
  return new Promise((resolve, reject) => {
    try {
      // Enforce Types
      /*
      TypeHex(transactionLeaf);
      TypeNumber(transactionIndex);
      TypeInstance(block, BlockHeader);
      TypeInstance(root, TransactionRootHeader);
      TypeBigNumber(blockTip);
      TypeBigNumber(numTokens);
      if (typeof db !== 'undefined') { TypeDB(db); }
      */

      // Remove hex
      const raw = transactionLeaf.slice(2);

      // Transaction Length
      const checkBlockAndRoot = validateBlockAndRoot === false ? false : true; // default true
      const transactionLength = hexToInt('0x' + _substr(raw, 0, bytes(2)));
      const metadataLength = hexToInt('0x' + _substr(raw, bytes(2), bytes(1)));

      // Check metadata length
      errors.assertOrFraud(metadataLength < FuelConstants.TransactionLengthMax,
        FuelConstants.FraudCode_TransactionMetadataLengthOverflow);

      let promises = [];
      let metadata = [];

      // Metadata Index
      for (var metadataIndex = 0; metadataIndex < metadataLength; metadataIndex++) {
        const pos = bytes(3) + bytes(metadataIndex * FuelConstants.MetadataSize);

        // Parse metadata
        const data = {
          blockHeight: big('0x' + _substr(raw, pos + bytes(0), bytes(4))),
          transactionRootIndex: hexToInt('0x' + _substr(raw, pos + bytes(4), bytes(1))),
          transactionIndex: hexToInt('0x' + _substr(raw, pos + bytes(5), bytes(2))),
          outputIndex: hexToInt('0x' + _substr(raw, pos + bytes(7), bytes(1))),
        };

        // Assert input index overflow (i.e. metadata does not exist)
        errors.assertOrFraud(metadataIndex < metadataLength,
          FuelConstants.FraudCode_MetadataReferenceOverflow);

        if (checkBlockAndRoot) {
          // Assert Valid Metadata Block height
          errors.assertOrFraud(data.blockHeight.gt(0),
            FuelConstants.FraudCode_MetadataBlockHeightUnderflow);

          // Assert Valid Metadata Block height
          errors.assertOrFraud(data.transactionRootIndex <= FuelConstants.TRANSACTION_ROOTS_MAX,
            FuelConstants.FraudCode_InvalidTransactionRootIndexOverflow);

          // Check overflow of current block height
          errors.assertOrFraud(data.blockHeight.lte(block.height),
            FuelConstants.FraudCode_MetadataBlockHeightOverflow);
        }

        // Check Output Index
        errors.assertOrFraud(data.outputIndex < FuelConstants.TransactionLengthMax,
          FuelConstants.FraudCode_MetadataOutputIndexOverflow);

        metadata[metadataIndex] = data;
      }

      // Metadata Bytes Size
      const metadataSize = metadataLength * FuelConstants.MetadataSize;

      // Get witnesses length
      const witnessesLength = hexToInt('0x' + _substr(raw, bytes(3 + metadataSize), bytes(1)));

      // Signatures
      let witnesses = [];

      // Witness Length correctness
      errors.assertOrFraud(witnessesLength > FuelConstants.TransactionLengthMin,
        FuelConstants.FraudCode_TransactionWitnessesLengthUnderflow);
      errors.assertOrFraud(witnessesLength <= FuelConstants.TransactionLengthMax,
        FuelConstants.FraudCode_TransactionWitnessesLengthOverflow);

      // Total Witness Size in Bytes
      const witnessesSize = witnessesLength * FuelConstants.WitnessSize;

      // Unsigned Transaction Position in Bytes
      let position = bytes(4 + metadataSize + witnessesSize);

      // where UTXO, deposit, withdrawal proofs are located.
      const zero = big(0);

      // Inputs Length
      const inputsLength = hexToInt('0x' + _substr(raw, position, bytes(1)));
      const outputsLength = hexToInt('0x' + _substr(raw, position + bytes(1), bytes(1)));

      // Input Length Under/Overflow Checks
      errors.assertOrFraud(inputsLength > FuelConstants.TransactionLengthMin,
        FuelConstants.FraudCode_TransactionInputsLengthUnderflow);
      errors.assertOrFraud(inputsLength <= FuelConstants.TransactionLengthMax,
        FuelConstants.FraudCode_TransactionInputsLengthOverflow);

      // Assert metadata length correctness (metadata length can be zero)
      errors.assertOrFraud(metadataLength <= inputsLength,
        FuelConstants.FraudCode_TransactionMetadataLengthOverflow);

      // Output Length Under/Overflow Checks
      errors.assertOrFraud(outputsLength > FuelConstants.TransactionLengthMin,
        FuelConstants.FraudCode_TransactionOutputsLengthUnderflow);
      errors.assertOrFraud(outputsLength <= FuelConstants.TransactionLengthMax,
        FuelConstants.FraudCode_TransactionOutputsLengthOverflow);

      // generate unsigned transaciton hash id from raw data now position is checked!
      const transactionHashId = utils.keccak256('0x' + _substr(raw,
          position, bytes(transactionLength) - position));

      // Define all output owners by way of signature reduction
      let recoveredWitnesses = [];

      // signatures
      for (var witnessIndex = 0;
        witnessIndex < witnessesLength;
        witnessIndex++) {
        // Witness Signature Position
        const signaturePosition = (4 + metadataSize)
          + (witnessIndex * FuelConstants.WitnessSize);

        // get input
        const signature = '0x' + _substr(raw, bytes(signaturePosition), bytes(FuelConstants.WitnessSize));

        // Witnesses
        witnesses.push(
          signature,
        );

        // recover witness owners
        recoveredWitnesses.push(ecrecoverPacked(transactionHashId, signature));
      }

      // inputs and outputs
      let inputs = [];
      let outputs = [];

      // outsum
      let outsum = {};

      // Go past input lengths
      position += bytes(2);

      // Go through inputs
      for (var inputIndex = 0; inputIndex < inputsLength; inputIndex++) {
        // Input Type
        const inputType = hexToInt('0x' + _substr(raw, position, bytes(1)));

        // Increase position past type
        position += bytes(1);

        // Input
        let input = null;

        // Entry from DB
        let entry = null;

        // Input length
        let inputLength = null;

        // Handle Type
        switch(inputType) {
          case FuelInputTypes.UTXO:
            input = {
              utxoID: '0x' + _substr(raw, position, bytes(32)),
              witnessReference: hexToInt('0x' + _substr(raw, position + bytes(32), bytes(1))),
            };

            inputLength = 33;
            break;

          case FuelInputTypes.Deposit:
            input = {
              depositHashID: '0x' + _substr(raw, position, bytes(32)),
              witnessReference: hexToInt('0x' + _substr(raw, position + bytes(32), bytes(1))),
            };

            inputLength = 33;

            // Add check to promises
            if (checkBlockAndRoot) {
              promises.push(() => new Promise((res, rej) => {
                // UTXO Proof
                getDeposit(db, input.depositHashID)
                .then(depositCheck => {
                  try {
                    errors.assertOrFraud(gt(depositCheck.proof.amount, 0),
                      FuelConstants.FraudCode_TransactionInputDepositZero);
                    res();
                  } catch (error) {
                    return rej(error);
                  }
                })
                .catch(rej);
              }));
            }

            // Remove spend inputs
            if (accounts) {
              promises.push(accounts.del(FuelDBKeys.deposit + input.depositHashID.slice(2)));
            }
            break;

          case FuelInputTypes.HTLC:
            input = {
              utxoID: '0x' + _substr(raw, position, bytes(32)),
              witnessReference: hexToInt('0x' + _substr(raw, position + bytes(32), bytes(1))),
              preImage: '0x' + _substr(raw, position + bytes(32) + bytes(1), bytes(32)),
            };

            inputLength = 65;
            break;

          case FuelInputTypes.Change:
            input = {
              utxoID: '0x' + _substr(raw, position, bytes(32)),
              witnessReference: hexToInt('0x' + _substr(raw, position + bytes(32), bytes(1))),
            };

            inputLength = 33;
            break;

          default:
            errors.assertOrFraud(0, FuelConstants.FraudCode_InvalidTransactionInputType)
        }

        // Witness Overflow check
        errors.assertOrFraud(input.witnessReference < witnessesLength,
          FuelConstants.FraudCode_TransactionInputWitnessReferenceOverflow);

        // Increase Position
        position += bytes(inputLength);

        // Tag input
        input._kind = inputType;

        // Inputs
        inputs.push(input);
      }

      // Output Handling
      for (var outputIndex = 0; outputIndex < outputsLength; outputIndex++) {
        // Input Type
        const outputType = hexToInt('0x' + _substr(raw, position, bytes(1)));

        // Increase position past type
        position += bytes(1);

        // Input
        let output = null;

        // length
        let amountLength = null;

        // output length
        let outputLength = null;

        // Handle Type
        switch(outputType) {
          case FuelOutputTypes.UTXO:
            // Amount Length
            amountLength = verifyAmountLength('0x' + _substr(raw, position, bytes(1)));

            // Token Owner
            output = {
              amount: big('0x' + _substr(raw, position + bytes(1), bytes(amountLength))),
              owner: '0x' + _substr(raw, position + bytes(1) + bytes(amountLength), bytes(20)),
              tokenID: big('0x' + _substr(raw, position + bytes(1) + bytes(amountLength) + bytes(20), bytes(4))),
            };

            // set owner
            output._ownerAddress = output.owner;

            // Output length
            outputLength = 1 + 20 + 4 + amountLength;
            break;

          case FuelOutputTypes.Withdrawal:
            // Amount Length
            amountLength = verifyAmountLength('0x' + _substr(raw, position, bytes(1)));

            // Token Owner
            output = {
              amount: big('0x' + _substr(raw, position + bytes(1), bytes(amountLength))),
              owner: '0x' + _substr(raw, position + bytes(1) + bytes(amountLength), bytes(20)),
              tokenID: big('0x' + _substr(raw, position + bytes(1) + bytes(amountLength) + bytes(20),
                bytes(4))),
            };

            // set owner
            output._ownerAddress = output.owner;

            // Output length
            outputLength = 1 + 20 + 4 + amountLength;
            break;

          case FuelOutputTypes.HTLC:
            // Amount Length
            amountLength = verifyAmountLength('0x' + _substr(raw, position, bytes(1)));

            // So many structurs..
            const htlcDataPosition = position + bytes(1)
              + bytes(amountLength) + bytes(20) + bytes(4);

            // Token Owner
            output = {
              amount: big('0x' + _substr(raw, position + bytes(1), bytes(amountLength))),
              owner: '0x' + _substr(raw, position + bytes(1) + bytes(amountLength), bytes(20)),
              tokenID: big('0x' + _substr(raw, position + bytes(1)
                + bytes(amountLength) + bytes(20), bytes(4))),
              digest: '0x' + _substr(raw, htlcDataPosition, bytes(32)),
              expiry: big('0x' + _substr(raw, htlcDataPosition + bytes(32), bytes(4))),
              returnWitnessIndex: hexToInt('0x' + _substr(raw, htlcDataPosition + bytes(32) + bytes(4),
                bytes(1))),
            };

            // Output length
            outputLength = 1 + 20 + 4 + amountLength + 32 + 4 + 1;

            // set owner
            output._ownerAddress = output.owner;

            // Assert Token ID is Valid
            errors.assertOrFraud(gt(output.digest, 0),
              FuelConstants.FraudCode_TransactionOutputHTLCDigestZero);

            // Assert Expiry is Valid
            errors.assertOrFraud(gt(output.expiry, 0),
              FuelConstants.FraudCode_TransactionOutputHTLCExpiryZero);

            if (checkBlockAndRoot) {
              // Check expiry is greater than it's own block header
              errors.assertOrFraud(gt(output.expiry, block.height),
                FuelConstants.FraudCode_OutputHTLCExpiryUnderflow);
            }

            // Assert Valid Return Witness
            errors.assertOrFraud(output.returnWitnessIndex < witnessesLength,
              FuelConstants.FraudCode_TransactionOutputWitnessReferenceOverflow);

            // Recovery owner
            output._returnOwnerAddress = recoveredWitnesses[output.returnWitnessIndex];
            break;

          case FuelOutputTypes.Change:
            // Amount Length
            amountLength = verifyAmountLength('0x' + _substr(raw, position, bytes(1)));

            // Token Owner
            output = {
              amount: big('0x' + _substr(raw, position + bytes(1), bytes(amountLength))),
              ownerAsWitnessIndex: hexToInt('0x' + _substr(raw, position + bytes(1) + bytes(amountLength),
                bytes(1))),
              tokenID: big('0x' + _substr(raw, position + bytes(1) + bytes(amountLength) + bytes(1),
                bytes(4))),
            };

            // Invalid Witness Reference out of bounds
            errors.assertOrFraud(output.ownerAsWitnessIndex < witnessesLength,
              FuelConstants.FraudCode_TransactionOutputWitnessReferenceOverflow);

            // set owner
            output._ownerAddress = recoveredWitnesses[output.ownerAsWitnessIndex];

            // Output length
            outputLength = 1 + 1 + 4 + amountLength;
            break;

          default:
            errors.assertOrFraud(0, FuelConstants.FraudCode_InvalidTransactionOutputType)
        }

        // set kind
        output._kind = outputType;

        // Input
        const tokenID = output.tokenID.toString();

        // increase sum
        outsum[tokenID] = (outsum[tokenID] || zero).add(output.amount);

        // Assert Token ID is Valid
        errors.assertOrFraud(lt(output.tokenID, numTokens),
          FuelConstants.FraudCode_TransactionOutputTokenIDOverflow);

        // Increase Position
        position += bytes(outputLength);

        // Store eveyrthing in db
        if (db) {
          const utxoProof = new UTXOProof({
            transactionHashId,
            outputIndex,
            type: output._kind,
            amount: output.amount,
            owner: output.owner || output.ownerAsWitnessIndex,
            tokenID: output.tokenID,
            digest: output.digest,
            expiry: output.expiry,
            returnWitness: output.returnWitnessIndex,
            block,
            root,
            transactionIndex,
            _ownerAddress: output._ownerAddress,
          });

          // Withdrawals
          const dbKey = (output._kind !== FuelOutputTypes.Withdrawal
                ? FuelDBKeys.UTXO
                : FuelDBKeys.withdrawal)
              + utxoProof.hash.slice(2);

          // console.log('DB out key / utxo id', dbKey, '0x' + dbKey.slice(4));

          // UTXO in DB
          promises.push(db.set(dbKey,
            utxoProof.rlp()));

          // Store utxo for historical purposes
          if (transactions) {
            promises.push(db.set(FuelDBKeys.storage + dbKey.slice(2),
              utxoProof.rlp()));
          }

          // Associate these accounts with this utxo..
          if (accounts) {
            promises.push(accounts.set(dbKey,
              String(output._ownerAddress).toLowerCase()));

            // Establish relationship between this tx and the utxo owner
            if (transactions) {
              // Store historical relationship
              promises.push(accounts.set(FuelDBKeys.storage + dbKey.slice(2),
                String(output._ownerAddress).toLowerCase()));

              // Store transaction relationship to account
              promises.push(accounts.set(FuelDBKeys.transaction + transactionHashId.slice(2),
                String(output._ownerAddress).toLowerCase()));
            }
          }
        }

        // Inputs
        outputs.push(output);
      }

      // Positon
      const transactionLeafLength = raw.length;

      // If transaction storage is activated, store the leaf, values, root and index.
      if (transactions) {
        promises.push(db.set(FuelDBKeys.transaction + transactionHashId.slice(2),
          RLP.encode([
            transactionLeaf, // db leaf
            _utils.serializeRLP(block.values), // value
            _utils.serializeRLP(root.values), // root
            big(transactionIndex).toHexString(), // tx index..
          ])));
      }

      // Invalid transaction length
      errors.assertOrFraud(transactionLeafLength === position,
        FuelConstants.FraudCode_ComputedTransactionLengthOverflow);

      // Resolve parse
      Promise.all(promises)
      .then(() => {
        // Return Transaction Leaf, dont release partial proofs if invalid input detected!
        resolve({
          recoveredWitnesses,
          transactionHashId,
          metadata,
          witnesses,
          inputs,
          outputs,
          outsum,
        });
        return;
      })
      .catch(error => {
        logger.error(error);
        const err = new errors.ByPassError(error);
        err.transactionIndex = transactionIndex;
        err.fraudCode = error.fraudCode;
        err.stack = err.stack;

        return reject(err);
      });
    } catch (error) {
      logger.error(error);
      const err = new errors.ByPassError(error);
      err.transactionIndex = transactionIndex;
      err.fraudCode = error.fraudCode;
      err.stack = err.stack;

      return reject(err);
    }
  });
}

async function getToken({ db, tokenID }) {
  TypeDB(db);
  try {
    return RLP.decode(await db.get(FuelDBKeys.token + big(tokenID).toHexString().slice(2)))[0];
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// Transaction Leaf, returns TransactionLeaf, throws malformed transaction error
async function validateTransaction({ parsedTransaction, db, accounts, block,
    contract,
    logger,
    root, numTokens, transactionIndex, leaf, rpc, leafs }) {
  try {
    // Type Object / Open Transaction Data
    TypeObject(parsedTransaction);
    const { transactionHashId, inputs, outputs, outsum,
        metadata, witnesses, recoveredWitnesses } = parsedTransaction;

    // Enforce Types
    TypeHex(transactionHashId, 32);
    TypeHex(leaf);
    TypeNumber(transactionIndex);
    TypeArray(inputs);
    TypeArray(outputs);
    TypeArray(metadata);
    TypeArray(witnesses);
    TypeObject(outsum);
    TypeObject(contract);
    TypeFunction(rpc);
    TypeArray(recoveredWitnesses);
    TypeInstance(block, BlockHeader);
    TypeInstance(root, TransactionRootHeader);
    TypeBigNumber(numTokens);
    TypeDB(db);
    if (accounts) { TypeDB(accounts); }

    // Proofs and bools
    let proofs = [];
    let invalidInput = null;
    let invalidTransaction = false;
    const zero = big(0);

    // In sum
    let insum = {}; // token address => big(0);

    // metadata selected
    let metadataIndex = 0;

    // Go through inputs
    for (var inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
      // Input Index
      let entry = null;
      const input = inputs[inputIndex];
      const inputType = input._kind;

      // Handle Type
      switch(inputType) {
        case FuelInputTypes.UTXO:
          // UTXO Proof
          entry = !invalidInput ? await getUTXO(db, input.utxoID) : null;

          // Removal of DB
          if (entry) {
            await db.remove(FuelDBKeys.UTXO + input.utxoID.slice(2));
            await db.remove(FuelDBKeys.mempool + FuelDBKeys.UTXO.slice(2) + input.utxoID.slice(2));

            if (accounts) {
              await accounts.remove(FuelDBKeys.UTXO + input.utxoID.slice(2));
              await accounts.remove(FuelDBKeys.mempool + FuelDBKeys.UTXO.slice(2) + input.utxoID.slice(2));
            }
          }
          break;

        case FuelInputTypes.Deposit:
          // UTXO Proof
          entry = !invalidInput ? await getDeposit(db, input.depositHashID) : null;

          // Entry
          if (entry) {
            // Assert deposit is not zero
            errors.assertOrFraud(gt(entry.proof.amount, 0),
              FuelConstants.FraudCode_TransactionInputDepositZero);

            // Remove Deposit
            await db.remove(FuelDBKeys.deposit + input.depositHashID.toLowerCase().slice(2));

            if (accounts) {
              await accounts.remove(FuelDBKeys.deposit + input.depositHashID.toLowerCase().slice(2));
            }
          }
          break;

        case FuelInputTypes.HTLC:
          // UTXO Proof
          entry = !invalidInput ? await getUTXO(db, input.utxoID) : null;

          // Check digest
          if (entry && !invalidTransaction) {
            if (lt(block.height, entry.proof.expiry)) {
              invalidTransaction = !eq(entry.proof.digest, constructDigest(input.preImage));
            }

            // Remove Deposit
            await db.remove(FuelDBKeys.UTXO + input.utxoID.slice(2));
            await db.remove(FuelDBKeys.mempool + FuelDBKeys.UTXO.slice(2) + input.utxoID.slice(2));

            if (accounts) {
              await accounts.remove(FuelDBKeys.UTXO + input.utxoID.slice(2));
              await accounts.remove(FuelDBKeys.mempool + FuelDBKeys.UTXO.slice(2) + input.utxoID.slice(2));
            }
          }
          break;

        case FuelInputTypes.Change:
          // UTXO Proof
          entry = !invalidInput ? await getUTXO(db, input.utxoID) : null;

          if (entry) {
            await db.remove(FuelDBKeys.UTXO + input.utxoID.slice(2));
            await db.remove(FuelDBKeys.mempool + FuelDBKeys.UTXO.slice(2) + input.utxoID.slice(2));

            if (accounts) {
              await accounts.remove(FuelDBKeys.UTXO + input.utxoID.slice(2));
              await accounts.remove(FuelDBKeys.mempool + FuelDBKeys.UTXO.slice(2) + input.utxoID.slice(2));
            }
          }
          break;
      }

      // console.log('Entry lookup hash / index / key / entry',
      //  transactionHashId, transactionIndex,
      //  input.utxoID || input.depositHashID, entry);

      // This means either it doesn't exist or is double spend
      if (!entry && !invalidInput) {
        // This is the invalid input
        invalidInput = {
          metadata: metadata[metadataIndex],
          metadataIndex,
          input,
          inputType,
          inputIndex,
          witnessAddress: recoveredWitnesses[input.witnessReference],
        };

        // Clear Proofs and Sums from Memory
        proofs = null;
        insum = null;
      }

      // If there is an entry and no invalid input
      if (entry && !invalidInput) {
        proofs.push(
          entry.proof,
        );

        // Token ID
        const tokenID = entry.proof.tokenID.toString();

        // owner from proof
        const owner = entry.proof._ownerAddress;

        // increase sum
        insum[tokenID] = (insum[tokenID] || zero).add(entry.proof.amount);

        // Check witness
        if (!invalidTransaction) {
          invalidTransaction = !eq(owner, recoveredWitnesses[input.witnessReference]);
        }
      }

      // Select next metadata
      if (inputType !== FuelInputTypes.Deposit) {
        metadataIndex += 1;
      }
    }

    // if no invalid input, test sums
    if (!invalidInput && !invalidTransaction) {
      // Insum
      const tokenIDs = Object.keys(insum);

      // Interate Through Token ids, detect invalid sum
      for (var tokenIndex = 0; tokenIndex < tokenIDs.length; tokenIndex++) {
        const tokenID = tokenIDs[tokenIndex];

        if (!invalidTransaction) {
          // Ins != Outs, than it's invalid!
          invalidTransaction = !eq(insum[tokenID] || zero, outsum[tokenID] || zero);

          // Set Invalid Sum token
          if (invalidTransaction) {
            // Invalid Summing Tokenx
            proofs = [{
              _kind: 'summing',
              tokenID,
              token: await getToken({ db, tokenID }),
            }].concat(proofs);

            // Break the For Loop
            break;
          }
        }
      }

      // Outsum
      const outSumTokenIDs = Object.keys(outsum);

      // Interate Through Token ids, detect invalid sum
      for (var tokenIndex = 0; tokenIndex < outSumTokenIDs.length; tokenIndex++) {
        const tokenID = outSumTokenIDs[tokenIndex];

        if (!invalidTransaction) {
          // Ins != Outs, than it's invalid!
          invalidTransaction = !eq(insum[tokenID] || zero, outsum[tokenID] || zero);

          // Set Invalid Sum token
          if (invalidTransaction) {
            // Invalid Summing Tokenx
            proofs = [{
              _kind: 'summing',
              tokenID,
              token: await getToken({ db, tokenID }),
            }].concat(proofs);

            // Break the For Loop
            break;
          }
        }
      }
    }

    // If Invalid, Create Invalid Transaction Proof
    if (invalidTransaction) {
      throw new errors.ProofError(new InvalidTransactionProof(new TransactionProof({
        block,
        root,
        merkle: new TransactionMerkleProof({ transactionLeafs: leafs.map(v => new FillProof(v)), transactionIndex }),
        transaction: new TransactionData({
          inputIndex: 0,
          outputIndex: 0,
          witnessIndex: 0,
          transactionIndex,
          transactionLeaf: new FillProof(leaf),
        }),
        proofs: new TransactionProofs(proofs.map(proofData => {
          if (proofData._kind === 'summing') {
            return new SummingProof(proofData.token);
          } else if (proofData._kind === 'utxo') {
            return new UTXOProof(proofData);
          } else {
            return new DepositProof(proofData);
          }
        })),
      })));
    } else if (invalidInput) {
      // Transaction Proof
      const transactionProofB = await isInvalidInputReference({
          invalidInput, db, rpc, numTokens, contract, logger });

      // Invalid Transaction Input Doesn't Exist
      if (transactionProofB) {
        logger.log(transactionProofB.message);

        throw new errors.ProofError(new InvalidTransactionInputProof(new TransactionProof({
            block,
            root,
            merkle: new TransactionMerkleProof({ transactionLeafs: leafs.map(v => new FillProof(v)), transactionIndex }),
            transaction: new TransactionData({
              inputIndex: invalidInput.inputIndex,
              outputIndex: 0,
              witnessIndex: 0,
              transactionIndex,
              transactionLeaf: new FillProof(leaf),
            }),
            proofs: 0,
          }), transactionProofB));
      } else {
        // Scan entire chain for Double Spend
        const ds_transactionProofB = await isDoubleSpend({
            invalidInput, db, rpc, numTokens, contract, logger });

        // We have a serious problem
        if (!ds_transactionProofB) {
          throw new errors.FuelError('We have a serious problem.. double spend not found in double spend serious..');
        }

        // Double Spend Proof
        const doubleSpendProof = new InvalidTransactionDoubleSpendProof(new TransactionProof({
          block,
          root,
          merkle: new TransactionMerkleProof({ transactionLeafs: leafs.map(v => new FillProof(v)), transactionIndex }),
          transaction: new TransactionData({
            inputIndex: invalidInput.inputIndex,
            outputIndex: 0,
            witnessIndex: 0,
            transactionIndex,
            transactionLeaf: new FillProof(leaf),
          }),
          proofs: 0,
        }), ds_transactionProofB);

        // Double spend proof
        logger.log(doubleSpendProof);

        // create malformed transaction proof
        throw new errors.ProofError(doubleSpendProof);
      }
    }
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// Is Invalid, Determine if Input Reference Even exists
async function isInvalidInputReference({ invalidInput, db, rpc, numTokens, contract, logger }) {
  try {
    TypeDB(db);
    TypeObject(contract);
    TypeFunction(rpc);
    TypeBigNumber(numTokens);
    TypeObject(contract);

    // Spread Data
    const {
      metadata,
      metadataIndex,
      input,
      inputType,
      inputIndex,
      witnessAddress,
    } = invalidInput;

    // Metadata
    const {
      blockHeight,
      transactionRootIndex,
      transactionIndex,
      outputIndex,
    } = metadata;

    logger.error(`
    Fraud System Activated, Invalid Input Reference Detected Below:
      Transaction Details:
      Block Height: ${blockHeight}
      Root Index: ${transactionRootIndex}
      Tx Index: ${transactionIndex}
      Output Index: ${outputIndex}

      Metadata and Input Details:
      Details: ${JSON.stringify(metadata)}
      Index: ${metadataIndex}
      Input: ${JSON.stringify(input)}
      Input Type: ${inputType}
      Input Index: ${inputIndex}
      Witness Address in Question: ${witnessAddress}
    `);

    // logger.

    // Block Header
    const blockHeader = await getBlockHeader(db, blockHeight);

    // FraudCode_InvalidTransactionRootIndexOverflow
    if(gte(transactionRootIndex, blockHeader.transactionRoots.length)) {
      // Just sumbit the first tx of the first root
      const proofTransactionRootIndex = 0;
      const proofRootHeader = await getTransactionRoot(db, blockHeader, proofTransactionRootIndex);
      const proofTransactions = await transactionsFromReceipt(rpc, proofRootHeader.transactionHash);
      const proofleafs = parseTransactions(proofTransactions);
      const proofTransactionIndex = 0;

      // Return Transaction Proof of any Transaction
      return new TransactionProof({
        block: blockHeader,
        root: proofRootHeader,
        merkle: new TransactionMerkleProof({
          transactionLeafs: proofleafs.map(v => new FillProof(v)),
          transactionIndex: proofTransactionIndex,
        }),
        transaction: new TransactionData({
          inputIndex: 0,
          outputIndex: 0,
          witnessIndex: 0,
          transactionIndex: proofTransactionIndex,
          transactionLeaf: new FillProof(proofleafs[proofTransactionIndex]),
        }),
        proofs: 0,
        message: `Root overflow detected root index: ${transactionRootIndex} > roots length ${blockHeader.transactionRoots.length}`,
      });
    }

    // Get actual root, transactions and leafs
    const rootHeader = await getTransactionRoot(db, blockHeader, transactionRootIndex);
    const transactions = await transactionsFromReceipt(rpc, rootHeader.transactionHash);
    const leafs = parseTransactions(transactions);

    // FraudCode_TransactionIndexOverflow
    if (gte(transactionIndex, leafs.length)) {
      // Return rightmost proof
      const proofTransactionIndex = leafs.length - 1;
      return new TransactionProof({
        block: blockHeader,
        root: rootHeader,
        merkle: new TransactionMerkleProof({ transactionLeafs: leafs.map(v => new FillProof(v)), proofTransactionIndex }),
        transaction: new TransactionData({
          inputIndex: 0,
          outputIndex: 0,
          witnessIndex: 0,
          transactionIndex: proofTransactionIndex,
          transactionLeaf: new FillProof(leafs[proofTransactionIndex]),
        }),
        proofs: 0,
        message: `Transaction index overflow index: ${transactionIndex} > leafs length ${leafs.length}`,
      });
    }

    // get Merkle Proof of Transaction in Question
    const merkleProof = new TransactionMerkleProof({ transactionLeafs: leafs.map(v => new FillProof(v)), transactionIndex });

    // FraudCode_TransactionHashZero
    if (eq(merkleProof.transactionHash, emptyBytes32)) {
      // Return transaction, as Leaf Hash is Empty!!
      return new TransactionProof({
        block: blockHeader,
        root: rootHeader,
        merkle: merkleProof,
        transaction: new TransactionData({
          inputIndex: 0,
          outputIndex: 0,
          witnessIndex: 0,
          transactionIndex,
          transactionLeaf: new FillProof(leafs[transactionIndex]),
        }),
        proofs: 0,
        message: `Transaction Hash Zero ${merkleProof.transactionHash}`,
      });
    }

    const {
      transactionHashId,
      recoveredWitnesses,
      witnesses,
      inputs,
      outputs,
    } = await parseTransaction({
      transactionLeaf: leafs[transactionIndex],
      transactionIndex,
      block: blockHeader,
      root: rootHeader,
      numTokens,
      contract,
      validateBlockAndRoot: false,
    });

    // FraudCode_MetadataOutputIndexOverflow
    if (gte(outputIndex, outputs.length)) {
      // Return transaction, as Leaf Hash is Empty!!
      return new TransactionProof({
        block: blockHeader,
        root: rootHeader,
        merkle: merkleProof,
        transaction: new TransactionData({
          inputIndex: 0,
          outputIndex: 0,
          witnessIndex: 0,
          transactionIndex,
          transactionLeaf: new FillProof(leafs[transactionIndex]),
        }),
        proofs: 0,
        message: `Transaction Index Overflow index: ${outputIndex} >= outputs length ${outputs.length}`,
      });
    }

    // Proof output
    const output = outputs[outputIndex];

    // Create Tx Proof for Specified ouput and index
    const transactionProof = new TransactionProof({
      block: blockHeader,
      root: rootHeader,
      merkle: merkleProof,
      transaction: new TransactionData({
        inputIndex: 0,
        outputIndex,
        witnessIndex: 0,
        transactionIndex,
        transactionLeaf: new FillProof(leafs[transactionIndex]),
      }),
      proofs: 0,
      message: 'Invalid output type withdrawl or mismatch output type',
    });

    // FraudCode_InvalidInputWithdrawalSpend
    if (output.type === FuelOutputTypes.Withdrawal) {
      // Return transaction, as Leaf Hash is Empty!!
      transactionProof.message = 'Withdrawl spend';
      return transactionProof;
    }

    // FraudCode_InvalidTypeReferenceMismatch
    if (inputType !== output._kind) {
      // Return transaction, as Leaf Hash is Empty!!
      transactionProof.message = 'Input type mismatch';
      return transactionProof;
    }

    // build utxoID's
    const utxoID = input.utxoID;
    const outputUTXOProof = new UTXOProof({
      transactionHashId,
      outputIndex,
      type: output._kind,
      amount: output.amount,
      owner: output.owner || output.ownerAsWitnessIndex,
      tokenID: output.tokenID,
      digest: output.digest,
      expiry: output.expiry,
      returnWitnessIndex: output.returnWitnessIndex,
    });

    // FraudCode_InvalidUTXOHashReference
    if (!eq(utxoID, outputUTXOProof.hash)) {
      // Return transaction, as Leaf Hash is Empty!!
      transactionProof.message = `Invalid utxo id hash FraudCode_InvalidUTXOHashReference ${utxoID} ${outputUTXOProof.hash}`;
      return transactionProof;
    }

    // FraudCode_InvalidChangeInputSpender
    if (output.type === FuelOutputTypes.Change) {
      // Input Witness Address not Equal to Witness
      if (!eq(witnessAddress, output._ownerAddress)) {
        transactionProof.message = `Invalid witness address ${output.type}`;
        return transactionProof;
      }
    }

    // HTLC Output handling
    if (output.type === FuelOutputTypes.HTLC) {

      // If HTLC is expired
      if (gte(blockHeader.height, output.expiry)) {

        // FraudCode_InvalidReturnWitnessNotSpender
        if (!eq(witnessAddress, output._returnOwnerAddress)) {
          transactionProof.message = `Invalid HTLC witness address on expired block height ${blockHeader.height} ${output.expiry} ${witnessAddress} ${output._returnOwnerAddress}`;
          return transactionProof;
        }
      }
    }

    // Proof is Valid, must be a double spend..
    return null;
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// Get block header from DB
async function getBlockHeader(db, blockHeight) {
  try {
    TypeDB(db);
    TypeBigNumber(blockHeight);

    // Block
    const blockRLP = await db.get(interfaces.FuelDBKeys.block
        + _utils.big(blockHeight.toNumber()).toHexString().slice(2));

    // Block
    if (!blockRLP) {
      throw new Error(`block does not exist in db, ${blockHeight}`);
    }

    // Decoee RLP
    const blockDecoded = _utils.RLP.decode(blockRLP);

    // Block HEader
    return new structs.BlockHeader({
      producer: blockDecoded[0], // - blockProducer [32 bytes] -- padded address
      previousBlockHash: blockDecoded[1], // - previousBlockHash [32 bytes]
      blockHeight: _utils.big(blockDecoded[3]), //- blockHeight [32 bytes]
      ethereumBlockNumber: _utils.big(blockDecoded[2]), // - ethereumBlockNumber [32 bytes]
      transactionRoots: blockDecoded[4], //
    });
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// Get Root Header from DB
async function getTransactionRoot(db, blockHeader, rootIndex) {
  try {
    TypeDB(db);
    TypeInstance(blockHeader, structs.BlockHeader);
    TypeNumber(rootIndex);

    // Root hash
    const rootHash = blockHeader.transactionRoots[rootIndex];

    // Block
    const transactionRootRLP = await db.get(interfaces.FuelDBKeys.transactionRoot
        + rootHash.slice(2));

    // Block
    if (!transactionRootRLP) {
      throw new Error(`tx root does not exist in db, ${transactionRootRLP}`);
    }

    // Decode
    const transactionRootDecoded = _utils.RLP.decode(transactionRootRLP);

    // Block Header
    return new structs.TransactionRootHeader({
      producer: transactionRootDecoded[0],
      merkleTreeRoot: transactionRootDecoded[1],
      commitmentHash: transactionRootDecoded[2],
      index: _utils.big(rootIndex),
      transactionHash: transactionRootDecoded[3],
    });
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// Scan Entire Chain for Input, than Produce Transaction Proof
async function isDoubleSpend({ invalidInput, db, rpc, numTokens, contract, logger }) {
  try {
    TypeDB(db);
    TypeObject(invalidInput);
    TypeObject(contract);
    TypeFunction(rpc);
    TypeBigNumber(numTokens);

    // Spread Data
    const {
      metadata,
      metadataIndex,
      input,
      inputType,
      inputIndex,
      witnessAddress,
    } = invalidInput;

    // Metadata
    const {
      blockHeight,
      transactionRootIndex,
      transactionIndex,
      outputIndex,
    } = metadata;

    const blockTip = await contract.blockTip();

    // get input utxo id
    const utxoID = input.utxoID;

    // Logger Error
    logger.error(`
    Fraud System Activated, Invalid Input Reference Detected Below:
    | Transaction Details:
      Block Height: ${blockHeight}
      Root Index: ${transactionRootIndex}
      Tx Index: ${transactionIndex}
      Output Index: ${outputIndex}

    | Metadata and Input Details:
      Details: ${metadata}
      Index: ${metadataIndex}
      Input: ${input}
      Input Type: ${inputType}
      Input Index: ${inputIndex}
      Witness Address in Question: ${witnessAddress}
    `);

    // search block height
    for (let searchBlockHeight = 1; // start past genesis
      searchBlockHeight <= blockTip.toNumber();
      searchBlockHeight++) {

      // Block Header
      const blockHeader = await getBlockHeader(db, _utils.big(searchBlockHeight));

      // Search roots
      for (let rootIndex = 0;
          rootIndex < blockHeader.transactionRoots.length;
          rootIndex++) {
        // get Root Header
        const rootHeader = await getTransactionRoot(db, blockHeader, rootIndex);
        const transactions = await transactionsFromReceipt(rpc, rootHeader.transactionHash);

        // Search for UTXO ID in transactions blob
        if (transactions.toLowerCase()
          .indexOf(utxoID.slice(2).toLowerCase()) !== -1) {
          // Get Leafs
          const leafs = parseTransactions(transactions);

          // Search Through Leafs
          for (let searchTransactionIndex = 0;
              searchTransactionIndex < leafs.length;
              searchTransactionIndex++) {

            // Find Specific Leaf
            if (leafs[searchTransactionIndex].toLowerCase()
              .indexOf(utxoID.slice(2).toLowerCase()) !== -1) {
              let searchInputs = [];

              // Parse Transaction
              try {
                const { inputs } = await parseTransaction({
                  transactionLeaf: leafs[searchTransactionIndex],
                  block: blockHeader,
                  root: rootHeader,
                  numTokens,
                  contract,
                });

                // Search inputs
                searchInputs = inputs;
              } catch (error) { logger.log('while doing double spend, malformed tx'); }

              // Search through inputs now..
              for (var searchInputIndex = 0;
                  searchInputIndex < searchInputs.length;
                  searchInputIndex++) {
                // Search input Object
                const searchInput = searchInputs[searchInputIndex];

                // Check to make sure this is not the input referenced, which is valid but spent!
                const isNotReferencedOutput = !eq(blockHeader.height, blockHeight)
                  || !eq(rootHeader.index, transactionRootIndex)
                  || !eq(searchTransactionIndex, transactionIndex)
                  || !eq(searchInputIndex, inputIndex);

                // Got you double spender!!
                if (eq(searchInput.utxoID, utxoID) && isNotReferencedOutput) {
                  return new TransactionProof({
                    block: blockHeader,
                    root: rootHeader,
                    merkle: new TransactionMerkleProof({
                      transactionLeafs: leafs.map(v => new FillProof(v)),
                      transactionIndex: searchTransactionIndex }),
                    transaction: new TransactionData({
                      inputIndex: searchInputIndex,
                      outputIndex: 0,
                      witnessIndex: 0,
                      transactionIndex,
                      transactionLeaf: new FillProof(leafs[searchTransactionIndex]),
                    }),
                    proofs: 0,
                  });
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// simple get receipt
function getReceipt(rpc, transactionHash) {
  TypeHex(transactionHash, 32);

  // get receipt
  return rpc('eth_getTransactionReceipt', transactionHash);
}

// Transactions From Receipt
async function transactionsFromReceipt(rpc, transactionHash) {
  try {
    TypeFunction(rpc);
    TypeHex(transactionHash, 32);

    // Input Data
    const input = (await rpc('eth_getTransactionByHash', transactionHash)).input;

    // Transactions Data
    const transactions = abi.decode(['bytes32', 'bytes'], '0x' + input.slice(10))[1];

    // Transactions
    return transactions;
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// validate entire block in single thread
async function processBlock(blockHeader, { db, accounts, transactions, rpc, numTokens,
    contract, logger, _roots }) {
  try {
    // Enforce types
    TypeDB(db);
    TypeInstance(blockHeader, BlockHeader);
    TypeFunction(rpc);
    TypeObject(contract);
    if (accounts) { TypeDB(accounts); }
    if (typeof transactions !== "undefined") { TypeBoolean(transactions); }
    if (typeof _roots !== "undefined") { TypeArray(_roots); }

    // Check for genesis
    if (blockHeader.height.eq(0)) {
      return { success: true, proof: null };
    }

    // simulate writes in cache, storage as get if not in cache
    let simulationDB = new SimulationDB({
      storage: db,
      cache: new MemoryDB(),
    });

    // For handling accounts during processing..
    let accountsSimulationDB = null;
    if (accounts) {
      accountsSimulationDB = new SimulationDB({
        storage: accounts,
        cache: new MemoryDB(),
      });
    }

    let transactionData = [];
    let roots = [];

    // Processing time..
    logger.log('Block processing begining for side-chain block: ', blockHeader.height.toString());

    // go through roots and parse out leafs
    logger.time(`Parallel transaction parsing ${blockHeader.transactionRoots.length}`);
    for (var transactionRootIndex = 0;
        transactionRootIndex < blockHeader.transactionRoots.length;
        transactionRootIndex++) {

      transactionData[transactionRootIndex] = [];

      // Transaction Root
      const transactionRoot = _roots
        ? _roots[transactionRootIndex].header.hash
        : blockHeader.transactionRoots[transactionRootIndex];

      // RLP root
      const rlpRoot = _roots
        ? null
        : RLP.decode(await db.get(FuelDBKeys.transactionRoot + transactionRoot.slice(2)));

      // transaction root header
      const rootHeader = _roots
        ? _roots[transactionRootIndex].header
        : new TransactionRootHeader({
          producer: rlpRoot[0],
          merkleTreeRoot: rlpRoot[1],
          commitmentHash: rlpRoot[2],
          transactionHash: rlpRoot[3],
          index: big(transactionRootIndex),
        });

      // Transactions Data
      let transactions = _roots
        ? _roots[transactionRootIndex].transactions.encoded
        : await transactionsFromReceipt(rpc, rootHeader.transactionHash);

      // Try / Catch
      let leafs;

      // Attempt parsing out the leaves
      try {
        leafs = parseTransactions(transactions);
        transactions = null; // clear txs
      } catch (error) {
        logger.log('Malformed block error!');
        // Submit malformed block proof
        return {
          success: false,
          proof: new MalformedBlockProof(new BlockFraudProof({
            block: blockHeader,
            root: rootHeader,
            transactions: new FillProof(transactions),
          })),
        };
      }

      // Record roots for validation processing
      roots[transactionRootIndex] = {
        rootHeader,
        leafs,
      };

      logger.log(`Parsing ${leafs.length} leafs`);

      for (let transactionIndex = 0;
           transactionIndex < leafs.length;
           transactionIndex++) {
        try {
          transactionData[transactionRootIndex][transactionIndex] = await parseTransaction({
            transactionLeaf: leafs[transactionIndex],
            db: simulationDB,
            block: blockHeader,
            root: rootHeader,
            accounts: accountsSimulationDB,
            transactions,
            transactionIndex,
            numTokens,
            contract,
          });

          // Resolve all transactions ???
          // transactionData = await Promise.all(transactionData);
        } catch (error) {
          logger.log('Malformed transaction proof error!');
          // create malformed transaction proof

          // Logger Error
          logger.error(`Malformed Transaction Detected
            Tx Block Height: ${blockHeader.height}
            Root Index: ${rootHeader.index}
            Tx Index: ${transactionIndex}
            Tx Leaf: ${leafs[error.transactionIndex]}

            Block Details: ${JSON.stringify(blockHeader)}
            Root Details: ${JSON.stringify(rootHeader)}
          `);

          return {
            success: false,
            proof: new MalformedTransactionProof(new TransactionProof({
              block: blockHeader,
              root: rootHeader,
              merkle: new TransactionMerkleProof({ transactionLeafs: leafs.map(v => new FillProof(v)), transactionIndex: error.transactionIndex }),
              transaction: new TransactionData({
                inputIndex: 0,
                outputIndex: 0,
                witnessIndex: 0,
                transactionIndex,
                transactionLeaf: new FillProof(leafs[error.transactionIndex]),
              }),
              proofs: 0,
            })),
          };
        }
      }

      // Set leafs object to null
      leafs = null;
    }
    logger.timeEnd(`Parallel transaction parsing ${blockHeader.transactionRoots.length}`);

    // Validate Block
    logger.time('Parallel transaction validation');
    try {
      for (let transactionRootIndex = 0;
          transactionRootIndex < blockHeader.transactionRoots.length;
          transactionRootIndex++) {
        // get essential root information
        const {
          rootHeader,
          leafs,
        } = roots[transactionRootIndex];
        let validations = [];

        // transaction error checking
        for (let transactionIndex = 0;
          transactionIndex < leafs.length;
          transactionIndex++) {
          // Detect Inputs, Invaliditiy
          validations.push(validateTransaction({
            parsedTransaction: transactionData[transactionRootIndex][transactionIndex],
            leaf: leafs[transactionIndex],
            transactionIndex,
            db: simulationDB,
            accounts: accountsSimulationDB,
            block: blockHeader,
            root: rootHeader,
            rpc,
            numTokens,
            contract,
            leafs,
            logger,
          }));
        }

        // Resolve all validations
        await Promise.all(validations);

        // Cleanup
        validations = null;
        roots[transactionRootIndex].leafs = null;
        roots[transactionRootIndex].rootHeader = null;
        roots[transactionRootIndex] = null;
      }
    } catch (error) {
      if (error.proof) {
        logger.log('Transaciton input fraud error!');
        roots = null;
        return { success: false, proof: error.proof };
      } else {
        throw new errors.ByPassError(error);
      }
    }
    logger.timeEnd('Parallel transaction validation');

    // Batch write outputs and inputs
    if (!_roots) {
      await db.batch(simulationDB.opts);
    }

    // Clear simulation DB from memory
    await simulationDB.clear();
    roots = null;
    simulationDB = null;

    // Accounts
    if (accounts) {
      if (!_roots) {
        // Batch write outputs and inputs
        await accounts.batch(accountsSimulationDB.opts);
      }

      // Clear simulation
      await accountsSimulationDB.clear();
      accountsSimulationDB = null;
    }

    // Return proof
    return {
      success: true,
      proof: null,
    };
  } catch (error) {
    throw new errors.ByPassError(error);
  }
}

// Export modules
module.exports = {
  processBlock,
  transactionsFromReceipt,
  getReceipt,
  isDoubleSpend,
  isInvalidInputReference,
  validateTransaction,
  getToken,
  parseTransaction,
  constructDigest,
  getDeposit,
  _substr,
  verifyAmountLength,
};
