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
} = require('./utils/utils');

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
} = require('./interfaces/interfaces');

const {
  ByPassError,
  ProofError,
  FuelError,
  FraudError,
  TypeError,
  assertOrFraud,
} = require('./errors/errors');

const {
  TypeDB,
  TypeProvider,
  TypeFunction,
  TypeRPC,
  TypeArray, TypeInstance,
  TypeString, TypeDefined,
  TypeNumber, TypeBoolean, TypeAddress,
  TypeHex, TypeBigNumber, TypeObject,
} = require('./types/types');

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
} = require('./structs/structs');

const { parseTransactions } = require('./blocks/parseTransactions');

const MemoryDB = require('./dbs/MemoryDB');

const {
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
} = require('./blocks/processBlock');

const { intakeTransaction } = require('./transactions/intakeTransaction');
const mysqlIntakeTransaction = intakeTransaction;

const { sync } = require('./nodes/sync');

// Export modules
module.exports = {
  FuelError,
  TypeError,
  parseTransactions,
  TypeString,
  TypeDB,
  TypeNumber,
  TypeBigNumber,
  TypeAddress,
  TypeHex,
  TypeArray,
  TypeObject,
  TypeDefined,
  TypeFunction,

  ByPassError,
  big,
  emptyAddress,
  emptyBytes32,

  FuelFraudCodes,
  FuelErrorCodes,
  FuelConstants,
  UTXOProof,

  // Strucs
  GenesisBlock,
  BlockTransactions,
  TransactionRootHeader,
  BlockFraudProof,
  BlockHeader,
  MalformedBlockProof,
  MalformedTransactionProof,
  UserWithdrawalProof,
  TransactionProofs,
  BondWithdrawalProof,
  EmptyProof,
  FillProof,
  TransactionUnsigned,
  TransactionInputDeposit,
  TransactionOutputUTXO,
  TransactionLeaf,
  TransactionWitness,
  RealEmptyTransactionLeaf,
  TransactionMetadata,
  EmptyTransactionLeaf,
  OverflowingTransactionMerkleProof,
  TransactionInputUTXO,
  FuelInputTypes,
  FuelOutputTypes,

  TransactionOutputChange,
  TransactionOutputHTLC,
  TransactionOutputWithdrawal,
  WithdrawalProof,
  SummingProof,
  DepositProof,

  TransactionInputHTLC,
  TransactionInputChange,

  MalformedTransactionProof,
  TransactionProof,
  TransactionMerkleProof,
  InvalidTransactionProof,
  InvalidTransactionInputProof,
  InvalidTransactionDoubleSpendProof,
  TransactionData,
  MemoryDB,
  sync,
  ecrecoverPacked,
  FuelDBKeys,
  mysqlIntakeTransaction,

  // Interfaces
  ERC20Interface,
  FuelUtilityInterface,
  FuelInterface,

  // Structures
  GenesisBlock,
  TransactionRootHeader,
  FuelProofTypes,

  // Construction
  constructDepositHashID,
  constructWitness,
  constructWithdrawalHashID,

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
