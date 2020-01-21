// Core Modules
const ganache = require("ganache-core"); // genache is a dumb name..
const { utils, ContractFactory, Contract, providers } = require('ethers');
const ethers = require('ethers');
const EthRPC = require('ethjs-rpc');
const HttpProvider = require('ethjs-provider-http');
const bytecode = require('../contracts/Fuel.code.js');
const utility = require('../contracts/FuelUtility.code.js');
const _utils = require('../utils/utils');
const { test } = require('zora');
const MemoryDB = require('../dbs/MemoryDB');
const Wallet = require('../wallet/wallet');
const post = require('../wallet/post');
const interfaces = require('../interfaces/interfaces');

// Fuel Related Methods
const {
    // Interfaces
    FuelInterface,
    FuelUtilityInterface,
    Fuel,

    // Low Level
    big,
    ethereumBlockNumber,

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
    FuelDBKeys,
    mysqlIntakeTransaction,

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
    TypeDB,
    FuelOutputTypes,
  } = require('../lib');

// Generate Deterministic Test Accounts
const accounts = [
  new utils.SigningKey('0xf72e1c49ef6662accff15221f2581defd6522248e0aad76b4391bf1140a9dd36'),
  new utils.SigningKey('0x6ffd1ce2688b802196b6f8aac601c1e00cd94fd8aab8d64a25c13d3a115e5652'),
  new utils.SigningKey('0xa2f349d333d8097ffaa0109847dbde83c08e01cbbd3758ad4eb9a194b56d475d'),
  new utils.SigningKey('0x1c9bbaad098c769b09c81917430e819a917e6d521fbdc2e54adf128d745c2327'),
  new utils.SigningKey('0xdccea3f8285d22bc27f01e6e67f89960560ac58998996af92a80f852d7b6311c'),
];

// Main acocunt
const address = accounts[0].address;
const providerServer = process.env.providerServer;

if (providerServer) {
  console.log('Using provider server');
}

const providerConfig = {
  accounts: accounts.map(account => ({
    balance: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    secretKey: account.privateKey,
  })),
  allowUnlimitedContractSize: true,
  vmErrorsOnRPCResponse: true,
  gasLimit: '0x1fffffffffffff',
  debug: false,
  logger: { log: () => {} },
  callGasLimit: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
};

// Provider
const provider = providerServer
  ? new HttpProvider('http://localhost:3000')
  : ganache.provider(providerConfig);

// Wallets
const wallets = [
  new ethers.Wallet(accounts[0].privateKey, new providers.Web3Provider(provider)),
  new ethers.Wallet(accounts[1].privateKey, new providers.Web3Provider(provider)),
  new ethers.Wallet(accounts[2].privateKey, new providers.Web3Provider(provider)),
  new ethers.Wallet(accounts[3].privateKey, new providers.Web3Provider(provider)),
  new ethers.Wallet(accounts[4].privateKey, new providers.Web3Provider(provider)),
];

// Load the wallet to deploy the contract with
const wallet = new ethers.Wallet(accounts[0].privateKey, new providers.Web3Provider(provider));

// Build raw object
const eth = new EthRPC(provider);

// RPC call
const rpc = (method, ...args) => new Promise((resolve, reject) => eth
  .sendAsync({ method, params: args }, (err, result) => {
  if (err) return reject(err);
  if (result) return resolve(result);
}));

// A send transaction method for testing
const sendTransaction = async params => {
  try {
    // check params type
    TypeObject(params);

    // data parsig
    let data = params.data || '0x00';
    const value = params.value || big('0x00');

    // check types
    if (typeof params.from !== 'number') {
      TypeHex(params.from, 20);
    }
    TypeHex(data);
    TypeBigNumber(value);

    // parse params and get nonce and gas price
    const from = typeof params.from === 'number' ? (await rpc('eth_accounts'))[params.from] : params.from;
    const to = typeof params.to === 'number' ? (await rpc('eth_accounts'))[params.from] : params.to;
    const nonce = (await rpc('eth_getTransactionCount', from));
    const block = (await rpc('eth_getBlockByNumber', 'latest', false));
    const gas = params.gas || big(block.gasLimit);

    // method for encoding / decoding
    let method = null;

    // check gas type
    TypeBigNumber(gas);

    // Handle custom solidity work
    if (typeof params.solidity !== 'undefined') {
      TypeString(params.solidity);

      const solidity = new utils.Interface([params.solidity]);
      const getMethodName = Object.keys(solidity.functions)[0];
      method = solidity.functions[getMethodName];

      // Enforce type array
      TypeArray(params.params);

      // handle constructor
      if (solidity.abi[0].type === 'constructor') {
        data = solidity.deployFunction.encode(params.data, params.params);
      } else {
        // handle data
        data = method.encode(params.params);
      }
    }

    // send transaction
    const transactionHash = await rpc('eth_sendTransaction', {
      nonce,
      from,
      gas: gas.toHexString(),
      to,
      value: value.toHexString(),
      data,
    });

    // get receipt
    const receipt = await rpc('eth_getTransactionReceipt', transactionHash);

    // return the receipt
    return receipt;
  } catch (error) {
    throw new ByPassError(error);
  }
};

// Deploy Fuel Contract
const constructFuel = async (producerAddress, accountIndex, params) => {
  try {
    // Type Enforcement
    TypeAddress(producerAddress);
    if (typeof accountIndex !== 'undefined') { TypeNumber(accountIndex); }
    if (typeof params !== 'undefined') { TypeObject(accountIndex); }

    // Deployment Transaction
    const receipt = await sendTransaction(Object.assign(params || {}, {
      from: (params || {}).from || accountIndex || 0,
      data: bytecode,
      solidity: 'constructor(address) public',
      params: [producerAddress],
    }));

    // We connect to the Contract using a Provider, so we will only
    // have read-only access to the Contract
    const contract = new Contract(receipt.contractAddress, FuelInterface.abi, new providers.Web3Provider(provider));

    // Create a new instance of the Contract with a Signer, which allows
    return { contract: contract.connect(wallets[accountIndex || 0]), blockNumber: big(receipt.blockNumber), receipt };
  } catch (error) {
    throw new ByPassError(error);
  }
};

// Deploy Fuel Contract
const constructUtility = async (totalSupply, accountIndex, params) => {
  try {
    // Enforce Types
    TypeBigNumber(totalSupply);

    // Weak Type Enforcement
    if (typeof accountIndex !== 'undefined') { TypeNumber(accountIndex); }
    if (typeof params !== 'undefined') { TypeObject(accountIndex); }

    // Deployment Transaction
    const receipt = await sendTransaction(Object.assign(params || {}, {
      from: (params || {}).from || accountIndex || 0,
      data: utility,
      solidity: 'constructor(uint256) public',
      params: [totalSupply],
    }));

    // We connect to the Contract using a Provider, so we will only
    const contract = new Contract(receipt.contractAddress, FuelUtilityInterface.abi,
        new providers.Web3Provider(provider));

    // Create a new instance of the Contract with a Signer, which allows
    return contract.connect(wallets[accountIndex || 0]);
  } catch (error) {
    throw new ByPassError(error);
  }
};

// Fuel instance
function atUtility(address, accountIndex) {
  // Type Enforcement
  TypeAddress(address);

  // Weak Enforcement
  if (typeof accountIndex !== 'undefined') { TypeNumber(accountIndex); }

  // We connect to the Contract using a Provider, so we will only
  const contract = new Contract(address, FuelUtilityInterface.abi, new providers.Web3Provider(provider));

  // Create a new instance of the Contract with a Signer, which allows
  return contract.connect(wallets[accountIndex || 0]);
}

// Fuel instance
function atFuel(address, accountIndex) {
  TypeAddress(address);
  if (typeof accountIndex !== 'undefined') { TypeNumber(accountIndex); }

  // We connect to the Contract using a Provider, so we will only
  // have read-only access to the Contract
  const contract = new Contract(address, FuelInterface.abi, new providers.Web3Provider(provider));

  // Create a new instance of the Contract with a Signer, which allows
  return contract.connect(wallets[accountIndex || 0]);
}

// Extend zora test methods
function extendTest(t) {
  const gt = (v1, v2, message) => {
    // Enfore defined
    TypeDefined(v1);
    TypeDefined(v2);

    const pass = big(v1).gt(big(v2));

    if (pass) {
      t.ok(pass, (message || ''))
    } else {
      t.fail((message || '') + ` | ${v1} should be GREATER THAN ${v2}`);
    }
  };
  const lt = (v1, v2, message) => {
    // Enfore defined
    TypeDefined(v1);
    TypeDefined(v2);

    const pass = big(v1).lt(big(v2));

    if (pass) {
      t.ok(pass, (message || ''))
    } else {
      t.fail((message || '') + ` | ${v1} should be LESS THAN ${v2}`);
    }
  };
  const gte = (v1, v2, message) => {
    // Enfore defined
    TypeDefined(v1);
    TypeDefined(v2);

    const pass = big(v1).gte(big(v2));

    if (pass) {
      t.ok(pass, (message || ''))
    } else {
      t.fail((message || '') + ` | ${v1} should be GREATER THAN OR EQUAL ${v2}`);
    }
  };
  const lte = (v1, v2, message) => {
    // Enfore defined
    TypeDefined(v1);
    TypeDefined(v2);

    const pass = big(v1).lte(big(v2));

    if (pass) {
      t.ok(pass, (message || ''))
    } else {
      t.fail((message || '') + ` | ${v1} should be LESS THAN OR EQUAL ${v2}`);
    }
  };
  const eq = (v1, v2, message) => {
    // Enfore defined
    TypeDefined(v1);
    TypeDefined(v2);

    const pass = big(v1).eq(big(v2));

    if (pass) {
      t.ok(pass, (message || ''))
    } else {
      t.fail((message || '') + ` | ${v1} should be EQUAL ${v2}`);
    }
  };
  const throws = async (promiseObject, message) => {
    // Enfore defined
    TypeDefined(promiseObject);

    try {
      await promiseObject();
      t.fail((message || '') + ` | ${v1} should have Thrown!`);
    } catch (error) {
      t.ok(1, (message || ''));
    }
  };

  const throwsFraud = async (promiseObject, fraudName, message) => {
    // Enfore defined
    TypeDefined(promiseObject);

    try {
      await promiseObject();
      t.fail((message || '') + ` | ${fraudName} should have Thrown!`);
    } catch (fraudError) {
      if (!fraudError.fraudCode) return t.fail('Invalid fuel code error');

      t.eq(fraudError.fraudCode, FuelConstants[fraudName],
          (message + `${fraudError.fraudCode} should equal ${FuelConstants[fraudName]}` || ''));
    }
  };

  const reverts = async (promiseObject, code, message, logLogs = false) => {
    // Enfore defined
    TypeDefined(promiseObject);

    let obj = null;

    try {
      obj = await promiseObject();

      eq((await getReceipt(obj.hash)).status, 0, (message || '') + ` | ${promiseObject} should have reverted!`);

      if (logLogs) {
        console.log((await getReceipt(obj.hash)).logs);
      }
    } catch (error) {
      if (typeof error.hashes === 'undefined') {
        if (logLogs && obj) {
          getReceipt(obj.hash).then(receipt => console.log(receipt.log)).catch(console.log);
        }

        t.fail((message || '') + ` | ${promiseObject} should have reverted!`);
        return;
      }

      const result = error.results[error.hashes[0]];
      const errorCode = big(result.return);

      eq(errorCode, code, (message || ''));
    }
  };

  // Basic gte
  return {
    gt,
    lt,
    gte,
    lte,
    eq,
    throws,
    throwsFraud,
    reverts,
  };
}

