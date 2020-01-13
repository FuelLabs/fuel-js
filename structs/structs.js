const { utils } = require('ethers');
const {
  abi,
  big,
  BN,
  emptyAddress,
  emptyBytes32,
  RLP,
} = require('../utils/utils');
const _utils = require('../utils/utils');

const {
  FuelInputTypes,
  FuelOutputTypes,
  FuelProofTypes,
  FuelDBKeys,
} = require('../interfaces/interfaces');
const interfaces = require('../interfaces/interfaces');

const {
  ByPassError,
} = require('../errors/errors');
const errors = require('../errors/errors');

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
const types = require('../types/types');

function assertNew(self, type) {
  if (!(self instanceof type)) throw new Error(type.name + ' not instantiated with `new`');
}

function BlockHeader({ producer, previousBlockHash, blockHeight, ethereumBlockNumber, transactionRoots }) {
  // Enforce Object
  assertNew(this, BlockHeader);

  // Enfore Types
  TypeAddress(producer);
  TypeHex(previousBlockHash, 32);
  TypeBigNumber(blockHeight);

  TypeBigNumber(ethereumBlockNumber);
  TypeArray(transactionRoots);
  for (var rootIndex = 0; rootIndex < transactionRoots.length; rootIndex++) {
    TypeHex(transactionRoots[rootIndex], 32);
  }

  // Props
  this.producer = producer;
  this.previousBlockHash = previousBlockHash;
  this.height = blockHeight;
  this.blockHeight = this.height;
  this.ethereumBlockNumber = ethereumBlockNumber;
  this.transactionRoots = transactionRoots;

  // Construct Block Header
  this.types = [
    'address', // - blockProducer [32 bytes] -- padded address
    'bytes32', // - previousBlockHash [32 bytes]
    'uint256', //- blockHeight [32 bytes]
    'uint256', // - ethereumBlockNumber [32 bytes]
    'bytes32[]', // - transactionRoots [64 + dynamic bytes]
  ];
  this.values = [producer, previousBlockHash, blockHeight, ethereumBlockNumber, transactionRoots];
  this.encoded = abi.encode(this.types, this.values);
  this.hash = utils.keccak256(this.encoded);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionRootHeader({ producer, merkleTreeRoot, commitmentHash, index, transactionHash }) {
  // Enforce Object
  assertNew(this, TransactionRootHeader);
  TypeAddress(producer);
  TypeHex(merkleTreeRoot, 32);
  TypeHex(commitmentHash, 32);
  if (typeof index !== 'undefined') { TypeBigNumber(index); }
  if (typeof transactionHash !== 'undefined') { TypeHex(transactionHash, 32); }

  this.producer = producer;
  this.merkleTreeRoot = merkleTreeRoot;
  this.commitmentHash = commitmentHash;
  this.transactionHash = transactionHash;
  this.index = index || 0;

  this.types = [
    'address', // - transactionRootProducer [32 bytes] -- padded address
    'bytes32', // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
    'bytes32', // - transactionRootCommitmentHash [32 bytes]
    'uint16', // - transactionRootIndex [32 bytes] -- padded uint16
  ];
  const values = this.values = [producer, merkleTreeRoot, commitmentHash, this.index];
  this.encoded = abi.encode(this.types, this.values);
  this.rlp = () => RLP.encode(values);
  this.hash = utils.keccak256(abi.encode(['address', 'bytes32', 'bytes32'], [producer, merkleTreeRoot, commitmentHash]));
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionData({ inputIndex, outputIndex, witnessIndex, transactionIndex, transactionLeaf }) {
  // Enforce Object
  assertNew(this, TransactionData);

  // Type Enforcement
  TypeNumber(inputIndex);
  TypeNumber(outputIndex);
  TypeNumber(witnessIndex);
  TypeNumber(transactionIndex);
  TypeObject(transactionLeaf);

  // Construction
  this.types = [
    'uint8', // - input index [32 bytes] -- padded uint8
    'uint8', // - output index [32 bytes] -- padded uint8
    'uint8', // - witness index [32 bytes] -- padded uint8
    'uint16', // - transactionIndex [32 bytes] -- padded uint16
    'bytes', // - transactionLeafData [dynamic bytes]
  ];
  this.inputIndex = inputIndex;
  this.outputIndex = outputIndex;
  this.witnessIndex = witnessIndex;
  this.transactionIndex = transactionIndex;
  this.transactionLeaf = transactionLeaf;

  this.values = [inputIndex, outputIndex, witnessIndex, transactionIndex, transactionLeaf.encoded];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionLength(value) {
  // Enforce Object
  assertNew(this, TransactionLength);

  this.types = [
    'uint16', // - bytes length
  ];
  this.values = [value];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionLengthSpecifier(value) {
  // Enforce Object
  assertNew(this, TransactionLengthSpecifier);

  this.types = [
    'uint8', // - bytes length
  ];
  this.values = [value];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionMetadata({ blockHeight, transactionRootIndex, transactionIndex, outputIndex }) {
  // Enforce Object
  assertNew(this, TransactionMetadata);

  // Enforce Types
  TypeBigNumber(blockHeight);

  if (typeof transactionRootIndex === 'object') {
    TypeBigNumber(transactionRootIndex);
  } else {
    TypeNumber(transactionRootIndex);
  }

  if (typeof transactionIndex === 'object') {
    TypeBigNumber(transactionIndex);
  } else {
    TypeNumber(transactionIndex);
  }

  if (typeof outputIndex === 'object') {
    TypeBigNumber(outputIndex);
  } else {
    TypeNumber(outputIndex);
  }

  // Props
  this.blockHeight = blockHeight;
  this.transactionRootIndex = transactionRootIndex;
  this.transactionIndex = transactionIndex;
  this.outputIndex = outputIndex;

  // Construct
  this.types = [
    'uint32', // - blockHeight [4 bytes] -- uint32
    'uint8', // - transactionRootIndex [1 byte] -- uint8
    'uint16', // - transactionIndex [2 bytes] -- uint16
    'uint8', // - output index [1 byte] -- uint8
  ];
  this.values = [ blockHeight, transactionRootIndex, transactionIndex, outputIndex ];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Ethers Signature
function encodeSignature(ethersSignature) {
  TypeObject(ethersSignature);

  // Joined Encoded
  const joined = utils.joinSignature(ethersSignature); // RSV

  // Return output // VRS
  return '0x' + joined.slice(-2) + joined.substr(2, 128); // VRS
}

// Decode Signature
function decodeSignature(vrsSignature) {
  // Enforce Signature
  TypeHex(vrsSignature, 65);

  // Split Signature
  return {
    v: '0x' + vrsSignature.substr(2, 2),
    r: '0x' + vrsSignature.substr(4, 64),
    s: '0x' + vrsSignature.substr(4 + 64, 64),
  };
}

// Unsigned TX with Signing Key
function constructWitness(unsignedTransaction, signingKey) {

  // Enforce Types
  TypeInstance(unsignedTransaction, TransactionUnsigned);
  TypeObject(signingKey);

  // Construct VRS Object
  return decodeSignature(encodeSignature(signingKey.signDigest(unsignedTransaction.hash)));
}

// encode packed
function ecrecoverPacked(digest, vrsSignature) {
  // TypeHex(digest, 32);
  // TypeHex(vrsSignature, 65);

  // split
  const flat = '0x'
    + vrsSignature.substr(4, 64) // r
    + vrsSignature.substr(4 + 64, 64) // s
    + vrsSignature.substr(2, 2); // v
  return utils.recoverAddress(digest, utils.splitSignature(flat));
}

// Can insert encoded
function TransactionWitness({ signature, encoded, v, r, s }) {
  // Enforce Object
  assertNew(this, TransactionWitness);

  // Check Types
  if (typeof encoded !== 'undefined') { TypeHex(encoded, 65); }
  if (typeof signature !== 'undefined') { TypeObject(signature); }
  if (typeof v !== 'undefined') { TypeHex(v, 1); }
  if (typeof r !== 'undefined') { TypeHex(r, 32); }
  if (typeof s !== 'undefined') { TypeHex(s, 32); }

  // Split signature
  const sig = (encoded || signature)
    ? decodeSignature(encoded ? encoded : encodeSignature(signature))
    : { v, r, s };

  // Signature Properties.
  this.v = sig.v;
  this.r = sig.r;
  this.s = sig.s;

  // Construct Types
  this.types = [
    'uint8', // - v [4 bytes] -- uint32 V
    'bytes32', // - r [1 byte] -- uint8 R
    'bytes32', // - s [2 bytes] -- uint16 S
  ];
  this.values = [sig.v, sig.r, sig.s];
  this.vrsSignature = () => String(sig.v + sig.r.slice(2) + sig.s.slice(2));
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

/*
new TransactionMetadata({
  blockHeight: 1,
  transactionRootindex: 0,
  transactionIndex: 0,
  outputIndex: 0,
})
*/


function constructDepositHashID({ account, token, ethereumBlockNumber }) {
  // Enforce Types
  TypeAddress(account);
  TypeAddress(account);
  TypeBigNumber(ethereumBlockNumber);

  // Construct Hash
  const types = [
    'address',
    'address',
    'uint256',
  ];
  const values = [
    account,
    token,
    ethereumBlockNumber,
  ];

  // Return Construction
  return utils.keccak256(abi.encode(types, values));
}

// Construct withdrawal hash id
function constructWithdrawalHashID({ transactionRootIndex, transactionLeafHash, outputIndex }) {
  // Enforce Types
  TypeNumber(transactionRootIndex);
  TypeHex(transactionLeafHash, 32);
  TypeNumber(outputIndex);

  // Construct Hash
  const types = [
    'uint8',
    'bytes32',
    'uint8',
  ];
  const values = [
    transactionRootIndex,
    transactionLeafHash,
    outputIndex,
  ];

  // Return Construction
  return utils.keccak256(abi.encode(types, values));
}

function serializeRLP(arr) {
  return arr.map(v => (typeof v === 'number') ? big(v).toHexString() : v);
}

// Transaction Input UTXO
function TransactionInputUTXO({ utxoID, witnessReference }) {
  // Enforce Object
  assertNew(this, TransactionInputUTXO);

  // Enforce Types
  TypeHex(utxoID, 32);
  TypeNumber(witnessReference);

  // Props
  this.utxoID = utxoID;
  this.witnessReference = witnessReference;
  this.type = FuelInputTypes.UTXO;

  // Witness reference
  this.types = [
    'uint8', // - type [1 bytes] -- uint32
    'bytes32', // - depositHashID [32 bytes] -- bytes32
    'uint8', // - witness reference [1 byte] -- uint8
  ];
  this.values = [ FuelInputTypes.UTXO, utxoID, witnessReference ];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Transaction Input UTXO
function TransactionInputHTLC({ utxoID, witnessReference, preImage }) {
  // Enforce Object
  assertNew(this, TransactionInputHTLC);

  // Enforce Types
  TypeHex(utxoID, 32);
  TypeHex(preImage, 32);
  TypeNumber(witnessReference);

  // Props
  this.utxoID = utxoID;
  this.witnessReference = witnessReference;
  this.preImage = preImage;
  this.type = FuelInputTypes.HTLC;

  // Witness reference
  this.types = [
    'uint8', // - blockHeight [4 bytes] -- uint32
    'bytes32', // - depositHashID [32 bytes] -- bytes32
    'uint8', // - witness reference [1 byte] -- uint8
    'bytes32', // - witness reference [1 byte] -- uint8
  ];
  this.values = [FuelInputTypes.HTLC, utxoID, witnessReference, preImage ];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Transaction Input UTXO
function TransactionInputChange({ utxoID, witnessReference }) {
  // Enforce Object
  assertNew(this, TransactionInputChange);

  // Enforce Types
  TypeHex(utxoID, 32);
  TypeNumber(witnessReference);

  // Props
  this.utxoID = utxoID;
  this.witnessReference = witnessReference;
  this.type = FuelInputTypes.Change;

  // Witness reference
  this.types = [
    'uint8', // - blockHeight [4 bytes] -- uint32
    'bytes32', // - depositHashID [32 bytes] -- bytes32
    'uint8', // - witness reference [1 byte] -- uint8
  ];
  this.values = [FuelInputTypes.Change, utxoID, witnessReference ];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionInputDeposit({ depositHashID, witnessReference }) {
  // Enforce Object
  assertNew(this, TransactionInputDeposit);

  // Enforce Types
  TypeHex(depositHashID, 32);
  TypeNumber(witnessReference);

  // Props
  this.depositHashID = depositHashID;
  this.witnessReference = witnessReference;
  this.type = FuelInputTypes.Deposit;

  // Witness reference
  this.types = [
    'uint8', // - blockHeight [4 bytes] -- uint32
    'bytes32', // - depositHashID [32 bytes] -- bytes32
    'uint8', // - witness reference [1 byte] -- uint8
  ];
  this.values = [FuelInputTypes.Deposit, depositHashID, witnessReference ];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionOutputUTXO({ amount, tokenID, owner }) {
  // Enforce Object
  assertNew(this, TransactionOutputUTXO);

  // Enforce Types
  TypeBigNumber(amount);
  TypeBigNumber(tokenID);
  TypeAddress(owner);

  // Construct
  this.type = FuelOutputTypes.UTXO;
  this.amount = utils.hexStripZeros(big(amount).toHexString());

  // is odd
  if (this.amount.length % 2) {
    this.amount = '0x0' + this.amount.slice(2);
  }

  this.amountLength = big(utils.hexDataLength(this.amount) || 1);
  this.owner = owner;
  this.tokenID = tokenID;
  this.tokenID = tokenID;

  this.types = [
    'uint8',
    'uint8',
    'uint' + this.amountLength.mul(8).toString(),
    'address',
    'uint32',
  ];
  this.values = [this.type, this.amountLength, this.amount, this.owner, this.tokenID];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionOutputWithdrawal({ amount, tokenID, owner }) {
  // Enforce Object
  assertNew(this, TransactionOutputWithdrawal);

  // Enforce Types
  TypeBigNumber(amount);
  TypeBigNumber(tokenID);
  TypeAddress(owner);

  // Construct
  this.type = FuelOutputTypes.Withdrawal;
  this.amount = utils.hexStripZeros(big(amount).toHexString());

  // is odd
  if (this.amount.length % 2) {
    this.amount = '0x0' + this.amount.slice(2);
  }

  this.amountLength = big(utils.hexDataLength(this.amount) || 1);
  this.tokenID = tokenID;
  this.owner = owner;

  this.types = [
    'uint8',
    'uint8',
    'uint' + this.amountLength.mul(8).toString(),
    'address',
    'uint32',
  ];
  this.values = [this.type, this.amountLength, this.amount, this.owner, this.tokenID];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionOutputChange({ amount, tokenID, ownerAsWitnessIndex }) {
  // Enforce Object
  assertNew(this, TransactionOutputChange);

  // Enforce Types
  TypeBigNumber(amount);
  TypeBigNumber(tokenID);
  TypeNumber(ownerAsWitnessIndex);

  // Construct
  this.type = FuelOutputTypes.Change;
  this.amount = utils.hexStripZeros(big(amount).toHexString());

  // is odd
  if (this.amount.length % 2) {
    this.amount = '0x0' + this.amount.slice(2);
  }

  this.amountLength = big(utils.hexDataLength(this.amount) || 1);
  this.ownerAsWitnessIndex = ownerAsWitnessIndex;
  this.tokenID = tokenID;

  this.types = [
    'uint8',
    'uint8',
    'uint' + this.amountLength.mul(8).toString(),
    'uint8',
    'uint32',
  ];

  this.values = [this.type, this.amountLength, this.amount, this.ownerAsWitnessIndex, this.tokenID];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionOutputHTLC({ amount, tokenID, owner, digest, expiry, returnWitnessIndex }) {
  // Enforce Object
  assertNew(this, TransactionOutputHTLC);

  // Enforce Types
  TypeBigNumber(amount);
  TypeBigNumber(tokenID);
  TypeAddress(owner);
  TypeHex(digest, 32);
  TypeBigNumber(expiry);
  TypeNumber(returnWitnessIndex);

  // Construct
  this.type = FuelOutputTypes.HTLC;
  this.amount = utils.hexStripZeros(big(amount).toHexString());

  // is odd
  if (this.amount.length % 2) {
    this.amount = '0x0' + this.amount.slice(2);
  }

  this.amountLength = big(utils.hexDataLength(this.amount) || 1);
  this.owner = owner;
  this.tokenID = tokenID;
  this.digest = digest;
  this.expiry = expiry;
  this.returnWitnessIndex = returnWitnessIndex;
  this.types = [
    'uint8',
    'uint8',
    'uint' + this.amountLength.mul(8).toString(),
    'address',
    'uint32',
    'bytes32',
    'uint32',
    'uint8',
  ];
  this.values = [this.type, this.amountLength, this.amount, this.owner,
      this.tokenID, digest, expiry, big(returnWitnessIndex)];
  this.encoded = utils.solidityPack(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionUnsigned({ inputs, outputs }) { // Array, Array
  // Enforce Object
  assertNew(this, TransactionUnsigned);

  // Enforce Types
  TypeArray(inputs);
  TypeArray(outputs);

  // Construct
  this.inputsLength = new TransactionLengthSpecifier(inputs.length);
  this.outputLength = new TransactionLengthSpecifier(outputs.length);
  this.inputs = inputs;
  this.outputs = outputs;

  this.encoded = encodeProofs([ this.inputsLength, this.outputLength, this.inputs, this.outputs ]);
  this.hash = utils.keccak256(this.encoded);
  this.rlp = witnesses => RLP.encode([
    this.inputs.map(v => serializeRLP(v.values)),
    this.outputs.map(v => serializeRLP(v.values)),
    witnesses.map(v => serializeRLP(v.values)),
  ]);

  // Transaction Total bytes length
  this.length = utils.hexDataLength(this.encoded);
}

function EmptyTransactionLeaf(length) {
  // Enforce Object
  assertNew(this, EmptyTransactionLeaf);

  TypeNumber(length);
  const hexLength = big(length || 0).toHexString();

  this.encoded = utils.hexZeroPad(hexLength, 2) + utils.hexZeroPad('0x', big(hexLength).sub(2).toNumber()).slice(2);
  this.hash = length === 0 ? emptyBytes32 : utils.keccak256(this.encoded);
  this.length = length;
}

function RealEmptyTransactionLeaf(length) {
  // Enforce Object
  assertNew(this, RealEmptyTransactionLeaf);

  TypeNumber(length);
  const hexLength = big(length || 2).toHexString(); // 2 for length

  this.encoded = utils.hexZeroPad(hexLength, 2) + utils.hexZeroPad('0x', big(hexLength).sub(2).toNumber()).slice(2);
  this.hash = length === 0 ? emptyBytes32 : utils.keccak256(this.encoded);
  this.length = utils.hexDataLength(this.encoded);
}

function TransactionLeaf({ metadata, witnesses, unsignedTransaction }) { // Array, Array, Object
  // Enforce Object
  assertNew(this, TransactionLeaf);

  // Type Enforcement
  TypeArray(metadata);
  TypeArray(witnesses);
  TypeObject(unsignedTransaction);

  // Construct Leaf
  this.metadata = metadata;
  this.witnesses = witnesses;
  this.unsignedTransaction = unsignedTransaction;

  // Lengths
  this.metadataLength = new TransactionLengthSpecifier(this.metadata.length);
  this.witnessesLength = new TransactionLengthSpecifier(this.witnesses.length);

  // Encoded Leaf data
  this.encodedLeaf = encodeProofs([
    this.metadataLength,
    this.metadata,
    this.witnessesLength,
    this.witnesses,
    this.unsignedTransaction,
  ]);

  // Length is Encoded Leaf length + 2 for it's own length
  this.transactionLength = new TransactionLength(utils.hexDataLength(this.encodedLeaf) + 2);

  // include everythign
  this.encoded = this.transactionLength.encoded + this.encodedLeaf.slice(2);

  // Leaf Hash / Hash ID (includes length)!
  this.hash = utils.keccak256(this.encoded);
  this.hashID = this.unsignedTransaction.hash;

  // Transaction Total bytes length
  this.length = utils.hexDataLength(this.encoded);
}

// UTXO proofs
function UTXOProof({ transactionHashId, outputIndex, type, amount, owner,
    _ownerAddress, tokenID, digest, expiry, returnWitness,
    returnWitnessIndex, block, root, transactionIndex }) {
  // Enforce Object
  assertNew(this, UTXOProof);

  // Enforce Types
  TypeHex(transactionHashId, 32);
  TypeNumber(outputIndex);
  TypeNumber(type);
  TypeBigNumber(amount);

  if (type === FuelOutputTypes.HTLC) {
    TypeDefined(digest);
    TypeDefined(expiry);
  }

  if (typeof owner !== 'number') { TypeAddress(owner); }
  TypeBigNumber(tokenID);
  if (digest) { TypeHex(digest, 32); }
  if (expiry) { TypeBigNumber(expiry); }
  if (returnWitness || returnWitnessIndex) { TypeNumber(returnWitness || returnWitnessIndex || 0); }

  if (typeof block !== 'undefined') { TypeInstance(block, BlockHeader); }
  if (typeof root !== 'undefined') { TypeInstance(root, TransactionRootHeader); }
  if (typeof transactionIndex !== 'undefined') { TypeNumber(transactionIndex); }
  if (typeof _ownerAddress !== 'undefined') { TypeAddress(_ownerAddress); }

  this.transactionHashId = transactionHashId;
  this.outputIndex = outputIndex;
  this.type = type;
  this.amount = amount;
  this.owner = owner;
  this.tokenID = reduceTokenID(tokenID);
  this.digest = digest || emptyBytes32;
  this.expiry = expiry || big(0);
  this.returnWitness = returnWitness || returnWitnessIndex || 0;
  this._ownerAddress = _ownerAddress || (typeof this.owner !== 'number' ? this.owner : emptyAddress);

  // Construct TYpes
  this.types = [
    'bytes32', // - transactionHashId [32 bytes]
    'uint8', // - outputIndex [32 bytes]
    'uint8', // - type [32 bytes] -- padded uint8
    'uint256', // - amount [32 bytes]
    (typeof owner === 'number') ? 'uint8' : 'address', // - owner [32 bytes]
    'uint32', // - tokenID [32 bytes] -- padded uint32
    'bytes32', //  - digest [32 bytes]
    'uint32', //  - expiry [32 bytes] -- padded uint32
    'uint8', //  - return witness index [32 bytes] -- padded uint8
  ];

  // Construct
  this.values = [transactionHashId, outputIndex, type, amount, owner,
      this.tokenID, this.digest, this.expiry, this.returnWitness];

  this.rlp = () => RLP.encode([
    [
      this.transactionHashId,
      big(this.outputIndex).toHexString(),
      big(this.type).toHexString(),
      this.amount,
      big(this.owner).toHexString(),
      this.tokenID,
      this.digest,
      this.expiry,
      big(this.returnWitness).toHexString(),
      this._ownerAddress,
    ],
    block ? block.height : '0x0',
    block ? block.hash : '0x0',
    root ? big(root.index).toHexString() : '0x0',
    transactionIndex ? big(transactionIndex).toHexString() : '0x0'
  ]);
  this.encoded = abi.encode(this.types, this.values);
  this.hash = utils.keccak256(this.encoded);
  this.length = utils.hexDataLength(this.encoded);
}

// Decode UTXO
function decodeUTXORLP(entryRLP) {
  if (!entryRLP) return null;

  TypeString(entryRLP);

  // Deconstruct Entry
  const rlp = RLP.decode(entryRLP);

  // utxo entry
  const utxoEntry = rlp[0];
  const blockHeight = big(rlp[1]);
  const blockHash = rlp[2];
  const transactionRootIndex = big(rlp[3]);
  const transactionIndex = big(rlp[4]);
  const type = big(utxoEntry[2]).toNumber();

  // RLP Decoded (we dont fully construct these until we need to)
  return {
    proof: {
      transactionHashId: utxoEntry[0],
      outputIndex: big(utxoEntry[1]).toNumber(),
      type,
      amount: big(utxoEntry[3]),
      owner: type === FuelInputTypes.Change ? big(utxoEntry[4]).toNumber() : utxoEntry[4],
      tokenID: big(utxoEntry[5]),
      digest: utxoEntry[6],
      expiry: big(utxoEntry[7]),
      returnWitness: big(utxoEntry[8]).toNumber(),
      _ownerAddress: utxoEntry[9],
      _kind: 'utxo',
    },
    blockHeight,
    blockHash,
    transactionRootIndex,
    transactionIndex,
  };
}

// Decode Deposit
function decodeDepositRLP(entryRLP) {
  TypeString(entryRLP);

  // RLP decode
  const entry = RLP.decode(entryRLP);

  // If not found, return null
  if (!entry) { return null; }

  // Return structure
  return {
    proof: {
      account: entry[0],
      token: entry[1],
      ethereumBlockNumber: big(entry[2]),
      tokenID: big(entry[3]),
      amount: big(entry[4]),
      _kind: 'deposit',
      _ownerAddress: entry[0],
    },
  };
}

// get utxo from database
async function getUTXO(db, utxoID) {
  try {
    // Enforce Types
    TypeDB(db);
    TypeHex(utxoID, 32);

    // get entry
    const entry = await db.get(FuelDBKeys.UTXO + utxoID.toLowerCase().slice(2));

    // Decode UTXO
    return decodeUTXORLP(entry);
  } catch (error) {
    throw new ByPassError(error);
  }
}

async function getDeposit(db, depositHashID) {
  try {
    // Type Enforcement
    TypeDB(db);
    TypeHex(depositHashID, 32);

    // Decode RLP
    const entry = await db.get(FuelDBKeys.deposit + depositHashID.toLowerCase().slice(2));

    // Decode Deposit Entry
    return decodeDepositRLP(entry);
  } catch (error) {
    throw new ByPassError(error);
  }
}

// Encode Multiple Proofs
function encodeProofs(proofs) {
  return '0x' + proofs.map(proof => {

    // Flatten
    if (Array.isArray(proof)) {
      return encodeProofs(proof).slice(2);
    }

    // Normal encoding
    return proof.encoded.slice(2);
  }).join('');
}

// Transaction Fraud Proofs
function TransactionProofLengths(values) {
  // Enforce Object
  assertNew(this, TransactionProofLengths);

  this.types = [
    'uint16', // - blockHeaderlength [32 bytes] -- padded uint16
    'uint16', // - transactionRootHeaderLength [32 bytes] -- padded uint16
    'uint16', // - transactionDataLength [32 bytes] -- padded uint16
    'uint16', // - merkleProofLength [32 bytes] -- padded uint16
    'uint16', // - utxoProofsLength [32 bytes] -- padded uint16
  ];
  this.values = values;
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Transaction Proofs
function TransactionProofs(proofs) {
  // Enforce Object
  assertNew(this, TransactionProofs);

  // Enforce Types
  TypeArray(proofs);

  // Construct
  this.encoded = encodeProofs(proofs);
  this.length = utils.hexDataLength(this.encoded);
}

function EmptyUTXOProofs() {
  // Enforce Object
  assertNew(this, EmptyUTXOProofs);

  this.encoded = '0x';
  this.length = utils.hexDataLength(this.encoded);
}

// Fraud proofs
function TransactionProof({ block, root, merkle, transaction, proofs, message }) {
  // Enforce Object
  assertNew(this, TransactionProof);

  // Enforce Types
  TypeInstance(block, BlockHeader);
  TypeInstance(root, TransactionRootHeader);
  TypeObject(merkle);
  TypeInstance(transaction, TransactionData);
  if (proofs !== 0) { TypeInstance(proofs, TransactionProofs); }

  // Properties
  this.block = block;
  this.root = root;
  this.merkle = merkle;
  this.transaction = transaction;
  this.message = message || null;

  // Include Proofs
  if (proofs) {
    this.proofs = proofs;
  } else {
    this.proofs = new EmptyUTXOProofs();
  }

  // Construct lengths
  this.lengths = new TransactionProofLengths([
    this.block.length,
    this.root.length,
    this.merkle.length,
    this.transaction.length,
    this.proofs.length,
  ]);

  // values
  this.values = [this.lengths, this.block, this.root, this.merkle, this.transaction, this.proofs];

  // include everythign
  this.encoded = encodeProofs(this.values);
  this.length = utils.hexDataLength(this.encoded);
}

/*
// Iterate Through Merkle Proof Depths
// https://crypto.stackexchange.com/questions/31871/what-is-the-canonical-way-of-creating-merkle-tree-branches
for { let depth := 0 } lt(depth, treeHeight) { depth := safeAdd(depth, 1) } {
    // get the leaf hash
    let proofLeafHash := load32(treeMemoryPosition, depth)

    // Determine Proof Direction the merkle brand left:  tx index % 2 == 0
    switch eq(smod(transactionIndex, 2), 0)

    // Direction is left branch
    case 1 {
        mstore(mul32(1), proofLeafHash)
        mstore(mul32(2), computedHash)

        // Leftishness Detected in Proof, This is not Rightmost
        mpush(Stack_MerkleProofLeftish, True)
    }

    // Direction is right branch
    case 0 {
        mstore(mul32(1), computedHash)
        mstore(mul32(2), proofLeafHash)
    }

    default { revert(0, 0) } // Direction is Invalid, Ensure no other cases!

    // Construct Depth Hash
    computedHash := keccak256(mul32(1), mul32(2))

    // Shift transaction index right by 1
    transactionIndex := shr(transactionIndex, 1)
}
*/

// Construct Merkle Tree Root
function constructMerkleTreeRoot(transactionLeafs) {
  // Leafs
  TypeArray(transactionLeafs);

  // Hashes
  let hashes = transactionLeafs.map(leaf => leaf.hash);
  let swap = [];

  // Merklization Routine (inefficient)
  for (var i = 0; hashes.length > 0; i++) { // depth
    const hash = hashes[i];

    // if its uneven, pad with zero hash
    if (hashes.length % 2 > 0) {
      hashes.push(emptyBytes32);
    }

    for (var z = 0; z < hashes.length; z += 2) { // do hashes (2 hashes together)
      // push master hash
      swap.push(utils.keccak256(hashes[z] + hashes[z + 1].slice(2)));
    }

    // switch places to next height
    hashes = swap;
    swap = []; // clear swap

     // shim 1 to zero (stop), i.e. top height end..
    if (hashes.length < 2) {
      // Hashes length
      break;
    }
  }

  // Swap zero is the master hash
  return hashes[0];
}

function OverflowingTransactionMerkleProof() {
  // Enforce Object
  assertNew(this, OverflowingTransactionMerkleProof);

  this.opppositeLeafHash = emptyBytes32;
  this.proof = (new Array(256)).fill(0).map(() => emptyBytes32);
  this.types = [
    'bytes32',
    'bytes32[]',
  ];
  this.values = [this.opppositeLeafHash, this.proof];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Transaction Merkle Proof
/*
function TransactionMerkleProof({ transactionLeafs, transactionIndex, merkleTreeRoot }) {
  // Enforce Object
  assertNew(this, TransactionMerkleProof);

  // Enforce
  TypeArray(transactionLeafs);
  TypeNumber(transactionIndex);

  // Construct
  let hashes = transactionLeafs.map(leaf => leaf.hash);
  let swap = [];
  let oppositeLeafHash = null;
  let masterHash = null;
  let proof = [];
  let leftish = false;

  // Merklization Routine (inefficient)
  for (var i = 0; hashes.length > 0; i++) { // depth
    const hash = hashes[i];

    // if its uneven, pad with zero hash
    if (hashes.length % 2 > 0) {
      hashes.push(emptyBytes32);
    }

    for (var z = 0; z < hashes.length; z += 2) { // do hashes (2 hashes together)
      // depth hash
      let depthHash = utils.keccak256(hashes[z] + hashes[z + 1].slice(2));

      // setup opposite leaf hash AT Base
      if (i === 0 && z === transactionIndex) {
        oppositeLeafHash = hashes[z + 1];
        masterHash = depthHash;
        leftish = true;
        proof.push(hashes[z]);
      }

      // setup opposite leaf hash at Base
      if (i === 0 && (z + 1) === transactionIndex) {
        oppositeLeafHash = hashes[z];
        masterHash = depthHash;
        proof.push(hashes[z + 1]);
      }

      // push proof up
      if (hashes[z] === masterHash) {
        proof.push(hashes[z + 1]);
        masterHash = depthHash;

        if (z < hashes.length) {
          leftish = true;
        }
      }

      // push proof up
      if (hashes[z + 1] === masterHash) {
        proof.push(hashes[z]);
        masterHash = depthHash;
      }

      // push master hash
      swap.push(depthHash);
    }

    // switch places to next height
    hashes = swap;
    swap = []; // clear swap

     // shim 1 to zero (stop), i.e. top height end..
    if (hashes.length < 2) {
      // Hashes length
      break;
    }
  }

  this.leftish = leftish;
  this.oppositeLeafHash = oppositeLeafHash;
  this.proof = proof;
  this.transactionHash = this.proof[0] || null;
  this.types = [
    'bytes32',
    'bytes32[]',
  ];
  this.values = [this.oppositeLeafHash, this.proof];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}
*/

function TransactionMerkleProof({ transactionLeafs, transactionIndex }) {
  // Enforce Object
  assertNew(this, TransactionMerkleProof);

  // Enforce
  TypeArray(transactionLeafs);
  TypeNumber(transactionIndex);

  // Construct
  let hashes = transactionLeafs.map(leaf => leaf.hash);

  if (hashes.length % 2 > 0) {
    hashes.push(emptyBytes32);
  }

  let oppositeLeafHash = hashes[transactionIndex]; // select actual leaf hash
  let masterHash = oppositeLeafHash;
  let swap = [];
  let proof = [];
  let leftish = false;

  // Merklization Routine (inefficient)
  for (var i = 0; hashes.length > 0; i++) { // depth
    // if its uneven, pad with zero hash
    if (hashes.length % 2 > 0) {
      hashes.push(emptyBytes32);
    }

    for (var z = 0; z < hashes.length; z += 2) { // do hashes (2 hashes together)
      // depth hash
      let depthHash = utils.keccak256(hashes[z]
          + hashes[z + 1].slice(2));

      // push proof up
      if (hashes[z] === masterHash) {
        proof.push(hashes[z + 1]);
        masterHash = depthHash;

        if (z < hashes.length) {
          leftish = true;
        }
      }

      // push proof up rightish
      if (hashes[z + 1] === masterHash) {
        proof.push(hashes[z]);
        masterHash = depthHash;
      }

      // push master hash
      swap.push(depthHash);
    }

    // switch places to next height
    hashes = swap;
    swap = []; // clear swap

     // shim 1 to zero (stop), i.e. top height end..
    if (hashes.length < 2) {
      // Hashes length
      break;
    }
  }

  this.leftish = leftish;
  this.oppositeLeafHash = oppositeLeafHash;
  this.proof = proof;
  this.transactionHash = this.proof[0] || null;
  this.types = [
    'bytes32',
    'bytes32[]',
  ];
  this.values = [this.oppositeLeafHash, this.proof];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Empty Proof
function EmptyProof() {
  // Enforce Object
  assertNew(this, EmptyProof);

  this.values = '0x';
  this.encoded = '0x';
  this.length = 0;
}

// Hex fill proof
function FillProof(data) {
  // Enforce Object
  assertNew(this, FillProof);
  TypeHex(data);

  this.values = data;
  this.encoded = data;
  this.hash = utils.keccak256(this.encoded);
  this.length = utils.hexDataLength(this.encoded);
}

// Block Transaction Encoding
function BlockTransactions(transactionLeafs) {
  // Enforce Object
  assertNew(this, BlockTransactions);
  TypeArray(transactionLeafs);

  // Construct Block Transactions
  this.values = transactionLeafs;
  this.leafs = transactionLeafs;
  this.encoded = encodeProofs(transactionLeafs);
  this.hash = utils.keccak256(this.encoded);
  if (this.encoded === '0x0') throw new Error('invalid hex 0x0');

  // Length
  this.length = utils.hexDataLength(this.encoded);

  // Merkle Proof
  this.merkleProof = transactionIndex => new TransactionMerkleProof({
    transactionLeafs: this.leafs,
    transactionIndex,
  });
  this.get = transactionIndex => {
    if (transactionIndex >= this.leafs.length) {
      return new EmptyTransactionLeaf(0);
    } else {
      return this.leafs[transactionIndex]
    }
  };
  this.rightMostIndex = () => this.leafs.length % 2 > 0 ? this.leafs.length : this.leafs.length - 1;
  this.rightMost = () => this.leafs[rightMostIndex()];

  // check for empty transactions case
  if (this.length !== 0) {
    this.merkleTreeRoot = () => constructMerkleTreeRoot(transactionLeafs);
  } else {
    this.merkleTreeRoot = () => emptyBytes32;
  }
}

// Malformed Block Fraud Proofs Lengths Proof
function BlockFraudProofLengths(values) {
  assertNew(this, BlockFraudProofLengths);
  this.types = [
    'uint16', // - blockHeaderlength [32 bytes] -- padded uint16
    'uint16', // - transactionRootHeaderLength [32 bytes] -- padded uint16
    'uint16', // - transactionsLength [32 bytes] -- padded uint16
  ];
  this.values = values;
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function BytesEncode(proof) {
  assertNew(this, BytesEncode);
  this.encoded = abi.encode(['bytes'], [proof.encoded]);
  this.length = utils.hexDataLength(this.encoded);
}

// Block Fraud Proof Construction
function BlockFraudProof({ block, root, transactions }) {
  assertNew(this, BlockFraudProof);

  // Type Enforcement
  TypeInstance(block, BlockHeader);
  TypeInstance(root, TransactionRootHeader);
  TypeObject(transactions);
  // TypeInstance(transactions, BlockTransactions);

  const transactionsProof = new BytesEncode(transactions)

  // Construct Fraud Proof
  this.block = block;
  this.root = root;
  this.transactions = transactions;
  this.lengths = new BlockFraudProofLengths([
    this.block.length,
    this.root.length,
    transactionsProof.length,
  ]);

  // include everythign
  this.encoded = encodeProofs([this.lengths, this.block, this.root, transactionsProof]);
  this.length = utils.hexDataLength(this.encoded);
}

// Proof Type
function ProofType(proofType) {
  assertNew(this, ProofType);
  // Enforce Types
  TypeString(proofType);
  if (typeof FuelProofTypes[proofType] === 'undefined') { throw new Error('Invalid Type'); }

  // Construct Proof Types
  this.types = [
    'uint8', // proof type
  ];
  this.values = [FuelProofTypes[proofType]];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Malformed Block Proof
function MalformedBlockProof(invalidBlockProof) {
  assertNew(this, MalformedBlockProof);
  // Enforce Types
  TypeInstance(invalidBlockProof, BlockFraudProof);

  // Construct Proof
  this.type = new ProofType('malformedBlock');
  this.proof = invalidBlockProof;

  this.encoded = encodeProofs([this.type, this.proof]);
  this.length = utils.hexDataLength(this.encoded);
}

// Malformed Transaction Proof
function MalformedTransactionProof(transactionProof) {
  assertNew(this, MalformedTransactionProof);
  // Enforce Types
  TypeInstance(transactionProof, TransactionProof);

  // Construct Proof
  this.type = new ProofType('malformedTransaction');
  this.proof = transactionProof;

  this.encoded = encodeProofs([this.type, this.proof]);
  this.length = utils.hexDataLength(this.encoded);
}

function InvalidTransactionProof(transactionProof) {
  assertNew(this, InvalidTransactionProof);
  // Enforce Types
  TypeInstance(transactionProof, TransactionProof);

  // Construct Proof
  this.type = new ProofType('invalidTransaction');
  this.proof = transactionProof;

  this.encoded = encodeProofs([this.type, this.proof]);
  this.length = utils.hexDataLength(this.encoded);
}

function InvalidTransactionInputProof(transactionProofA, transactionProofB) {
  assertNew(this, InvalidTransactionInputProof);
  // Enforce Types
  TypeInstance(transactionProofA, TransactionProof);
  TypeInstance(transactionProofB, TransactionProof);

  // Construct Proof
  this.type = new ProofType('invalidTransactionInput');
  this.proofA = transactionProofA;
  this.proofB = transactionProofB;

  this.encoded = encodeProofs([this.type, this.proofA, this.proofB]);
  this.length = utils.hexDataLength(this.encoded);
}

function InvalidTransactionDoubleSpendProof(transactionProofA, transactionProofB) {
  assertNew(this, InvalidTransactionDoubleSpendProof);
  // Enforce Types
  TypeInstance(transactionProofA, TransactionProof);
  TypeInstance(transactionProofB, TransactionProof);

  // Construct Proof
  this.type = new ProofType('invalidTransactionDoubleSpend');
  this.proofA = transactionProofA;
  this.proofB = transactionProofB;

  this.encoded = encodeProofs([this.type, this.proofA, this.proofB]);
  this.length = utils.hexDataLength(this.encoded);
}

// Malformed Transaction Proof
function WithdrawalProof(token) {
  assertNew(this, WithdrawalProof);
  // Enforce Types
  TypeAddress(token);

  // Construct Proof Types
  this.types = [
    'address', // proof type
  ];
  this.values = [token];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Malformed Transaction Proof
function SummingProof(token) {
  assertNew(this, SummingProof);
  // Enforce Types
  TypeAddress(token);

  // Construct Proof Types
  this.types = [
    'address', // proof type
  ];
  this.values = [token];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

function DepositProof({ account, token, ethereumBlockNumber }) {
  assertNew(this, DepositProof);
  // Enforce Types
  TypeAddress(account);
  TypeAddress(token);
  TypeBigNumber(ethereumBlockNumber);

  // Properties
  this.account = account;
  this.token = token;
  this.ethereumBlockNumber = ethereumBlockNumber;

  // Construct Proof Types
  this.types = [
    'address', // proof type
    'address', // proof type
    'uint256', // proof type
  ];
  this.values = [account, token, ethereumBlockNumber];
  this.encoded = abi.encode(this.types, this.values);
  this.length = utils.hexDataLength(this.encoded);
}

// Malformed Transaction Proof
function UserWithdrawalProof(transactionProof) {
  assertNew(this, UserWithdrawalProof);
  // Enforce Types
  TypeInstance(transactionProof, TransactionProof);

  // Construct Proof
  this.type = new ProofType('userWithdrawal');
  this.proof = transactionProof;

  this.encoded = encodeProofs([this.type, this.proof]);
  this.length = utils.hexDataLength(this.encoded);
}

// Malformed Transaction Proof
function BondWithdrawalProof(blockHeader) {
  assertNew(this, BondWithdrawalProof);
  // Enforce Types
  TypeInstance(blockHeader, BlockHeader);

  // Construct Proof
  this.type = new ProofType('bondWithdrawal');
  this.proof = blockHeader;

  this.encoded = encodeProofs([this.type, this.proof]);
  this.length = utils.hexDataLength(this.encoded);
}

// Genesis Block
function GenesisBlock() {
  // Construct Genesis Block Header
  return new BlockHeader({
    producer: emptyAddress, // - blockProducer [32 bytes] -- padded address
    previousBlockHash: emptyBytes32, // - previousBlockHash [32 bytes]
    blockHeight: big(0), //- blockHeight [32 bytes]
    ethereumBlockNumber: big(0), // - ethereumBlockNumber [32 bytes]
    transactionRoots: [], // - transactionRoots [64 + dynamic bytes]
  });
}

const reduceTokenID = tokenID => big(tokenID.toNumber());

// get Requests..
const getRequests = (db, limit = 7) => new Promise((resolve, reject) => {
  let items = [];
  const readSteam = db.createReadStream();

  // Go through stream..
  (readSteam.then ? readSteam : Promise.resolve(readSteam))
  .then((stream) => {
    stream
    .on('error', err => reject(err))
    .on('data', row => {
      if (items.length >= limit) {
        resolve(items);
        readSteam.destroy();
        return;
      }

      // If data is an address, get it some tokens!
      if (utils.hexDataLength(row.value, 20)) {
        items.push({ ip: row.key.slice(2), key: row.key, address: row.value }); // slice IP away
      }
    })
    .on('end', () => {
      resolve(items);
    });
  })
  .catch(reject);
});

// get outputs
const getSpendableInputs = (db, limit = 7) => new Promise((resolve, reject) => {
  let items = [];
  const readSteam = db.createReadStream();

  (readSteam.then ? readSteam : Promise.resolve(readSteam))
  .then((stream) => {
    stream
    .on('error', err => reject(err))
    .on('data', row => {
      if (items.length >= limit) {
        resolve(items);
        return;
      }
      items.push(row);
    })
    .on('end', () => {
      resolve(items);
    });
  })
  .catch(reject);
});

// Empty Logger Method
function EmptyLogger() {
  assertNew(this, EmptyLogger);
  this.log = () => {};
  this.time = () => {};
  this.timeEnd = () => {};
  this.error = () => {};
}

// Last Ethereum block processed.
async function lastEthereumBlockProcessed(opts = {}) {
  try {
    TypeObject(opts);
    TypeObject(opts.db);

    // get last block processes
    const ethereumBlockProcessed = await opts.db.get(interfaces.FuelDBKeys.ethereumBlockProcessed);

    // If no log, return null..
    if (!ethereumBlockProcessed) { return null; }

    // If there is a from block saved
    return _utils.big(ethereumBlockProcessed);
  } catch (error) {
    throw new ByPassError(error);
  }
}

// Get Genesis Log of a Fuel Contract
async function genesisLog(opts = {}) {
  try {
    TypeObject(opts);
    TypeObject(opts.contract);
    TypeFunction(opts.rpc);

    // Genesis Log
    const genesisLog = (await opts.rpc('eth_getLogs', {
      address: opts.contract.address,
      fromBlock: '0x0',
      toBlock: 'latest',
      topics: interfaces.FuelEventsInterface.events.BlockCommitted.encodeTopics([
        null, 0, 0,
      ]),
    })).pop();

    if (!genesisLog) {
      throw new ByPassError('No genesis log found for this Fuel contract.');
    }

    // Format return log block number...
    const returnLog = Object.assign({}, genesisLog, {
      blockNumber: _utils.big(genesisLog.blockNumber)
    });

    // block height
    return returnLog;
  } catch (error) {
    throw new ByPassError(error);
  }
}

// get Latest published fraud log
async function latestFraudLog(opts = {}) {
  try {
    TypeObject(opts);
    TypeObject(opts.contract);
    TypeFunction(opts.rpc);

    // Last Fraud Block
    const lastFraudBlockProcessed = await opts.db.get(interfaces.FuelDBKeys.lastEthereumFraudBlock);

    // Covert last procssed fraud block to _utils.big num
    if (lastFraudBlockProcessed) {
      // set last fraud block
      lastEthereumFraudBlock = _utils.big(_utils.RLP.decode(lastFraudBlockProcessed));
    }

    // Get lastest fraud block it knows about
    if (!lastFraudBlockProcessed) {
      // Get fraud logs on boot
      const latestFraudLog = (await opts.rpc('eth_getLogs', {
        address: opts.contract.address,
        fromBlock: '0x0',
        toBlock: 'latest',
        topics: [ interfaces.FuelEventsInterface
            .events.FraudCommitted.topic ],
      }) || []).pop();

      // Return latest fraud log
      return latestFraudLog ? Object.assign({}, latestFraudLog, {
        blockNumber: _utils.big(latestFraudLog.blockNumber),
      }) : null;
    }

    // Null if nothing..
    return null;
  } catch (error) {
    throw new ByPassError(error);
  }
}

// Get Mempool Transactions
const getMempoolTransactions = (db, limit = 10000) => new Promise((resolve, reject) => {
  let transactions = [];
  let reads = [];
  let oldestTransactionAge = 0;
  const readSteam = db.createReadStream();
  (readSteam.then ? readSteam : Promise.resolve(readSteam))
  .then((stream) => {
    stream
    .on('error', err => reject(err))
    .on('data', (data) => {
      if (data.key !== interfaces.FuelDBKeys.commitment) {
        // Decode entry, get age,
        const val = _utils.RLP.decode(data.value);
        const transactionAge = parseInt(val[5], 16);
        reads = reads.concat(val[6]);

        // Reset oldest age
        if (transactionAge < oldestTransactionAge || oldestTransactionAge === 0) {
          oldestTransactionAge = transactionAge;
        }

        // Add to hashes array
          transactions.push({
            key: data.key,
            value: val,
          });

        // Readable pause
        if (transactions.length >= limit) {
          readable.pause();
          resolve({ mempoolTransactions: transactions, oldestTransactionAge, reads });
        }
      }
    })
    .on('end', () => {
      resolve({ mempoolTransactions: transactions, oldestTransactionAge, reads });
    });
  })
  .catch(reject);
});

// Organize mempool transactions into root blocks
function mempoolToRoots(proposedTip, submissionProducer, mempoolTransactions, checkUTXOs) {
  types.TypeBigNumber(proposedTip);
  types.TypeAddress(submissionProducer);
  types.TypeArray(mempoolTransactions);
  types.TypeArray(checkUTXOs);

  // Define alterable variables
  let placement = {}; // transactionHashId => { transactionRootIndex, transactionIndex },
  let roots = { '0': [], }; // root index => root array []
  let numRoots = 1;
  let transactionRootIndex = 0;
  let currentRootSize = 0;
  let transactionIndex = 0;
  let resultRoots = [];

  // Placement of Transactions Across Roots
  for (var mempoolIndex = 0; mempoolIndex < mempoolTransactions.length; mempoolIndex++) {

    // Mempool Transaction
    const mempoolTransactionHashKey = mempoolTransactions[mempoolIndex].key;
    const mempoolTransaction = mempoolTransactions[mempoolIndex].value;

    // Transaction Hash
    const transactionHash = mempoolTransaction[0];
    const unsignedTransaction = new FillProof(mempoolTransaction[1]);
    const witnesses = mempoolTransaction[2];
    const metadata = mempoolTransaction[3];

    // Estimated Size
    const estimatedSize = mempoolTransaction[1].length
      + (witnesses.length * interfaces.FuelConstants.WitnessSize)
      + (metadata.length * interfaces.FuelConstants.MetadataSize);

    // Root size + estimated size, than create a new root
    if ((currentRootSize + estimatedSize) >= interfaces.FuelConstants.MAX_TRANSACTIONS_SIZE) {
      transactionRootIndex += 1;
      currentRootSize = 0;
      transactionIndex = 0;
      numRoots += 1;
      roots[transactionRootIndex] = [];
    }

    // placement map this tx hash
    placement[transactionHash] = {
      transactionRootIndex,
      transactionIndex,
    };

    // Process Into Leaf
    roots[transactionRootIndex][transactionIndex] = transactionPlacement => ({
      unsignedTransaction,
      metadata: metadata.map(data => {
        if (data.length === 3) {
          const transactionHashId = data[0];
          const outputIndex = data[1];
          const utxoId = data[2];
          const utxoDB = checkUTXOs[interfaces.FuelDBKeys.UTXO + utxoId.slice(2)] || null;
          let utxo_blockNum = proposedTip;
          let utxo_rootIndex = null;
          let utxo_txIndex = null;

          // If this is no longer a mempool tx, we than use the db version
          if (utxoDB !== null) {
            const decodeUTXO = _utils.RLP.decode(utxoDB);
            utxo_blockNum = _utils.big(decodeUTXO[1]); // 2 is block hash..
            utxo_rootIndex = _utils.big(decodeUTXO[3]);
            utxo_txIndex = _utils.big(decodeUTXO[4]);
          } else {
            utxo_rootIndex = _utils.big(transactionPlacement[transactionHashId].transactionRootIndex);
            utxo_txIndex = _utils.big(transactionPlacement[transactionHashId].transactionRootIndex);
          }

          return new TransactionMetadata({ // tx referenced in current block..
            blockHeight: utxo_blockNum,
            transactionRootIndex: utxo_rootIndex,
            transactionIndex: utxo_txIndex,
            outputIndex: _utils.big(outputIndex),
          });
        } else {
          return new TransactionMetadata({ // already finalized tx
            blockHeight: _utils.big(data[0]),
            transactionRootIndex: _utils.big(data[1]),
            transactionIndex: _utils.big(data[2]),
            outputIndex: _utils.big(data[3]),
          });
        }
      }),
      witnesses: witnesses.map(signature => new TransactionWitness({
        v: signature[0],
        r: signature[1],
        s: signature[2],
      })),
    });

    // Increase Data
    transactionIndex += 1;
    currentRootSize += estimatedSize;
  }

  // deploy roots
  for (var rootIndex = 0; rootIndex < numRoots; rootIndex++) {
    // Resolve all Metadata across the various placements
    const leafs = roots[rootIndex]
    .map(produceTransaction => {
      const txData = produceTransaction(placement);
      return new TransactionLeaf(txData);
    });
    const transactions = new BlockTransactions(leafs);

    resultRoots[rootIndex] = {
      header: new TransactionRootHeader({
        producer: submissionProducer,
        merkleTreeRoot: transactions.merkleTreeRoot(),
        commitmentHash: transactions.hash,
        index: _utils.big(rootIndex),
      }),
      transactions,
    };
  }

  // Result Roots
  return resultRoots;
}

/*
const BlockHeader = struct([
  ['producer', 'address'],
  ['previousBlockHash', 'uint256'],
  ['blockHeight', 'uint256'],
  ['ethereumBlockNumber', 'uint256'],
  ['transactionRoots', 'bytes32[]'],
], [
  ['someTopic', 'address'] // this is extra data
]);

const block = new BlockHeader(addr, keccak256('0x1'), 2, 4, [keccak256('0x1')]);
block.rlp() // encode
block.encode() // encoded
block.encodePacked() // encode packed
block.values() // values array
block.properties.producer;
block.properties.previousBlockHash;
block.properties.blockHeight;
block.properties.ethereumBlockNumber;
block.properties.transactionRoots;
const _block = BlockHeader(...block.values()); // decode from array of values..
const _block = BlockHeader.decodeRLP(...); // decode rlp
const _block = BlockHeader.decode(...); // decode encoded
const _block = BlockHeader.decodePacked(...); // decode packed data into block header..
*/

function commitmentStruct(rlp) {
  if (rlp !== null) { types.TypeHex(rlp); }

  const decoded = rlp !== null ? _utils.RLP.decode(rlp) : [_utils.big(0).toHexString(), [], [], [], _utils.big(_utils.unixtime()).toHexString(), '0x0', '0x0'];
  return {
    blockHeight: _utils.big(decoded[5]).eq(0) ? _utils.big(-1) : _utils.big(decoded[0]),
    roots: decoded[1].reduce((acc, v, i) => Object.assign(acc, {
      [v]: decoded[2][i] === '0x1' ? true : false,
    }), {}),
    transactionHashes: decoded[3],
    age: _utils.big(decoded[4]).toNumber(),
    transactionHash: _utils.big(decoded[6] || '0x0').eq(0) ? null : decoded[6],
  };
}

function commitmentRLP(obj) {
  types.TypeObject(obj);
  types.TypeBigNumber(obj.blockHeight);
  types.TypeArray(obj.transactionHashes);
  types.TypeObject(obj.roots);
  types.TypeNumber(obj.age);
  const rootKeys = Object.keys(obj.roots);

  return _utils.RLP.encode([
    obj.blockHeight.eq(-1) ? _utils.big(0) : obj.blockHeight, // block height
    rootKeys, // keys
    rootKeys.map(key => obj.roots[key] ? '0x1' : '0x0'), // values
    obj.transactionHashes, // tx hashes
    _utils.big(obj.age).toHexString(),
    obj.blockHeight.eq(-1) ? '0x0' : '0x1', // store negative
    obj.transactionHash || '0x0',
  ]);
}

module.exports = {
  // Commitment
  commitmentStruct,
  commitmentRLP,

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

  // Utility Methods (To be organized)
  encodeSignature,
  decodeSignature,
  constructWitness,
  ecrecoverPacked,
  constructDepositHashID,
  constructWithdrawalHashID,
  serializeRLP,
  constructMerkleTreeRoot,
  reduceTokenID,

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
  assertNew,

  getRequests,
  getSpendableInputs,
  EmptyLogger,

  lastEthereumBlockProcessed,
  genesisLog,
  latestFraudLog,

  getMempoolTransactions,
  mempoolToRoots,

  decodeUTXORLP,
  decodeDepositRLP,
};
