// Core Modules
const ganache = require("ganache-core"); // genache is a dumb name..
const { utils, ContractFactory, Wallet, Contract, providers } = require('ethers');
const EthRPC = require('ethjs-rpc');

// Bytecode
const { bytecode } = require('../contracts/Fuel.js');
const utility = require('../contracts/FuelUtility.js');

// Fuel Related Methods
const {
    // Interfaces
    FuelInterface,
    FuelUtilityInterface,
    FuelParams,
    Fuel,

    // Low Level
    big,

    // Structs / Proofs
    GenesisBlock,
    BlockTransactions,
    TransactionRootHeader,
    BlockFraudProof,
    BlockHeader,
    MalformedBlockProof,
    BondWithdrawalProof,
    DepositProof,
    EmptyProof,
    UTXOProof,
    ByPassError,
    FillProof,
    TransactionUnsigned,
    ecrecoverPacked,

    TransactionMetadata,
    TransactionInputUTXO, TransactionInputHTLC, TransactionInputChange, TransactionInputDeposit,
    TransactionOutputUTXO, TransactionOutputHTLC, TransactionOutputChange, TransactionOutputWithdrawal,

    TransactionLeaf,
    TransactionWitness,
    EmptyTransactionLeaf,
    MalformedTransactionProof,
    TransactionProof,
    TransactionMerkleProof,
    TransactionData,
    OverflowingTransactionMerkleProof,
    TransactionProofs,
    InvalidTransactionProof,
    InvalidTransactionInputProof,
    InvalidTransactionDoubleSpendProof,
    UserWithdrawalProof,
    WithdrawalProof,
    SummingProof,
    FuelInputTypes,

    // Construction
    constructDepositHashID,
    constructWitness,
    emptyAddress,
    emptyBytes32,

    // Types
    TypeHex,
    TypeAddress,
    TypeNumber,
    TypeDefined,
    TypeArray,
    FuelConstants,
    TypeObject,
    TypeBigNumber,
    TypeString,
    TypeFunction,
    MemoryDB,
  } = require('../lib');

/*
const leafs = new BlockTransactions(new Array(35000).fill(0).map(v => new FillProof('0xa2f349d333d8097ffaa0109847dbde83c08e01cbbd3758ad4eb9a194b56d475da2f349d333d8097ffaa0109847dbde83c08e01cbbd3758ad4eb9a194b56d475d')));

console.time('Merklization');
console.log(leafs.merkleTreeRoot());
console.timeEnd('Merklization');
*/

const LevelUpDB = require('../dbs/levelupdb.js');
const CacheDB = require('../dbs/cachedb.js');
const SimulationDB = require('../dbs/SimulationDB');

// DB 2
async function test() {
  const db1 = new LevelUpDB();
  let parallelWrites = [];
  console.time('LevelUpDB: 71000 Writes Parallel');
  for (var i = 0; i < 71000; i++) {
    parallelWrites.push(db1.put('deposit_' + i, utils.hexlify(utils.randomBytes(120))));
  }
  await Promise.all(parallelWrites);
  console.timeEnd('LevelUpDB: 71000 Writes Parallel');

  let batchWrites = [];
  console.time('LevelUpDB: 71000 Writes Bulk Parallel');
  for (var i = 0; i < 71000; i++) {
    batchWrites.push({ type: 'put', key: 'deposit_' + i, value: utils.hexlify(utils.randomBytes(120)) });
  }
  await db1.batch(batchWrites);
  console.timeEnd('LevelUpDB: 71000 Writes Bulk Parallel');

  let parallelReads = [];

  console.time('LevelUpDB: 71000 Reads Parallel');
  for (var i = 0; i < 71000; i++) {
    parallelReads.push(db1.get('deposit_' + i));
  }
  await Promise.all(parallelReads);
  console.timeEnd('LevelUpDB: 71000 Reads Parallel');



  const db2 = new MemoryDB();
  let parallelWrites2 = [];
  console.time('MemoryDB: 71000 Writes Parallel');
  for (var i = 0; i < 71000; i++) {
    parallelWrites2.push(db2.put('deposit_' + i, utils.hexlify(utils.randomBytes(120))));
  }
  await Promise.all(parallelWrites2);
  console.log(`MemoryDB: wrote ${Object.keys(db2.storage).length} records`);
  console.timeEnd('MemoryDB: 71000 Writes Parallel');

  let parallelReads2 = [];
  console.time('MemoryDB: 71000 Reads Parallel');
  for (var i = 0; i < 71000; i++) {
    parallelReads2.push(db2.get('deposit_' + i));
  }
  await Promise.all(parallelReads2);
  console.timeEnd('MemoryDB: 71000 Reads Parallel');


  // Level / Mem
  const db5 = new SimulationDB({ cache: new MemoryDB(), storage: db1 });
  let parallelWrites5 = [];
  console.time('SimulationDB: 71000 Writes Parallel');
  for (var i = 0; i < 71000; i++) {
    parallelWrites5.push(db5.put('deposit_' + i, utils.hexlify(utils.randomBytes(120))));
  }
  await Promise.all(parallelWrites5);
  console.log(`SimulationDB: wrote ${Object.keys(db2.storage).length} records`);
  console.timeEnd('SimulationDB: 71000 Writes Parallel');

  let parallelReads5 = [];
  console.time('SimulationDB: 71000 Reads Parallel');
  for (var i = 0; i < 71000; i++) {
    parallelReads5.push(db5.get('deposit_' + i));
  }
  await Promise.all(parallelReads5);
  console.timeEnd('SimulationDB: 71000 Reads Parallel');
  console.time('SimulationDB: 71000 Writes Batch');
  await db1.batch(db5.opts);
  console.timeEnd('SimulationDB: 71000 Writes Batch');
}

test();