// Fuel Params
const params = {
  rpc,
};

// One ether
const oneEther = utils.parseEther('1');
const oneDay = 86400;
const loadsOfGas = big('10000000');

// Unixtime
function unixtime() {
  return Math.round((new Date).getTime() / 1000);
}

// Increase Block
async function increaseBlocks(amount) {
  try {
    // Enforce Types
    TypeNumber(amount);

    // EVM Mine
    for (var i = 0; i < (amount || 1); i++) {
      await rpc('evm_mine', unixtime() + 13);
    }
  } catch (error) {
    throw new ByPassError(error);
  }
}

// simple get receipt
function getReceipt(transactionHash) {
  TypeHex(transactionHash, 32);

  // get receipt
  return rpc('eth_getTransactionReceipt', transactionHash);
}

// simple get receipt
function statusSuccess(receipt) {
  TypeObject(receipt);

  // get receipt
  return big(receipt.status);
}

// Create a Single Fuel contract, with a Single Block (given leafs)
async function singleBlockSingleProofFuel(transactionLeafs, merkilize, eq, shouldPass = false) {
  try {
    // Enforce Types
    TypeArray(transactionLeafs);
    TypeFunction(eq);

    // Construct Fuel Contract
    const { contract } = await constructFuel(address);

    // Genesis Block
    const genesis = new GenesisBlock();

    //
    // Single Block Empty Transaction Root
    //

    // Transaction Leafs Encoded
    const transactions = new BlockTransactions(transactionLeafs);
    const merkleRoot = merkilize ? transactions.merkleTreeRoot() : emptyBytes32;

    // Submit Transactions
    const submit = await contract.submitTransactions(merkleRoot, transactions.encoded, {
      gasLimit: loadsOfGas,
    });
    const submitBlock = big((await getReceipt(submit.hash)).blockNumber);

    // Transaction Root Header
    const root = new TransactionRootHeader({
      producer: address, // - transactionRootCommitter [32 bytes] -- padded address
      merkleTreeRoot: merkleRoot, // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
      commitmentHash: transactions.hash, // - transactionRootCommitmentHash [32 bytes]
      index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
    });

    // Block tx roots
    eq(await contract.blockTransactionRoots(root.hash), submitBlock, 'root submitted');

    // Commit Block
    const commit = await contract.commitBlock(1, [root.hash], {
      value: await contract.BOND_SIZE(),
      gasLimit: loadsOfGas,
    });
    const commitReceipt = await getReceipt(commit.hash);

    // Commit status
    eq(commitReceipt.status, 1, 'commit status');

    // Block
    const block = new BlockHeader({
      producer: address, // - blockCommitter [32 bytes] -- padded address
      previousBlockHash: genesis.hash, // - previousBlockHash [32 bytes]
      blockHeight: big(1), //- blockHeight [32 bytes]
      ethereumBlockNumber: big(commitReceipt.blockNumber), // - ethereumBlockNumber [32 bytes]
      transactionRoots: [root.hash], // - transactionRoots [64 + dynamic bytes]
    });

    // Proof
    const proof = new MalformedBlockProof(new BlockFraudProof({
      block: block,
      root: root,
      transactions: transactions,
    }));

    // Block tip adjusted.
    eq(await contract.blockTip(), 1, 'tip check');

    // Submit Proof
    const submitProof = await contract.submitProof(proof.encoded, {
      gasLimit: loadsOfGas,
    });

    // Block tip adjusted.
    if (!shouldPass) {
      eq(await contract.blockTip(), 0, 'invalid block detected, tip set back');
    }

    const receipt = await getReceipt(submitProof.hash);

    // Return Profile
    return {
      contract,
      block,
      root,
      transactions,
      proof,
      receipt,
    };
  } catch (error) {
    throw new ByPassError(error);
  }
}

// Random Int
const randomInt = (min = 1, max = 200) => {
  TypeNumber(min);
  TypeNumber(max);

  return Math.floor(Math.random() * (+max - +min)) + +min;
};

// Create a Single Fuel contract, with a Single Block (given leafs)
// Creates a completely valid proof scenario
async function submitMalformedTransactionProof(params) {
  try {
    const {
      merkleProofOverride,
      transactionDataOverride,
      randomLengthLeafs,
      errorCode,
      fraudCode,
      witnesses,
      inputs,
      outputs,
      metadata,
      proofType,
      inputIndex,
      outputIndex,
      token,
      witnessIndex,
      witnessReference,
      summingToken,
      includeSecondWitness,
      withdrawalAccount,
      submitProofTwice,
      leafs,
      merkleProofOverflow,
      proofsOverride,
      otherCaller,
      otherRootProducer,
      includeProofs,
      eq,
      reverts,
      validMerkleRoot,
      summingTokenIsERC20,
      secondIsRightmost,
      secondInputIndex,
      secondOutputIndex,
      secondWitnessIndex,
      secondValidProof,
      secondaryMetadata,
      secondaryInputs,
      secondTransactionIsZero,
      constructInputAsSecondChange,
      constructInputAsSecondUTXO,
      constructInvalidHTLCWitness,
      constructInvalidChangeWitness,
      leafCount,
      blockIncrease,
      erc20Enabled,
      logReceipts,
      produceSecondTransactionRoot,
      secondInputIsDeposit,
      message,
      constructExpiredOutput,
      constructInputAsSecondHTLC,
      shouldPass,
    } = Object.assign({
      merkleProofOverride: {},
      transactionDataOverride: {},
      randomLengthLeafs: false,
      errorCode: null,
      secondaryMetadata: null,
      secondaryInputs: null,
      fraudCode: null,
      witnesses: null,
      metadata: null,
      proofType: 'malformedTransaction',
      token: null,
      inputIndex: null,
      outputIndex: null,
      witnessIndex: null,
      otherRootProducer: false,
      secondTransactionIsZero: false,
      witnessReference: null,
      summingToken: emptyAddress, // Ether
      includeSecondWitness: false,
      withdrawalAccount: null,
      summingTokenIsERC20: false,
      submitProofTwice: false,
      constructInputAsSecondHTLC: false,
      constructInvalidHTLCWitness: false,
      secondIsRightmost: false,
      secondValidProof: false,
      secondInputIndex: null,
      constructExpiredOutput: false,
      secondOutputIndex: null,
      constructInvalidChangeWitness: false,
      secondWitnessIndex: null,
      constructInputAsSecondChange: false,
      erc20Enabled: false,
      otherCaller: false,
      includeProofs: false,
      inputs: null,
      outputs: null,
      produceSecondTransactionRoot: false,
      leafs: null,
      merkleProofOverflow: false,
      secondInputIsDeposit: false,
      proofsOverride: null,
      constructInputAsSecondUTXO: false,
      validMerkleRoot: true,
      logReceipts: false,
      leafCount: 1,
      blockIncrease: big(0),
      message: '',
      shouldPass: false,
    }, params || {});

    // Enforce Types
    if (errorCode !== null) { TypeNumber(errorCode); }
    if (fraudCode !== null) { TypeNumber(fraudCode); }
    if (merkleProofOverride !== null) { TypeObject(merkleProofOverride); }
    if (transactionDataOverride !== null) { TypeObject(transactionDataOverride); }
    TypeFunction(eq);
    TypeFunction(reverts);
    TypeString(message);
    TypeBigNumber(blockIncrease);

    // Construct Fuel Contract
    const { contract } = await constructFuel(address);

    // Genesis Block
    const genesis = new GenesisBlock();

    // Second Proof for Comparison proofs
    let secondProof = null;
    let secondBlockHeader = null;
    let inputsOverride = inputs;

    // Token
    let erc20Token = null;

    // Deploy second token
    if (erc20Enabled) {
      // Construct Token
      erc20Token = await constructUtility(big(1000), 0);

      // Mint user tokens
      await erc20Token.mint(address, 500);

      // Mint user tokens
      await erc20Token.approve(contract.address, 30);

      // Make Deposit and Register Token
      await contract.deposit(address, erc20Token.address, big(30), {
        gasLimit: loadsOfGas,
      });
    }

    // Construct Deposit
    const depositAmount = big(30);
    const deposit = await contract.deposit(address, emptyAddress, depositAmount, {
      gasLimit: loadsOfGas,
      value: depositAmount,
    });
    const depositReceipt = await getReceipt(deposit.hash);
    const depositProof = new DepositProof({
      account: address,
      token: emptyAddress,
      ethereumBlockNumber: big(depositReceipt.blockNumber),
    });

    // Block tx roots
    eq(depositReceipt.status, 1, 'deposit status good');

    // Create a second valid proof before main proof for Comparison
    if (secondValidProof) {
      // Different Owners, Tokens, Amounts, Types as Outputs for Reference
      const secondUnsignedTransaction = new TransactionUnsigned({
        inputs: secondInputIsDeposit ? [
          new TransactionInputDeposit({
              depositHashID: constructDepositHashID({
                account: address,
                token: emptyAddress, // Ether address
                ethereumBlockNumber: big(depositReceipt.blockNumber),
              }),
              witnessReference: witnessReference ? witnessReference : 0,
          }),
        ] : (secondaryInputs ? secondaryInputs: [
          new TransactionInputUTXO({ utxoID: emptyBytes32, witnessReference: 0 }),
        ]),
        outputs: [
          new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: address  }),
          new TransactionOutputUTXO({ amount: big(5), tokenID: big(0), owner: accounts[1].address  }),
          new TransactionOutputChange({ amount: big(10), tokenID: big(1),
              ownerAsWitnessIndex: constructInvalidChangeWitness ? 1 : 0 }),
          new TransactionOutputWithdrawal({ amount: big(5), tokenID: big(0), owner: address }),
          new TransactionOutputHTLC({
              amount: big(5),
              tokenID: big(0),
              owner: address,
              digest: utils.hexZeroPad('0x01', 32), // valid digest
              expiry: constructExpiredOutput ? big(3) : big(32),
              returnWitnessIndex: constructInvalidHTLCWitness ? 1 : 0,
          }),
        ],
      });

      if (constructInputAsSecondHTLC) {
        const utxoProof = new UTXOProof({
          transactionHashId: secondUnsignedTransaction.hash,
          outputIndex: 4,
          type: FuelInputTypes.HTLC,
          amount: big(5),
          owner: address,
          tokenID: big(0),
          digest: utils.hexZeroPad('0x01', 32), // valid digest
          expiry: constructExpiredOutput ? big(3) : big(32),
          returnWitness: constructInvalidHTLCWitness ? 1 : 0,
          preImage: emptyBytes32,
        });

        inputsOverride = [
          new  TransactionInputHTLC({
            utxoID: utxoProof.hash,
            preImage: emptyBytes32,
            witnessReference: 0,
          }),
        ];
      }

      if (constructInputAsSecondUTXO) {
        const utxoProof = new UTXOProof({
          transactionHashId: secondUnsignedTransaction.hash,
          outputIndex: 1,
          type: FuelInputTypes.UTXO,
          amount: big(5),
          owner: accounts[1].address,
          tokenID: big(0),
        });
        inputsOverride = [
          new TransactionInputUTXO({
            utxoID: utxoProof.hash,
            witnessReference: 1,
          }),
        ];
      }

      if (constructInputAsSecondChange) {
        const utxoProof = new UTXOProof({
          transactionHashId: secondUnsignedTransaction.hash,
          outputIndex: 2,
          type: FuelInputTypes.Change,
          amount: big(10),
          owner: constructInvalidChangeWitness ? 1 : 0,
          tokenID: big(1),
        });
        inputsOverride = [
          new TransactionInputChange({
            utxoID: utxoProof.hash,
            witnessReference: 0,
          }),
        ];
      }

      const secondTransactions = new BlockTransactions([
        secondTransactionIsZero ? (new EmptyTransactionLeaf(0)) : (new TransactionLeaf({
          metadata: secondaryMetadata ? secondaryMetadata : [
            new TransactionMetadata({
              blockHeight: big(1),
              transactionRootIndex: 0,
              transactionIndex: 0,
              outputIndex: 0,
            }),
          ],
          witnesses: [
            new TransactionWitness(constructWitness(secondUnsignedTransaction, accounts[0])),
            new TransactionWitness(constructWitness(secondUnsignedTransaction, accounts[1])),
          ],
          unsignedTransaction: secondUnsignedTransaction,
        })),
      ]);

      const secondTxIndex = secondIsRightmost ? secondTransactions.rightMostIndex() : 0;

      // Setup second root
      const secondRoot = new TransactionRootHeader({
        producer: address, // - transactionRootCommitter [32 bytes] -- padded address
        merkleTreeRoot: secondTransactions.merkleTreeRoot(), // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
        commitmentHash: secondTransactions.hash, // - transactionRootCommitmentHash [32 bytes]
        index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
      });

      // Fake Txs
      const fakeTransactions = new BlockTransactions([new EmptyTransactionLeaf(130)]);
      const fakeRoot = new TransactionRootHeader({
        producer: address, // - transactionRootCommitter [32 bytes] -- padded address
        merkleTreeRoot: emptyBytes32, // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
        commitmentHash: fakeTransactions.hash, // - transactionRootCommitmentHash [32 bytes]
        index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
      });

      // Submit Fake block for height / tx reference checks
      const secondSubmit = await contract.submitTransactions(emptyBytes32, fakeTransactions.encoded, {
        gasLimit: loadsOfGas,
      });
      const secondCommitReceiptFake = await contract.commitBlock(1, [fakeRoot.hash], {
        value: big(await contract.BOND_SIZE()),
        gasLimit: loadsOfGas,
      });

      const fakeBlockHeader = new BlockHeader({
        producer: address, // - blockCommitter [32 bytes] -- padded address
        previousBlockHash: genesis.hash, // - previousBlockHash [32 bytes]
        blockHeight: await contract.blockTip(), //- blockHeight [32 bytes]
        ethereumBlockNumber: big((await getReceipt(secondCommitReceiptFake.hash)).blockNumber), // - ethereumBlockNumber [32 bytes]
        transactionRoots: [fakeRoot.hash], // - transactionRoots [64 + dynamic bytes]
      });

      // Submit txs and blocks
      await contract.submitTransactions(secondRoot.merkleTreeRoot, secondTransactions.encoded, {
        gasLimit: loadsOfGas,
      });
      const secondCommit = await contract.commitBlock(2, produceSecondTransactionRoot ?
          [secondRoot.hash, secondRoot.hash] : [secondRoot.hash], {
        value: await contract.BOND_SIZE(),
        gasLimit: loadsOfGas,
      });
      const secondCommitReceipt = await getReceipt(secondCommit.hash);

      // Produce Second Block Header
      secondBlockHeader = new BlockHeader({
        producer: address, // - blockCommitter [32 bytes] -- padded address
        previousBlockHash: fakeBlockHeader.hash, // - previousBlockHash [32 bytes]
        blockHeight: await contract.blockTip(), //- blockHeight [32 bytes]
        ethereumBlockNumber: big(secondCommitReceipt.blockNumber), // - ethereumBlockNumber [32 bytes]
        transactionRoots: produceSecondTransactionRoot ?
            [secondRoot.hash, secondRoot.hash] : [secondRoot.hash], // - transactionRoots [64 + dynamic bytes]
      });

      // Setup Second Proof
      secondProof = new TransactionProof({
        block: secondBlockHeader,
        root: secondRoot,
        merkle: secondTransactions.merkleProof(secondTxIndex),
        transaction: new TransactionData({
          inputIndex: secondInputIndex ? secondInputIndex : 0,
          outputIndex: secondOutputIndex ? secondOutputIndex : 0,
          witnessIndex: secondWitnessIndex ? secondWitnessIndex : 0,
          transactionIndex: secondTxIndex,
          transactionLeaf: secondTransactions.get(secondTxIndex),
        }),
        proofs: 0,
      });
    }

    // Unsigned Transaction
    const unsignedTransaction = new TransactionUnsigned({
      inputs: inputsOverride ? inputsOverride : [ new TransactionInputDeposit({
          depositHashID: constructDepositHashID({
            account: address,
            token: emptyAddress, // Ether address
            ethereumBlockNumber: big(depositReceipt.blockNumber),
          }),
          witnessReference: witnessReference ? witnessReference : 0,
      })],
      outputs: outputs ? outputs : [ new TransactionOutputUTXO({ amount: depositAmount, tokenID: big(0), owner: address }) ]
    });

    // Witness
    let defaultWitnesses = [
      new TransactionWitness(constructWitness(unsignedTransaction, accounts[0])),
    ];

    // Includes a second witness signer
    if (includeSecondWitness) {
      defaultWitnesses = defaultWitnesses.concat([
        new TransactionWitness(constructWitness(unsignedTransaction, accounts[1])),
      ]);
    };

    // Valid transaction leaf (Ether transfer)
    const transactionLeaf = new TransactionLeaf({
      metadata: metadata ? metadata : [],
      witnesses: witnesses ? witnesses : defaultWitnesses,
      unsignedTransaction,
    });

    // Random leafs
    const randomLeafCount = randomInt(1, 120);
    const randomLeafs = randomLengthLeafs ? (new Array(randomLeafCount)).fill(0)
      .map(v => new EmptyTransactionLeaf(randomInt(101, 799))) : null;

    // Check random leafs
    if (randomLengthLeafs) {
      eq(randomLeafs.length > 0 ? 1 : 0, 1, `${randomLeafs.length} random leafs with different lengths generated`);
    }

    // valid leaf generation
    const transactionLeafs = leafs ? leafs : [transactionLeaf];
    const transactionIndex = 0;

    //
    // Single Block Empty Transaction Root
    //

    // Transaction Leafs Encoded
    const transactions = new BlockTransactions(transactionLeafs);
    const transactionsProof = new BlockTransactions(transactionLeafs);
    const merkleRoot = validMerkleRoot ? transactions.merkleTreeRoot() : emptyBytes32;

    // submit
    let submit = null;

    // use other producer
    if (otherRootProducer) {
      // setup an instance with other account 1
      const otherContract = atFuel(contract.address, 1);

      // submit transactions
      submit = await otherContract.submitTransactions(merkleRoot, transactions.encoded, {
        gasLimit: loadsOfGas,
      });
    } else {
      // submit transactions
      submit = await contract.submitTransactions(merkleRoot, transactions.encoded, {
        gasLimit: loadsOfGas,
      });
    }

    // Submit Transactions
    const submitBlock = big((await getReceipt(submit.hash)).blockNumber);

    // Transaction Root Header
    const root = new TransactionRootHeader({
      producer: otherRootProducer ? accounts[1].address : address, // - transactionRootCommitter [32 bytes] -- padded address
      merkleTreeRoot: merkleRoot, // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
      commitmentHash: transactions.hash, // - transactionRootCommitmentHash [32 bytes]
      index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
    });

    // Block tx roots
    eq(await contract.blockTransactionRoots(root.hash), submitBlock, 'root submitted');

    // Commit Block
    const commit = await contract.commitBlock(secondValidProof ? 3 : 1, [root.hash], {
      value: await contract.BOND_SIZE(),
      gasLimit: loadsOfGas,
    });
    const commitReceipt = await getReceipt(commit.hash);

    // Commit status
    eq(commitReceipt.status, 1, 'commit status');

    // Overflowing Merkle Proof
    const overflowMerkleProof = merkleProofOverflow
      ? new OverflowingTransactionMerkleProof() : null;

    // Block Header
    const blockHeader = new BlockHeader({
      producer: address, // - blockCommitter [32 bytes] -- padded address
      previousBlockHash: secondBlockHeader ? secondBlockHeader.hash : genesis.hash, // - previousBlockHash [32 bytes]
      blockHeight: await contract.blockTip(), //- blockHeight [32 bytes]
      ethereumBlockNumber: big(commitReceipt.blockNumber), // - ethereumBlockNumber [32 bytes]
      transactionRoots: [root.hash], // - transactionRoots [64 + dynamic bytes]
    });

    // setup proofs
    let proofs = 0;

    // include proof for deposit input above
    if (includeProofs) {
      proofs = [depositProof]; // include the single deposit proof
    }

    // Construct Proofs
    if (proofs !== 0) {
      // Tx Proofs
      proofs = new TransactionProofs([new SummingProof(summingTokenIsERC20
          ? erc20Token.address : summingToken)]
          .concat(proofsOverride ? proofsOverride : proofs));
    }

    // Handle Special Withdrawal Proof
    if (proofType === 'userWithdrawal') {
      proofs = new TransactionProofs([new WithdrawalProof(token)]);
    }

    // transaction proof
    const transactionProof = new TransactionProof({
      block: blockHeader,
      root,
      merkle: merkleProofOverflow ? overflowMerkleProof : new TransactionMerkleProof(Object.assign({
        transactionLeafs,
        transactionIndex,
      }, merkleProofOverride)),
      transaction: new TransactionData(Object.assign({
        inputIndex: inputIndex ? inputIndex : 0,
        outputIndex: outputIndex ? outputIndex : 0,
        witnessIndex: witnessIndex ? witnessIndex : 0,
        transactionIndex,
        transactionLeaf,
      }, transactionDataOverride)),
      proofs: proofs,
    });

    // let Proof
    let proof = null;

    // Malformed Transaction Proof
    if (proofType === 'malformedTransaction') {
      proof = new MalformedTransactionProof(transactionProof);
    }

    // User Withdrawal Proof
    if (proofType === 'userWithdrawal') {
      proof = new UserWithdrawalProof(transactionProof);
    }

    // Bond Withdrawal Proof
    if (proofType === 'bondWithdrawal') {
      proof = new BondWithdrawalProof(blockHeader);
    }

    // Bond Withdrawal Proof
    if (proofType === 'invalidTransaction') {
      proof = new InvalidTransactionProof(transactionProof);
    }

    // Submit the first proof twice
    if (submitProofTwice) {
      secondProof = transactionProof;
    }

    // Bond Withdrawal Proof
    if (proofType === 'invalidTransactionInput') {
      proof = new InvalidTransactionInputProof(transactionProof, secondProof);
    }

    // Bond Withdrawal Proof
    if (proofType === 'invalidTransactionDoubleSpend') {
      proof = new InvalidTransactionDoubleSpendProof(transactionProof, secondProof);
    }

    // Block tip adjusted.
    eq(await contract.blockTip(), secondValidProof ? 3 : 1, 'tip check');

    // Increase blocks before proof submission!
    if (blockIncrease.gt(0)) {
      console.log(`mining ${blockIncrease.toNumber()} blocks, this may take a while..`);
      await increaseBlocks(blockIncrease.toNumber());
    }

    // Submit the exact proof a first time, before actual submission
    if (submitProofTwice) {
      try {
        await contract.submitProof(proof.encoded, { gasLimit: loadsOfGas });
      } catch (error) {}
    }

    // Submission contract instance
    let submissionContract = contract;

    // if other caller is used
    if (otherCaller) {
      submissionContract = atFuel(contract.address, 1);
    }

    // if checking for error
    if (errorCode !== null) {
      // Submit Proof
      await reverts(() => submissionContract.submitProof(proof.encoded, { gasLimit: loadsOfGas }),
          errorCode, message, logReceipts);

      // Block tip adjusted.
      eq(await contract.blockTip(), secondValidProof ? 3 : 1, 'tip check');
    }

    // if checking for fraud proof
    if (fraudCode !== null) {
      // Submit Proof
      const proofSubmission = await submissionContract.submitProof(proof.encoded, { gasLimit: loadsOfGas });
      const resultLogs = (await getReceipt(proofSubmission.hash)).logs;

      // Log receipts
      if (logReceipts) {
        console.log(resultLogs);
      }

      // Check logs
      eq(resultLogs.length, 1, 'should have log length 1');

      // Logged fraud code
      const loggedFraudCode = FuelInterface.parseLog(resultLogs[0]).values.fraudCode;

      // Assert correct fraud code!
      eq(loggedFraudCode, fraudCode, message);

      // Block tip adjusted.
      eq(await contract.blockTip(), secondValidProof ? 2 : 0, 'tip check');
    }

    // if no fraud or errors, check logs for no logs, success tx
    if (fraudCode === null && errorCode === null) {
      // Submit Proof
      const proofSubmission = await submissionContract.submitProof(proof.encoded, { gasLimit: loadsOfGas });
      const proofReceipt = await getReceipt(proofSubmission.hash);
      const resultLogs = proofReceipt.logs;

      // Log receipts
      if (logReceipts) {
        console.log(resultLogs);
      }

      if (proofType === 'userWithdrawal') {
        // check withdrawal logs for correctness!
        eq(resultLogs.length, 1, message);

        const log = FuelInterface.parseLog(resultLogs[0]);

        eq(log.name === 'WithdrawalMade' ? 1 : 0, 1, 'log name correct');
        eq(log.values.token, token, 'token specified correct');
        eq(log.values.account, withdrawalAccount, 'account specified correct');
      } else if (proofType == 'bondWithdrawal') {
        // check withdrawal logs for correctness!
        eq(resultLogs.length, 1, message);

        const log = FuelInterface.parseLog(resultLogs[0]);

        eq(log.name === 'WithdrawalMade' ? 1 : 0, 1, 'log name correct');
        eq(log.values.token, emptyAddress, 'token specified correct');
        eq(log.values.account, withdrawalAccount, 'account specified correct');
      } else {
        // Check logs
        eq(resultLogs.length, 0, message);
      }

      // Check Receipt status
      eq(proofReceipt.status, 1, 'proof status good');

      // Block tip adjusted.
      eq(await contract.blockTip(), secondValidProof ? 3 : 1, 'tip check');
    }

    // Return contract instance
    return contract;
  } catch (error) {
    throw new ByPassError(error);
  }
}

// Submit User Withdrawal Proof
const submitUserWithdrawalProof = opts => submitMalformedTransactionProof(Object.assign(opts || {}, {
  proofType: 'userWithdrawal',
}));

const submitBondWithdrawalProof = opts => submitMalformedTransactionProof(Object.assign(opts || {}, {
  proofType: 'bondWithdrawal',
}));

const submitInvalidTransactionProof = opts => submitMalformedTransactionProof(Object.assign(opts || {}, {
  proofType: 'invalidTransaction',
}));

const submitInvalidTransactionInputProof = opts => submitMalformedTransactionProof(Object.assign(opts || {}, {
  proofType: 'invalidTransactionInput',
}));

const submitInvalidTransactionDoubleSpendProof = opts => submitMalformedTransactionProof(Object.assign(opts || {}, {
  proofType: 'invalidTransactionDoubleSpend',
}));

// Wrapped RPC with Ethers Wallet
const wrappedRPC = signer => async (...args) => {
  try {
    const _rpc = interfaces.FuelRPC({ web3Provider: provider });
    let wall = new ethers.Wallet(signer.privateKey, new ethers.providers.Web3Provider(provider));

    if (args[0] === 'eth_sendTransaction') {
      const txArgs = args[1];
      const result = await wall.sendTransaction(txArgs);
      return result.hash;
    }

    if (args[0] === 'eth_accounts') {
      return [signer.address];
    }

    return _rpc(...args);
  } catch (error) {
    throw new ByPassError(error);
  }
};

// Simulation Testing
async function simulatedContract(contract, remoteDB, mempoolDB, noIntake, localDB, accountsDB, t, faucetDB) {
  test('spend tests', async _t => {

  try {
    if (remoteDB || mempoolDB) {
      TypeDB(remoteDB);
      TypeDB(mempoolDB);
    }

    // Genesis Block
    const genesis = new GenesisBlock();

    // Construct Fuel Contract
    // const { contract } = await constructFuel(address);

    // Deposit Amount
    const depositAmount = big(40);

    // Construct Deposit
    const depositReceipt = await getReceipt((await contract.deposit(address, emptyAddress, depositAmount, {
      gasLimit: loadsOfGas,
      value: depositAmount,
    })).hash);

    // Unsigned Transaction
    const unsignedTransaction = new TransactionUnsigned({
      inputs: [ new TransactionInputDeposit({
        depositHashID: constructDepositHashID({
          account: address,
          token: emptyAddress, // Ether address
          ethereumBlockNumber: big(depositReceipt.blockNumber),
        }),
        witnessReference: 0,
      }),
      ],
      outputs: [ new TransactionOutputUTXO({
        amount: big(10),
        tokenID: big(0),
        owner: address,
      }),
      new TransactionOutputUTXO({
        amount: big(10),
        tokenID: big(0),
        owner: address,
      }),
      new TransactionOutputChange({
        amount: big(10),
        tokenID: big(0),
        ownerAsWitnessIndex: 0,
      }),
      new TransactionOutputWithdrawal({
        amount: big(5),
        tokenID: big(0),
        owner: address,
      }),
      new TransactionOutputHTLC({
        amount: big(5),
        tokenID: big(0),
        owner: address,
        digest: utils.keccak256(utils.hexZeroPad('0x01', 32)),
        expiry: big(2),
        returnWitnessIndex: 0,
      }) ],
    });

    const transactions = new BlockTransactions([
      new TransactionLeaf({
        metadata: [],
        witnesses: [
          new TransactionWitness(constructWitness(unsignedTransaction, accounts[0])),
        ],
        unsignedTransaction,
      }),
    ]);

    await contract.submitTransactions(transactions.merkleTreeRoot(), transactions.encoded, {
      gasLimit: loadsOfGas,
    });

    const root = new TransactionRootHeader({
      producer: address, // - transactionRootCommitter [32 bytes] -- padded address
      merkleTreeRoot: transactions.merkleTreeRoot(), // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
      commitmentHash: transactions.hash, // - transactionRootCommitmentHash [32 bytes]
      index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
    });
    const commitReceipt = await getReceipt((await contract.commitBlock(1, [root.hash], {
      value: await contract.BOND_SIZE(),
      gasLimit: loadsOfGas,
    })).hash);

    // SECOND TRANSACTION in SEPERATE BLOCK, at a Time in Future..

    await wait(10000);

    // No MYSQL
    if (!process.env.nomysql) {
      // Testing wallet
      const wallet_db = new MemoryDB();
      await  wallet_db.clear();
      const wallet = new Wallet({
        signer: accounts[0],
        provider,
        db: wallet_db,
        chainId: 10,
        rpc: wrappedRPC(accounts[0]),
        _addresses: {
          local: {
            fuel: contract.address,
            ether: '0x0000000000000000000000000000000000000000',
            fakeDai: String('0xaB9c0bBFDD156Ed089299675c97896a8A01A1d6f').toLowerCase(),
          },
        },
        _ids: {
          local: {
            '0x0000000000000000000000000000000000000000': '0',
            [String('0xaB9c0bBFDD156Ed089299675c97896a8A01A1d6f').toLowerCase()]: '1',
          },
        },
        _ignoreFrom: true,
        _post: post(remoteDB, mempoolDB, accountsDB, faucetDB),
      });

      console.log('wallet sync');

      // attempt sync
      await wallet.sync();

      _t.equal(1, 1, 'wallet sync');

      // Block Number
      const num = await wallet.blockNumber();

      // Check wallet
      _t.equal(num.toNumber(), 1, 'block num check');

      const bal = await wallet.balance(wallet.tokens.ether);

      _t.equal(bal.toNumber(), 35, 'wallet balance');

      // Deposit Result
      const depositResult = await wallet.deposit(130, wallet.tokens.ether);

      // Attempt transfer
      _t.equal((await wallet.balance(wallet.tokens.ether)).toNumber(), 130 + 35, 'wallet balancen after deposit');
    }

    console.log('Past wallet');

    // Unsigned Transaction
    const unsignedTransaction2 = new TransactionUnsigned({
      inputs: [
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: 0,
            type: FuelOutputTypes.UTXO,
            amount: big(10),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: 1,
            type: FuelOutputTypes.UTXO,
            amount: big(10),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
        new TransactionInputChange({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: 2,
            type: FuelOutputTypes.Change,
            amount: big(10),
            tokenID: big(0),
            owner: 0,
          })).hash,
          witnessReference: 0,
        }),
        // 3 is Withdrawal
        new TransactionInputHTLC({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: 4,
            type: FuelOutputTypes.HTLC,
            amount: big(5),
            tokenID: big(0),
            owner: address,
            digest: utils.keccak256(utils.hexZeroPad('0x01', 32)),
            expiry: big(2),
            returnWitnessIndex: 0,
          })).hash,
          preImage: utils.hexZeroPad('0x01', 32),
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: big(10),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(10),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputChange({
          amount: big(10),
          tokenID: big(0),
          ownerAsWitnessIndex: 0,
        }),
        new TransactionOutputHTLC({
          amount: big(5),
          tokenID: big(0),
          owner: address,
          digest: utils.keccak256(utils.hexZeroPad('0x04', 32)),
          expiry: big(7),
          returnWitnessIndex: 0,
        })
      ],
    });

    const transactions2 = new BlockTransactions([
      new TransactionLeaf({
        metadata: [
          new TransactionMetadata({
            blockHeight: big(1),
            transactionRootIndex: 0,
            transactionIndex: 0,
            outputIndex: 0,
          }),
          new TransactionMetadata({
            blockHeight: big(1),
            transactionRootIndex: 0,
            transactionIndex: 0,
            outputIndex: 1,
          }),
          new TransactionMetadata({
            blockHeight: big(1),
            transactionRootIndex: 0,
            transactionIndex: 0,
            outputIndex: 2,
          }),
          // 3 is Withdrawal
          new TransactionMetadata({
            blockHeight: big(1),
            transactionRootIndex: 0,
            transactionIndex: 0,
            outputIndex: 4,
          }),
        ],
        witnesses: [
          new TransactionWitness(constructWitness(unsignedTransaction2, accounts[0])),
        ],
        unsignedTransaction: unsignedTransaction2,
      }),
    ]);

    await contract.submitTransactions(transactions2.merkleTreeRoot(), transactions2.encoded, {
      gasLimit: loadsOfGas,
    });

    const root2 = new TransactionRootHeader({
      producer: address, // - transactionRootCommitter [32 bytes] -- padded address
      merkleTreeRoot: transactions2.merkleTreeRoot(), // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
      commitmentHash: transactions2.hash, // - transactionRootCommitmentHash [32 bytes]
      index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
    });
    const commitReceipt2 = await getReceipt((await contract.commitBlock(2, [root2.hash], {
      value: await contract.BOND_SIZE(),
      gasLimit: loadsOfGas,
    })).hash);

    // Lets attempt to deploy a double spend here...
    // Than it should revert..
    const doubleSpendAttempt = new TransactionUnsigned({
      inputs: [
        new TransactionInputUTXO({ // THIS IS ALREADY SPEND!!
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: 0,
            type: FuelOutputTypes.UTXO,
            amount: big(10),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: big(10),
          tokenID: big(0),
          owner: address,
        }),
      ],
    });

    const doubleSpendAttemptTransactions = new BlockTransactions([
      new TransactionLeaf({
        metadata: [
          new TransactionMetadata({
            blockHeight: big(1),
            transactionRootIndex: 0,
            transactionIndex: 0,
            outputIndex: 0,
          }),
        ],
        witnesses: [
          new TransactionWitness(constructWitness(doubleSpendAttempt, accounts[0])),
        ],
        unsignedTransaction: doubleSpendAttempt,
      }),
    ]);

    const contractFromSecond = contract.connect(wallets[3]);
    await contractFromSecond.submitTransactions(doubleSpendAttemptTransactions.merkleTreeRoot(),
      doubleSpendAttemptTransactions.encoded, {
      gasLimit: loadsOfGas,
    });
    const doubleSpendRoot = new TransactionRootHeader({
      producer: wallets[3].address, // - transactionRootCommitter [32 bytes] -- padded address
      merkleTreeRoot: doubleSpendAttemptTransactions.merkleTreeRoot(), // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
      commitmentHash: doubleSpendAttemptTransactions.hash, // - transactionRootCommitmentHash [32 bytes]
      index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
    });

    // now we wait
    console.log(`mining ${(await contract.SUBMISSION_DELAY()).add(100)} blocks, this may take a while..`);
    await increaseBlocks((await contract.SUBMISSION_DELAY()).add(100).toNumber());

    console.log('submitting double spend from third party, does the node react!!');
    const doubpeSpendBlockReceipt = await getReceipt((await contractFromSecond.commitBlock(3, [doubleSpendRoot.hash], {
      value: await contract.BOND_SIZE(),
      gasLimit: loadsOfGas,
    })).hash);
    console.log('double spend submitted!');

    console.log('Holding until double spend block reverts');
    let holdUntilTip = true;
    while (holdUntilTip) {
      if ((await contract.blockTip()).lte(2)) {
        holdUntilTip = false;
      }
      await wait(5000);
    }
    console.log('Begining sequence again post revert..');

    var rootHashes = [];
    let hash3 = null;

    for (var rootIndex = 0; rootIndex < 10; rootIndex += 1) {
      var transactionLeafs = [];

      for (var transactionIndex = 0; transactionIndex < 3; transactionIndex++) {
        const depostAmountValue = big(10);

        // Construct Deposit
        const depositReceipt = await getReceipt((await contract.deposit(address, emptyAddress, depostAmountValue, {
          gasLimit: loadsOfGas,
          value: depostAmountValue,
        })).hash);

        // Unsigned Transaction
        const unsignedTransaction3 = new TransactionUnsigned({
          inputs: [
            new TransactionInputDeposit({
              depositHashID: constructDepositHashID({
                account: address,
                token: emptyAddress, // Ether address
                ethereumBlockNumber: big(depositReceipt.blockNumber),
              }),
              witnessReference: 0,
            }),
          ],
          outputs: [
            new TransactionOutputUTXO({
              amount: big(5),
              tokenID: big(0),
              owner: address,
            }),
            new TransactionOutputUTXO({
              amount: big(1),
              tokenID: big(0),
              owner: address,
            }),
            new TransactionOutputHTLC({
              amount: big(1),
              tokenID: big(0),
              owner: address,
              digest: utils.keccak256(emptyBytes32),
              expiry: _utils.big(7),
              returnWitnessIndex: 0,
            }),
            new TransactionOutputChange({
              amount: big(1),
              tokenID: big(0),
              ownerAsWitnessIndex: 0,
            }),
            new TransactionOutputWithdrawal({
              amount: big(1),
              tokenID: big(0),
              owner: accounts[2].address,
            }),
            new TransactionOutputChange({
              amount: big(1),
              tokenID: big(0),
              ownerAsWitnessIndex: 0,
            }),
          ],
        });
        hash3 = unsignedTransaction3.hash;

        transactionLeafs[transactionIndex] = new TransactionLeaf({
          metadata: [
          ],
          witnesses: [
            new TransactionWitness(constructWitness(unsignedTransaction3, accounts[0])),
          ],
          unsignedTransaction: unsignedTransaction3,
        });
      }

      const transactions3 = new BlockTransactions(transactionLeafs);

      await contract.submitTransactions(transactions3.merkleTreeRoot(), transactions3.encoded, {
        gasLimit: loadsOfGas,
      });

      rootHashes[rootIndex] = (new TransactionRootHeader({
        producer: address, // - transactionRootCommitter [32 bytes] -- padded address
        merkleTreeRoot: transactions3.merkleTreeRoot(), // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
        commitmentHash: transactions3.hash, // - transactionRootCommitmentHash [32 bytes]
        index: big(rootIndex), // - transactionRootIndex [32 bytes] -- padded uint16
      })).hash;
    }

    await getReceipt((await contract.commitBlock(3, rootHashes, {
      value: await contract.BOND_SIZE(),
      gasLimit: loadsOfGas,
    })).hash);

    if (noIntake) {
      console.log('Simulation stopped.');
      return;
    }

    console.log('Deploy secondaruy token..');

    // Token
    let erc20Token = await constructUtility(big(1000), 0);

    // Mint user tokens
    const erc20TokenMint = await erc20Token.mint(address, 500);
    await erc20TokenMint.wait();

    // Mint user tokens
    const erc20TokenMint2 = await erc20Token.mint(accounts[3].address, 1000);
    await erc20TokenMint2.wait();

    // Mint user tokens
    const erc20TokenApproval = await erc20Token.approve(contract.address, 30);
    await erc20TokenApproval.wait();

    // Make Deposit and Register Token
    const erc20Deposit = await contract.deposit(address, erc20Token.address, big(30), {
      gasLimit: loadsOfGas,
    });
    await erc20Deposit.wait();
    const erc20DepositReceipt = await rpc('eth_getTransactionReceipt', erc20Deposit.hash);

    const unsignedTransaction5 = new TransactionUnsigned({
      inputs: [
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: hash3,
            outputIndex: 0,
            type: 0,
            amount: big(5),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
        new TransactionInputDeposit({
          depositHashID: constructDepositHashID({
            ethereumBlockNumber: big(erc20DepositReceipt.blockNumber),
            account: accounts[0].address,
            token: erc20Token.address,
          }),
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: big(3),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputWithdrawal({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(30),
          tokenID: big(1),
          owner: address,
        }),
      ],
    });

    await wait(13000);

    holdUntilTip = true;
    while (holdUntilTip) {
      if (big(utils.RLP.decode(await remoteDB.get(FuelDBKeys.numTokens))).gt(1)) {
        holdUntilTip = false;
      }

      await wait(5000);
    }

    await mysqlIntakeTransaction({
      transaction: unsignedTransaction5.rlp([
        new TransactionWitness(constructWitness(unsignedTransaction5, accounts[0])),
      ]),
      db: remoteDB,
      mempool: mempoolDB,
      accounts: accountsDB,
    });

    console.log('Attempt invalid withdrawl spend in intake');

    const invalidWithdrawalSpend = new TransactionUnsigned({
      inputs: [
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction5.hash,
            outputIndex: 2,
            type: 0,
            amount: big(1),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
      ],
    });

    try {
      await mysqlIntakeTransaction({
        transaction: invalidWithdrawalSpend.rlp([
          new TransactionWitness(constructWitness(invalidWithdrawalSpend, accounts[0])),
        ]),
        db: remoteDB,
        mempool: mempoolDB,
        accounts: accountsDB,
      });
    } catch (error) {
      console.log('Invalid withdrawl spend defended');
    }

    const invalidTooManyInputs = new TransactionUnsigned({
      inputs: (new Array(9)).fill(new TransactionInputUTXO({
        utxoID: (new UTXOProof({
          transactionHashId: unsignedTransaction5.hash,
          outputIndex: 2,
          type: 0,
          amount: big(1),
          tokenID: big(0),
          owner: address,
        })).hash,
        witnessReference: 0,
      })),
      outputs: [
        new TransactionOutputUTXO({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
      ],
    });

    try {
      await mysqlIntakeTransaction({
        transaction: invalidTooManyInputs.rlp([
          new TransactionWitness(constructWitness(invalidTooManyInputs, accounts[0])),
        ]),
        db: remoteDB,
        mempool: mempoolDB,
        accounts: accountsDB,
      });
    } catch (error) {
      console.log('Invalid inputs overflow defended');
    }

    console.log('Attempting mempool + htlc spend..');

    const invalidSumming = new TransactionUnsigned({
      inputs: [
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction5.hash,
            outputIndex: 0,
            type: 0,
            amount: big(3),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction5.hash,
            outputIndex: 1,
            type: 0,
            amount: big(1),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
        new TransactionInputHTLC({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction2.hash,
            outputIndex: 3,
            type: FuelInputTypes.HTLC,
            amount: big(5),
            tokenID: big(0),
            digest: utils.keccak256(utils.hexZeroPad('0x04', 32)),
            expiry: _utils.big(7),
            owner: address,
            returnWitnessIndex: 0,
          })).hash,
          preImage: utils.hexZeroPad('0x04', 32),
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: big(3),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(5),
          tokenID: big(0),
          owner: address,
        }),
      ],
    });

    try {
      await mysqlIntakeTransaction({
        transaction: invalidSumming.rlp([
          new TransactionWitness(constructWitness(invalidSumming, accounts[0])),
        ]),
        db: remoteDB,
        mempool: mempoolDB,
        accounts: accountsDB,
      });
      console.log('Invalid summing allowed!');
    } catch (error) {
      console.log('Invalid summing prevented!');
      _t.eq(typeof error, 'object', 'invalid summing prevented');
    }

    const mempoolSpend = new TransactionUnsigned({
      inputs: [
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction5.hash,
            outputIndex: 0,
            type: 0,
            amount: big(3),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction5.hash,
            outputIndex: 1,
            type: 0,
            amount: big(1),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
        new TransactionInputHTLC({
          utxoID: (new UTXOProof({
            transactionHashId: unsignedTransaction2.hash,
            outputIndex: 3,
            type: FuelInputTypes.HTLC,
            amount: big(5),
            tokenID: big(0),
            digest: utils.keccak256(utils.hexZeroPad('0x04', 32)),
            expiry: _utils.big(7),
            owner: address,
            returnWitnessIndex: 0,
          })).hash,
          preImage: utils.hexZeroPad('0x04', 32),
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: big(3),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(1),
          tokenID: big(0),
          owner: address,
        }),
        new TransactionOutputUTXO({
          amount: big(4),
          tokenID: big(0),
          owner: address,
        }),
      ],
    });

    const mempoolHTLCSpend = await mysqlIntakeTransaction({
      transaction: mempoolSpend.rlp([
        new TransactionWitness(constructWitness(mempoolSpend, accounts[0])),
      ]),
      db: remoteDB,
      mempool: mempoolDB,
      accounts: accountsDB,
    });

    _t.eq(mempoolHTLCSpend, true, 'mempool + htlc spend good');

    const anotherSpend = new TransactionUnsigned({
      inputs: [
        new TransactionInputUTXO({
          utxoID: (new UTXOProof({
            transactionHashId: mempoolSpend.hash,
            outputIndex: 0,
            type: 0,
            amount: big(3),
            tokenID: big(0),
            owner: address,
          })).hash,
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: big(3),
          tokenID: big(0),
          owner: '0xa201227aFF82A5F80F83C9E8825865a7c9D46758',
        }),
      ],
    });

    try {
      await mysqlIntakeTransaction({
        transaction,
        db: remoteDB,
        mempool: mempoolDB,
        accounts: accountsDB,
      });
    } catch (error) {
      console.log('Invalid submit attempt prevented (double spend in mempool)')
    }

    const dispersalAddr = '0xa201227aFF82A5F80F83C9E8825865a7c9D46758';
    const dispersalValue = utils.parseEther('1000000');

    // Construct Deposit
    const dispersalDeposit = await getReceipt((await contract.deposit(address, emptyAddress, dispersalValue, {
      gasLimit: loadsOfGas,
      value: dispersalValue,
    })).hash);

    const dispersalDepositHashId = constructDepositHashID({
      account: address,
      token: emptyAddress,
      ethereumBlockNumber: big(dispersalDeposit.blockNumber),
    });

    const dispersalTx = new TransactionUnsigned({
      inputs: [
        new TransactionInputDeposit({
          depositHashID: dispersalDepositHashId,
          witnessReference: 0,
        }),
      ],
      outputs: [
        new TransactionOutputUTXO({
          amount: dispersalValue,
          tokenID: big(0),
          owner: dispersalAddr,
        }),
      ],
    });

    console.log('dispersal tx and amount:', dispersalDepositHashId);

    holdUntilTip = true;
    while (holdUntilTip) {
      if (await remoteDB.get(FuelDBKeys.deposit + dispersalDepositHashId.slice(2))) {
        holdUntilTip = false;
      }

      console.log(await remoteDB.get(FuelDBKeys.deposit + dispersalDepositHashId.slice(2)));

      await wait(5000);
    }

    await mysqlIntakeTransaction({
      transaction: dispersalTx.rlp([
        new TransactionWitness(constructWitness(dispersalTx, accounts[0])),
      ]),
      db: remoteDB,
      mempool: mempoolDB,
      accounts: accountsDB,
    });

    if (!process.env.nomysql) {
      // Testing wallet
      const wallet_db_2 = new MemoryDB();
      await  wallet_db_2.clear();
      const wallet2 = new Wallet({
        signer: accounts[3],
        provider,
        db: wallet_db_2,
        chainId: 10,
        rpc: wrappedRPC(accounts[3]),
        _addresses: {
          local: {
            fuel: contract.address,
            ether: '0x0000000000000000000000000000000000000000',
            fakeDai: String(erc20Token.address).toLowerCase(),
          },
        },
        _ids: {
          local: {
            '0x0000000000000000000000000000000000000000': '0',
            [String(erc20Token.address).toLowerCase()]: '1',
          },
        },
        _ignoreFrom: true,
        _post: post(remoteDB, mempoolDB, accountsDB, faucetDB),
      });
      const { balance, transfer, deposit, withdraw, withdrawals } = wallet2;

      const bal = await balance(wallet2.tokens.fakeDai);

      _t.equal(bal.toNumber(), 0, 'wallet 2 fakeDai balance');

      // Wallet 2
      await deposit(500, wallet2.tokens.fakeDai);
      await deposit(utils.parseEther('32'), wallet2.tokens.ether);

      const bal2 = await balance(wallet2.tokens.fakeDai);
      const bal3 = await balance(wallet2.tokens.ether);

      // Wallet 2
      _t.equal(bal2.toNumber(), 500, 'wallet 2 balance post fakeDai deposit');
      _t.equal(bal3.eq(utils.parseEther('32')), true, 'wallet 2 balance post ether deposit');

      console.log('attempting transfer, waiting first..');

      await wait(10000);

      // Node
      const transferA = await transfer(25,
          wallet2.tokens.ether,
          accounts[2].address);

      const transferAA = await transfer(300,
          wallet2.tokens.ether,
          accounts[2].address);

      // Node
      const transferB = await transfer(122,
          wallet2.tokens.fakeDai,
          accounts[2].address);

      const transferBB = await transfer(100,
          wallet2.tokens.fakeDai,
          accounts[2].address);

      const transferAAA = await transfer(25,
        wallet2.tokens.ether,
        accounts[2].address);

      const transferAAAA = await transfer(25,
        wallet2.tokens.ether,
        accounts[2].address);

      console.log('Attempting to process second wallet 3 syncing, waiting..');

      const wallet_db_3 = new MemoryDB();
      await  wallet_db_3.clear();
      const wallet3 = new Wallet({
        signer: accounts[2],
        provider,
        db: wallet_db_3,
        chainId: 10,
        rpc: wrappedRPC(accounts[2]),
        _addresses: {
          local: {
            fuel: contract.address,
            ether: '0x0000000000000000000000000000000000000000',
            fakeDai: String(erc20Token.address).toLowerCase(),
          },
        },
        _ids: {
          local: {
            '0x0000000000000000000000000000000000000000': '0',
            [String(erc20Token.address).toLowerCase()]: '1',
          },
        },
        _ignoreFrom: true,
        _post: post(remoteDB, mempoolDB, accountsDB, faucetDB),
      });

      await wallet3.sync();

      console.log('post wallet 3 sync');

      const wallet3EtherBalance = await wallet3.balance(wallet3.tokens.ether);

      // Wallet 2
      _t.equal(wallet3EtherBalance.toNumber(), 375, 'wallet 3 balance post ether');

      const wallet3FakeDaiBalance = await wallet3.balance(wallet3.tokens.fakeDai);

      // Wallet 2
      _t.equal(wallet3FakeDaiBalance.toNumber(), 222, 'wallet 3 balance post fakeDai');

      /*
      console.log('Attempting fake dai and ether withdrawls.');

      const withdrawlOfEther = await withdraw(28,
        wallet2.tokens.ether);
      const withdrawlOfDai = await withdraw(49,
        wallet2.tokens.fakeDai);

      console.log('Waiting for finalization delay..');

      await increaseBlocks((await contract.FINALIZATION_DELAY()).toNumber());

      await retrive(wallet2.tokens.ether);
      */
    }

    return contract;
  } catch (error) {
    console.log(error);
    throw new ByPassError(error);
  }

  });
}

// Simulation Testing
async function simulatedWalletUsage(contract, remoteDB, mempoolDB, noIntake, localDB, accountsDB, t, faucetDB) {
  test('spend tests', async _t => {

  try {
    if (remoteDB || mempoolDB) {
      TypeDB(remoteDB);
      TypeDB(mempoolDB);
    }

    // Genesis Block
    const genesis = new GenesisBlock();

    console.log('Deploy secondaruy token..');

    // Token
    let erc20Token = await constructUtility(big(1000), 0);

    // Mint user tokens
    const erc20TokenMint = await erc20Token.mint(address, 5000000000);
    await erc20TokenMint.wait();

    // Mint user tokens
    const erc20TokenMint2 = await erc20Token.mint(accounts[3].address, 1000);
    await erc20TokenMint2.wait();

    // Mint user tokens
    const erc20TokenApproval = await erc20Token.approve(contract.address, 5000000000);
    await erc20TokenApproval.wait();

    // Make Deposit and Register Token
    const erc20Deposit = await contract.deposit(address, erc20Token.address, big(5000000000), {
      gasLimit: loadsOfGas,
    });
    await erc20Deposit.wait();
    const erc20DepositReceipt = await rpc('eth_getTransactionReceipt', erc20Deposit.hash);

    // Second Token
    let erc20Token3 = await constructUtility(big(1000), 0);
    const erc20TokenMint3 = await erc20Token3.mint(address, 130);
    await erc20TokenMint3.wait();

    const erc20TokenApproval3 = await erc20Token3.approve(contract.address, 130);
    await erc20TokenApproval3.wait();
    const erc20Deposit3 = await contract.deposit(accounts[4].address, erc20Token3.address, big(130), {
      gasLimit: loadsOfGas,
    });
    await erc20Deposit3.wait();
    const erc20DepositReceipt3 = await rpc('eth_getTransactionReceipt', erc20Deposit3.hash);

    const wallet_db_a = new MemoryDB();
    await  wallet_db_a.clear();
    const walletaa = new Wallet({
      signer: accounts[0],
      provider,
      db: wallet_db_a,
      chainId: 10,
      rpc: wrappedRPC(accounts[0]),
      _addresses: {
        local: {
          fuel: contract.address,
          ether: '0x0000000000000000000000000000000000000000',
          fakeDai: String(erc20Token.address).toLowerCase(),
        },
      },
      _ids: {
        local: {
          '0x0000000000000000000000000000000000000000': '0',
          [String(erc20Token.address).toLowerCase()]: '1',
        },
      },
      _ignoreFrom: true,
      _post: post(remoteDB, mempoolDB, accountsDB, faucetDB),
    });

    await _utils.wait(10000);

    await walletaa.sync();
    console.log('wallet a balance', await walletaa.balance(erc20Token.address));

    for (var i = 0; i < 1000; i++) { // test at 500
      await walletaa.transfer(1, erc20Token.address, accounts[2].address);
    }

    console.log('ERC20 token addr', erc20Token.address);

    // Testing wallet
    const wallet_db_2 = new MemoryDB();
    await  wallet_db_2.clear();
    const wallet2 = new Wallet({
      signer: accounts[3],
      provider,
      db: wallet_db_2,
      chainId: 10,
      rpc: wrappedRPC(accounts[3]),
      _addresses: {
        local: {
          fuel: contract.address,
          ether: '0x0000000000000000000000000000000000000000',
          fakeDai: String(erc20Token.address).toLowerCase(),
        },
      },
      _ids: {
        local: {
          '0x0000000000000000000000000000000000000000': '0',
          [String(erc20Token.address).toLowerCase()]: '1',
        },
      },
      _ignoreFrom: true,
      _post: post(remoteDB, mempoolDB, accountsDB, faucetDB),
    });
    const { balance, transfer, deposit, withdraw, withdrawals, retrieve } = wallet2;

    await _utils.wait(10000);

    const bal = await balance(wallet2.tokens.fakeDai);

    _t.equal(bal.toNumber(), 0, 'wallet 2 fakeDai balance');

    // Wallet 2
    await deposit(500, wallet2.tokens.fakeDai);
    await deposit(utils.parseEther('32'), wallet2.tokens.ether);

    console.log('Waiting for deposits to process');

    await _utils.wait(20000);

    const bal2 = await balance(wallet2.tokens.fakeDai);
    const bal3 = await balance(wallet2.tokens.ether);

    // Wallet 2
    _t.equal(bal2.toNumber(), 500, 'wallet 2 balance post fakeDai deposit');
    _t.equal(bal3.eq(utils.parseEther('32')), true, 'wallet 2 balance post ether deposit');

    console.log('attempting transfer, waiting first..');

    await wait(10000);

    // Node
    const transferA = await transfer(25,
        wallet2.tokens.ether,
        accounts[2].address);

    const transferAA = await transfer(300,
        wallet2.tokens.ether,
        accounts[2].address);

    // Node
    const transferB = await transfer(122,
        wallet2.tokens.fakeDai,
        accounts[2].address);

    const transferBB = await transfer(100,
        wallet2.tokens.fakeDai,
        accounts[2].address);

    const transferAAA = await transfer(25,
      wallet2.tokens.ether,
      accounts[2].address);

    const transferAAAA = await transfer(25,
      wallet2.tokens.ether,
      accounts[2].address);

    console.log('Attempting to process second wallet 3 syncing, waiting..');

    const wallet_db_3 = new MemoryDB();
    await  wallet_db_3.clear();
    const wallet3 = new Wallet({
      signer: accounts[2],
      provider,
      db: wallet_db_3,
      chainId: 10,
      rpc: wrappedRPC(accounts[2]),
      _addresses: {
        local: {
          fuel: contract.address,
          ether: '0x0000000000000000000000000000000000000000',
          fakeDai: String(erc20Token.address).toLowerCase(),
        },
      },
      _ids: {
        local: {
          '0x0000000000000000000000000000000000000000': '0',
          [String(erc20Token.address).toLowerCase()]: '1',
        },
      },
      _ignoreFrom: true,
      _post: post(remoteDB, mempoolDB, accountsDB, faucetDB),
    });

    await wallet3.sync();

    console.log('post wallet 3 sync');
    const wallet3EtherBalance = await wallet3.balance(wallet3.tokens.ether);

    // Wallet 2
    _t.equal(wallet3EtherBalance.toNumber(), 375, 'wallet 3 balance post ether');

    const wallet3FakeDaiBalance = await wallet3.balance(wallet3.tokens.fakeDai);

    // Wallet 2
    _t.equal(wallet3FakeDaiBalance.toNumber(), 222, 'wallet 3 balance post fakeDai');

    console.log('Attempting fake dai and ether withdrawls.');

    const withdrawlOfEther = await withdraw(28,
      wallet2.tokens.ether);
    const withdrawlOfDai = await withdraw(49,
      wallet2.tokens.fakeDai);

    console.log('Waiting for finalization delay..', (await contract.blockTip()).toNumber());

    // Little linger
    await _utils.wait(_utils.minutes(2) * 1000);

    const retBlock = (await contract.FINALIZATION_DELAY()).mul(2).toNumber();

    console.log('waiting', retBlock);

    await increaseBlocks(retBlock);

    // console.log(await retrieve(wallet2.tokens.fakeDai, 0));
    await transfer(2, wallet2.tokens.fakeDai, wallet3.address);
    await transfer(1, wallet2.tokens.fakeDai, wallet3.address);
    await transfer(4, wallet2.tokens.fakeDai, wallet3.address);

    console.log('Waiting for tip 1');

    console.log('Retrieval started');

    await retrieve(wallet2.tokens.ether, 0);
    await retrieve(wallet2.tokens.fakeDai, 0);

    console.log('Retrieval completed');

    const wallet4 = new Wallet({
      signer: accounts[4],
      provider,
      db: new MemoryDB(),
      chainId: 10,
      rpc: wrappedRPC(accounts[4]),
      _addresses: {
        local: {
          fuel: contract.address,
          ether: '0x0000000000000000000000000000000000000000',
          fakeDai: String(erc20Token.address).toLowerCase(),
          secondaryToken: erc20Token3.address,
        },
      },
      _ids: {
        local: {
          '0x0000000000000000000000000000000000000000': '0',
          [String(erc20Token.address).toLowerCase()]: '1',
        },
      },
      _ignoreFrom: true,
      _post: post(remoteDB, mempoolDB, accountsDB, faucetDB),
    });

    await wallet4.sync();

    _t.equal((await wallet4.balance(wallet4.tokens.secondaryToken)).toNumber(), 130, 'tokem 3 wallet 4 balance');

    await wallet4.transfer(23, wallet4.tokens.secondaryToken, wallet3.address);

    await wallet3.sync();

    _t.equal((await wallet3.balance(wallet4.tokens.secondaryToken)).toNumber(), 23, 'tokem 3 wallet 3 balance');

    console.log('we are a the end of testing..');

    return contract;
  } catch (error) {
    console.log(error);
    throw new ByPassError(error);
  }

  });
}

const wait = time => new Promise(resolve => setTimeout(() => resolve(), time));

// Create a Single Fuel contract, with a Single Block (given leafs)
// Creates a completely valid proof scenario
async function submitMalformedBlockProof(params) {
  try {
    const {
      blockHeaderParams,
      rootHeaderParams,
      randomLengthLeafs,
      transactionsFill,
      transactionsProofFill,
      witnesses,
      errorCode,
      fraudCode,
      submitProofTwice,
      eq,
      reverts,
      validMerkleRoot,
      includeSecondWitness,
      leafCount,
      useFill,
      blockIncrease,
      message,
      shouldPass,
    } = Object.assign({
      blockHeaderParams: {},
      rootHeaderParams: {},
      randomLengthLeafs: false,
      transactionsFill: null,
      submitProofTwice: false,
      transactionsProofFill: null,
      witnesses: null,
      errorCode: null,
      fraudCode: null,
      validMerkleRoot: false,
      includeSecondWitness: true,
      leafCount: 1,
      useFill: false,
      blockIncrease: big(0),
      message: '',
      shouldPass: false,
    }, params || {});

    // Enforce Types
    if (errorCode !== null) { TypeNumber(errorCode); }
    if (fraudCode !== null) { TypeNumber(fraudCode); }
    TypeObject(blockHeaderParams);
    TypeObject(rootHeaderParams);
    TypeFunction(eq);
    TypeFunction(reverts);
    TypeString(message);
    TypeBigNumber(blockIncrease);

    // Construct Fuel Contract
    const { contract } = await constructFuel(address);

    // Genesis Block
    const genesis = new GenesisBlock();

    // Deposit Amount
    const depositAmount = big(30);

    // Construct Deposit
    const deposit = await contract.deposit(address, emptyAddress, depositAmount, {
      gasLimit: loadsOfGas,
      value: depositAmount,
    });
    const depositReceipt = await getReceipt(deposit.hash);

    // Block tx roots
    eq(depositReceipt.status, 1, 'deposit status good');

    // Unsigned Transaction
    const unsignedTransaction = new TransactionUnsigned({
      inputs: [ new TransactionInputDeposit({
          depositHashID: constructDepositHashID({
            account: address,
            token: emptyAddress, // Ether address
            ethereumBlockNumber: big(depositReceipt.blockNumber),
          }),
          witnessReference: 0,
      })],
      outputs: [ new TransactionOutputUTXO({ amount: depositAmount, tokenID: big(0), owner: address }) ]
    });

    // Witness
    let defaultWitnesses = [
      new TransactionWitness(constructWitness(unsignedTransaction, accounts[0])),
    ];

    // Includes a second witness signer
    if (includeSecondWitness) {
      defaultWitnesses = defaultWitnesses.concat([
        new TransactionWitness(constructWitness(unsignedTransaction, accounts[1])),
      ]);
    };

    // Valid transaction leaf (Ether transfer)
    const transactionLeaf = new TransactionLeaf({
      metadata: [],
      witnesses: witnesses ? witnesses : defaultWitnesses,
      unsignedTransaction,
    });

    // Random leafs
    const randomLeafCount = randomInt(1, 120);
    const randomLeafs = randomLengthLeafs ? (new Array(randomLeafCount)).fill(0)
      .map(v => new EmptyTransactionLeaf(randomInt(101, 799))) : null;

    // Check random leafs
    if (randomLengthLeafs) {
      eq(randomLeafs.length > 0 ? 1 : 0, 1, `${randomLeafs.length} random leafs with different lengths generated`);
    }

    // valid leaf generation
    const validLeafs = randomLengthLeafs ? randomLeafs : (new Array(leafCount)).fill(0)
      .map(v => transactionLeaf);

    // Produce Leaf or FIll Proof
    const transactionLeafs = useFill ? [new FillProof(transactionsFill)] : validLeafs;
    const transactionLeafsProof = useFill ? [new FillProof(transactionsProofFill)] : validLeafs;

    //
    // Single Block Empty Transaction Root
    //

    // Transaction Leafs Encoded
    const transactions = new BlockTransactions(transactionLeafs);
    const transactionsProof = new BlockTransactions(transactionLeafsProof);
    const merkleRoot = validMerkleRoot ? transactions.merkleTreeRoot() : emptyBytes32;

    // Submit Transactions
    const submit = await contract.submitTransactions(merkleRoot, transactions.encoded, {
      gasLimit: loadsOfGas,
    });
    const submitBlock = big((await getReceipt(submit.hash)).blockNumber);

    // Transaction Root Header
    const root = new TransactionRootHeader({
      producer: address, // - transactionRootCommitter [32 bytes] -- padded address
      merkleTreeRoot: merkleRoot, // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
      commitmentHash: transactions.hash, // - transactionRootCommitmentHash [32 bytes]
      index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
    });

    // Block tx roots
    eq(await contract.blockTransactionRoots(root.hash), submitBlock, 'root submitted');

    // Commit Block
    const commit = await contract.commitBlock(1, [root.hash], {
      value: await contract.BOND_SIZE(),
      gasLimit: loadsOfGas,
    });
    const commitReceipt = await getReceipt(commit.hash);

    // Commit status
    eq(commitReceipt.status, 1, 'commit status');

    // Proof
    const proof = new MalformedBlockProof(new BlockFraudProof({
      block: new BlockHeader(Object.assign({
        producer: address, // - blockCommitter [32 bytes] -- padded address
        previousBlockHash: genesis.hash, // - previousBlockHash [32 bytes]
        blockHeight: big(1), //- blockHeight [32 bytes]
        ethereumBlockNumber: big(commitReceipt.blockNumber), // - ethereumBlockNumber [32 bytes]
        transactionRoots: [root.hash], // - transactionRoots [64 + dynamic bytes]
      }, blockHeaderParams)),
      root: new TransactionRootHeader(Object.assign({
        producer: address, // - transactionRootCommitter [32 bytes] -- padded address
        merkleTreeRoot: merkleRoot, // - transactionRootMerkleTreeRoot [32 bytes] -- padded bytes32
        commitmentHash: transactions.hash, // - transactionRootCommitmentHash [32 bytes]
        index: big(0), // - transactionRootIndex [32 bytes] -- padded uint16
      }, rootHeaderParams)),
      transactions: transactionsProof,
    }));

    // Block tip adjusted.
    eq(await contract.blockTip(), 1, 'tip check');

    // Increase blocks before proof submission!
    if (blockIncrease.gt(0)) {
      console.log(`mining ${blockIncrease.toNumber()} blocks, this may take a while..`);
      await increaseBlocks(blockIncrease.toNumber());
    }

    // if checking for error
    if (errorCode !== null) {
      // Submit Proof
      await reverts(() => contract.submitProof(proof.encoded, { gasLimit: loadsOfGas }),
          errorCode, message);

      // Block tip adjusted.
      eq(await contract.blockTip(), 1, 'tip check');
    }

    // if checking for fraud proof
    if (fraudCode !== null) {
      // Submit Proof
      const proofSubmission = await contract.submitProof(proof.encoded, { gasLimit: loadsOfGas });
      const resultLogs = (await getReceipt(proofSubmission.hash)).logs;

      // Check logs
      eq(resultLogs.length, 1, 'should have log length 1');

      // Logged fraud code
      const loggedFraudCode = FuelInterface.parseLog(resultLogs[0]).values.fraudCode;

      // Assert correct fraud code!
      eq(loggedFraudCode, fraudCode, message);

      // Block tip adjusted.
      eq(await contract.blockTip(), 0, 'tip check');
    }

    // if no fraud or errors, check logs for no logs, success tx
    if (fraudCode === null && errorCode === null) {
      // Submit Proof
      const proofSubmission = await contract.submitProof(proof.encoded, { gasLimit: loadsOfGas });
      const proofReceipt = await getReceipt(proofSubmission.hash);
      const resultLogs = proofReceipt.logs;

      // Check logs
      eq(resultLogs.length, 0, message);

      // Check Receipt status
      eq(proofReceipt.status, 1, 'proof status good');

      // Block tip adjusted.
      eq(await contract.blockTip(), 1, 'tip check');
    }
  } catch (error) {
    throw new ByPassError(error);
  }
}

// Export Environment
module.exports = {
  oneEther,
  oneDay,
  address,
  big,
  utils,
  rpc,
  accounts,
  params,
  extendTest,
  constructFuel,
  loadsOfGas,
  statusSuccess,
  unixtime,
  randomInt,
  increaseBlocks,
  getReceipt,
  simulatedContract,
  submitMalformedBlockProof,
  submitInvalidTransactionProof,
  submitMalformedTransactionProof,
  submitInvalidTransactionInputProof,
  submitInvalidTransactionDoubleSpendProof,
  submitBondWithdrawalProof,
  submitUserWithdrawalProof,
  constructUtility,
  singleBlockSingleProofFuel,
  providerConfig,
  atUtility,
  Fuel,
  atFuel,
  sendTransaction,
  simulatedWalletUsage,
};
