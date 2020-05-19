const { utils, Contract, providers, Wallet } = require('ethers');
const EthRPC = require('ethjs-rpc');
const types = require('../types/types');
const {
  big,
} = require('../utils/utils');

// Fuel Constants Contract
const FuelConstantsCode = `
  contract FuelConstants {
      // CONSTANTS
      uint256 constant public BOND_SIZE = .1 ether; // required for block commitment
      uint256 constant public FINALIZATION_DELAY = 14 days / 14; //  ~ 2 weeks at 14 second block times
      uint256 constant public SUBMISSION_DELAY = uint256(4 days) / 14; //  ~ 3 day (should be 3 days) in Ethereum Blocks
      uint256 constant public CLOSING_DELAY = uint256(90 days) / 14; // (should be 3 months)
      uint256 constant public MAX_TRANSACTIONS_SIZE = 58823;
      uint256 constant public TRANSACTION_ROOTS_MAX = 256;

      // ASSEMBLY ONLY FRAUD CODES
      uint256 constant FraudCode_InvalidMetadataBlockHeight = 0;
      uint256 constant FraudCode_TransactionHashZero = 1;
      uint256 constant FraudCode_TransactionIndexOverflow = 2;
      uint256 constant FraudCode_MetadataOutputIndexOverflow = 3;
      uint256 constant FraudCode_InvalidUTXOHashReference = 4;
      uint256 constant FraudCode_InvalidReturnWitnessNotSpender = 5;
      uint256 constant FraudCode_InputDoubleSpend = 6;
      uint256 constant FraudCode_InvalidMerkleTreeRoot = 7;
      uint256 constant FraudCode_MetadataBlockHeightUnderflow = 8;
      uint256 constant FraudCode_MetadataBlockHeightOverflow = 9;
      uint256 constant FraudCode_InvalidHTLCDigest = 10;
      uint256 constant FraudCode_TransactionLengthUnderflow = 11;
      uint256 constant FraudCode_TransactionLengthOverflow = 12;
      uint256 constant FraudCode_InvalidTransactionInputType = 13;
      uint256 constant FraudCode_TransactionOutputWitnessReferenceOverflow = 14;
      uint256 constant FraudCode_InvalidTransactionOutputType = 15;
      uint256 constant FraudCode_TransactionSumMismatch = 16;
      uint256 constant FraudCode_TransactionInputWitnessReferenceOverflow = 17;
      uint256 constant FraudCode_TransactionInputDepositZero = 18;
      uint256 constant FraudCode_TransactionInputDepositWitnessOverflow = 19;
      uint256 constant FraudCode_TransactionHTLCWitnessOverflow = 20;
      uint256 constant FraudCode_TransactionOutputAmountLengthUnderflow = 21;
      uint256 constant FraudCode_TransactionOutputAmountLengthOverflow = 22;
      uint256 constant FraudCode_TransactionOutputTokenIDOverflow = 23;
      uint256 constant FraudCode_TransactionOutputHTLCDigestZero = 24;
      uint256 constant FraudCode_TransactionOutputHTLCExpiryZero = 25;
      uint256 constant FraudCode_InvalidTransactionWitnessSignature = 26;
      uint256 constant FraudCode_TransactionWitnessesLengthUnderflow = 27;
      uint256 constant FraudCode_TransactionWitnessesLengthOverflow = 28;
      uint256 constant FraudCode_TransactionInputsLengthUnderflow = 29;
      uint256 constant FraudCode_TransactionInputsLengthOverflow = 30;
      uint256 constant FraudCode_TransactionOutputsLengthUnderflow = 31;
      uint256 constant FraudCode_TransactionOutputsLengthOverflow = 32;
      uint256 constant FraudCode_TransactionMetadataLengthOverflow = 33;
      uint256 constant FraudCode_TransactionInputSelectorOverflow = 34;
      uint256 constant FraudCode_TransactionOutputSelectorOverflow = 35;
      uint256 constant FraudCode_TransactionWitnessSelectorOverflow = 37;
      uint256 constant FraudCode_TransactionUTXOType = 38;
      uint256 constant FraudCode_TransactionUTXOOutputIndexOverflow = 39;
      uint256 constant FraudCode_InvalidTransactionsNetLength = 40;
      uint256 constant FraudCode_MetadataTransactionsRootsLengthOverflow = 41;
      uint256 constant FraudCode_ComputedTransactionLengthOverflow = 42;
      uint256 constant FraudCode_ProvidedDataOverflow = 43;
      uint256 constant FraudCode_MetadataReferenceOverflow = 44;
      uint256 constant FraudCode_OutputHTLCExpiryUnderflow = 45;
      uint256 constant FraudCode_InvalidInputWithdrawalSpend = 46;
      uint256 constant FraudCode_InvalidTypeReferenceMismatch = 47;
      uint256 constant FraudCode_InvalidChangeInputSpender = 48;
      uint256 constant FraudCode_InvalidTransactionRootIndexOverflow = 49;

      // ASSEMBLY ONLY ERROR CODES
      uint256 constant ErrorCode_InvalidTypeDeposit = 0;
      uint256 constant ErrorCode_InputReferencedNotProvided = 1;
      uint256 constant ErrorCode_InvalidReturnWitnessSelected = 2;
      uint256 constant ErrroCode_InvalidReturnWitnessAddressEmpty = 3;
      uint256 constant ErrroCode_InvalidSpenderWitnessAddressEmpty = 4;
      uint256 constant ErrorCode_InvalidTransactionComparison = 5;
      uint256 constant ErrorCode_WithdrawalAlreadyHappened = 6;
      uint256 constant ErrorCode_BlockProducerNotCaller = 7;
      uint256 constant ErrorCode_BlockBondAlreadyWithdrawn = 8;
      uint256 constant ErrorCode_InvalidProofType = 9;
      uint256 constant ErrorCode_BlockHashNotFound = 10;
      uint256 constant ErrorCode_BlockHeightOverflow = 11;
      uint256 constant ErrorCode_BlockHeightUnderflow = 12;
      uint256 constant ErrorCode_BlockNotFinalized = 13;
      uint256 constant ErrorCode_BlockFinalized = 14;
      uint256 constant ErrorCode_TransactionRootLengthUnderflow = 15;
      uint256 constant ErrorCode_TransactionRootIndexOverflow = 16;
      uint256 constant ErrorCode_TransactionRootHashNotInBlockHeader = 17;
      uint256 constant ErrorCode_TransactionRootHashInvalid = 18;
      uint256 constant ErrorCode_TransactionLeafHashInvalid = 19;
      uint256 constant ErrorCode_MerkleTreeHeightOverflow = 20;
      uint256 constant ErrorCode_MerkleTreeRootInvalid = 21;
      uint256 constant ErrorCode_InputIndexSelectedOverflow = 22;
      uint256 constant ErrorCode_OutputIndexSelectedOverflow = 23;
      uint256 constant ErrorCode_WitnessIndexSelectedOverflow = 24;
      uint256 constant ErrorCode_TransactionUTXOIDInvalid = 25;
      uint256 constant ErrorCode_FraudBlockHeightUnderflow = 26;
      uint256 constant ErrorCode_FraudBlockFinalized = 27;
      uint256 constant ErrorCode_SafeMathAdditionOverflow = 28;
      uint256 constant ErrorCode_SafeMathSubtractionUnderflow = 29;
      uint256 constant ErrorCode_SafeMathMultiplyOverflow = 30;
      uint256 constant ErrorCode_TransferAmountUnderflow = 31;
      uint256 constant ErrorCode_TransferOwnerInvalid = 32;
      uint256 constant ErrorCode_TransferTokenIDOverflow = 33;
      uint256 constant ErrorCode_TransferEtherCallResult = 34;
      uint256 constant ErrorCode_TransferERC20Result = 35;
      uint256 constant ErrorCode_TransferTokenAddress = 36;
      uint256 constant ErrorCode_InvalidPreviousBlockHash = 37;
      uint256 constant ErrorCode_TransactionRootsLengthUnderflow = 38;
      uint256 constant ErrorCode_TransactionRootsLengthOverflow = 39;
      uint256 constant ErrorCode_InvalidWithdrawalOutputType = 40;
      uint256 constant ErrorCode_InvalidWithdrawalOwner = 41;
      uint256 constant ErrorCode_InvalidDepositProof = 42;
      uint256 constant ErrorCode_InvalidTokenAddress = 43;
      uint256 constant ErrorCode_InvalidBlockHeightReference = 44;
      uint256 constant ErrorCode_InvalidOutputIndexReference = 45;
      uint256 constant ErrorCode_InvalidTransactionRootReference = 46;
      uint256 constant ErrorCode_InvalidTransactionIndexReference = 47;
      uint256 constant ErrorCode_ProofLengthOverflow = 48;
      uint256 constant ErrorCode_InvalidTransactionsABILengthOverflow = 49;

      // ASSEMBLY ONLY CONSTANTS

      // Calldata Memory Position
      uint256 constant Calldata_MemoryPosition = 12 * 32; // should be larger than UTXO Proof size
      uint256 constant MemoryStackSize = 32 * 32; // for 32 positions in memory

      // Length and Index max/min for Inputs, Outpus, Witnsses, Metadata
      uint256 constant IndexMaximum = 7;
      uint256 constant TransactionLengthMax = 8;
      uint256 constant TransactionLengthMin = 0;

      // Metadata, Witness and UTXO Proof Byte Size
      uint256 constant MetadataSize = 8;
      uint256 constant WitnessSize = 65;
      uint256 constant UTXOProofSize = 9 * 32;
      uint256 constant DepositProofSize = 96;

      // Minimum and Maximum transaciton byte lenth
      uint256 constant TransactionSizeMinimum = 100;
      uint256 constant TransactionSizeMaximum = 800;

      // Maximum Merkle Tree Height
      uint256 constant MerkleTreeHeightMaximum = 255;

      // Select maximum number of transactions that can be included in a Side Chain block
      uint256 constant MaxTransactionsInBlock = 2048;

      // Ether Token Address
      uint256 constant EtherToken = 0;

      // Genesis Block Height
      uint256 constant GenesisBlockHeight = 0;

      // 4 i.e. (1) Input / (2) Output / (3) Witness Selection / (4) Metadata Selection
      uint256 constant SelectionStackOffsetSize = 4;

      // ASSEMBLY ONLY ENUMS

      // Method Enums
      uint256 constant Not_Finalized = 0;
      uint256 constant Is_Finalized = 1;
      uint256 constant Include_UTXOProofs = 1;
      uint256 constant No_UTXOProofs = 0;
      uint256 constant FirstProof = 0;
      uint256 constant SecondProof = 1;

      // Input Types Enums
      uint256 constant InputType_UTXO = 0;
      uint256 constant InputType_Deposit = 1;
      uint256 constant InputType_HTLC = 2;
      uint256 constant InputType_Change = 3;

      // Input Sizes
      uint256 constant InputSizes_UTXO = 33;
      uint256 constant InputSizes_Change = 33;
      uint256 constant InputSizes_Deposit = 33;
      uint256 constant InputSizes_HTLC = 65;

      // Output Types Enums
      uint256 constant OutputType_UTXO = 0;
      uint256 constant OutputType_Withdrawal = 1;
      uint256 constant OutputType_HTLC = 2;
      uint256 constant OutputType_Change = 3;

      // ASSEMBLY ONLY MEMORY STACK POSITIONS
      uint256 constant Stack_InputsSum = 0;
      uint256 constant Stack_OutputsSum = 1;

      uint256 constant Stack_Metadata = 2;
      uint256 constant Stack_BlockTip = 3;
      uint256 constant Stack_UTXOProofs = 4;
      uint256 constant Stack_TransactionHashID = 5;
      uint256 constant Stack_BlockHeader = 6;

      uint256 constant Stack_SelectionOffset = 7;

      // Selection Stack Positions
      uint256 constant Stack_MetadataSelected = 8;
      uint256 constant Stack_InputSelected = 9;
      uint256 constant Stack_OutputSelected = 10;
      uint256 constant Stack_WitnessSelected = 11;

      // 12, 13, 14, 15 are reserved for second proof offset selections

      uint256 constant Stack_RootProducer = 16;
      uint256 constant Stack_Witnesses = 17;
      uint256 constant Stack_MerkleProofLeftish = 23;
      uint256 constant Stack_ProofNumber = 25;

      // Storage Positions (based on Solidity compilation)
      uint256 constant Storage_deposits = 0;
      uint256 constant Storage_withdrawals = 1;
      uint256 constant Storage_blockTransactionRoots = 2;
      uint256 constant Storage_blockCommitments = 3;
      uint256 constant Storage_tokens = 4;
      uint256 constant Storage_numTokens = 5;
      uint256 constant Storage_blockTip = 6;
      uint256 constant Storage_blockProducer = 7;
  }
`;

// Fraud Codes
const FuelFraudCodes = FuelConstantsCode
  .match(/(FraudCode_)(.*)(;)/g)
  .map(v => v.replace(';', '').replace('FraudCode_', ''))
  .reduce((acc, v) => Object.assign(acc, {
    [v.split('=')[0].trim()]: big(v.split('=')[1].trim()).toNumber(),
  }), {});

const FuelFraudNames = FuelConstantsCode
  .match(/(FraudCode_)(.*)(;)/g)
  .map(v => v.replace(';', '').replace('FraudCode_', ''))
  .reduce((acc, v) => Object.assign(acc, {
    [big(v.split('=')[1].trim()).toNumber()]: v.split('=')[0].trim(),
  }), {});

// Fraud Codes
const FuelErrorCodes = FuelConstantsCode
  .match(/(ErrorCode_)(.*)(;)/g)
  .map(v => v.replace(';', '').replace('ErrorCode_', ''))
  .reduce((acc, v) => Object.assign(acc, {
    [v.split('=')[0].trim()]: big(v.split('=')[1].trim()).toNumber(),
  }), {});

// Fraud Codes
const FuelConstants = FuelConstantsCode
  .match(/(uint256)(.*)(constant)(.*)(;)/g)
  .map(v => v.replace(';', '').replace(/(uint256)/g, '')
    .replace('days', '* 86400').replace(' ether', ' * ' + utils.parseEther('1').toString())
    .replace('constant', '').replace('public', ''))
    .map(v => v.split('=').map(v => v.trim()))
    .filter(v => v)
    .reduce((acc, v) => Object.assign(acc, {
      [v[0]]: Number(eval(v[1])),
    }), {});

// ERC20 Interface
const ERC20EventsInterface = new utils.Interface([
  // Events
  'event Transfer(address indexed from, address indexed to, uint tokens)',
  'event Approval(address indexed tokenOwner, address indexed spender, uint tokens)',
]);

// ERC20 Interface
const ERC20Interface = new utils.Interface([
  // State Changing Methods
  'function transfer(address to, uint tokens) public returns (bool success)',
  'function approve(address spender, uint tokens) public returns (bool success)',
  'function transferFrom(address from, address to, uint tokens) public returns (bool success)',

  // Getters
  'function allowance(address tokenOwner, address spender) public view returns (uint remaining)',
  'function totalSupply() public view returns (uint)',
  'function balanceOf(address tokenOwner) public view returns (uint balance)',

].concat(ERC20EventsInterface.abi));

// Fuel Events Interface
const FuelEventsInterface = new utils.Interface([
  // EVENTS
  'event DepositMade(address indexed account, address indexed token, uint256 amount)',
  'event WithdrawalMade(address indexed account, address token, uint256 amount, uint256 indexed blockHeight, uint256 transactionRootIndex, bytes32 indexed transactionLeafHash, uint8 outputIndex, bytes32 transactionHashId)',
  'event TransactionsSubmitted(bytes32 indexed transactionRoot, address producer, bytes32 indexed merkleTreeRoot, bytes32 indexed commitmentHash)',
  'event BlockCommitted(address blockProducer, bytes32 indexed previousBlockHash, uint256 indexed blockHeight, bytes32[] transactionRoots)',
  'event FraudCommitted(uint256 indexed previousTip, uint256 indexed currentTip, uint256 indexed fraudCode)',
  'event TokenIndex(address indexed token, uint256 indexed index)',
]);

// Fuel Utility Interface
const FuelUtilityInterface = new utils.Interface([
  // Special Helper methods
  'function mint(address guy, uint wad) public',
  'function makeDeposits(address fuel, address[] accounts, address[] tokens, uint256[] amounts) external',
  'function submitTransactions(address fuel, bytes32 merkleHash, bytes transactions) external',

].concat(ERC20Interface.abi).concat(FuelEventsInterface.abi));

// Fuel Utility Interface
const FakeDaiInterface = new utils.Interface([
  // Special Helper methods
  'function mint(address guy, uint wad) public',
  'constructor(uint256 chainId_)',

].concat(ERC20Interface.abi).concat(FuelEventsInterface.abi));


// Fuel Interface
const FuelInterface = new utils.Interface([
  // State Changing Methods
  'constructor(address producer)',
  'function deposit(address account, address token, uint256 amount) external',
  'function submitTransactions(bytes32 merkleTreeRoot, bytes transactions) public',
  'function commitBlock(uint256 blockHeight, bytes32[] transactionRoots) public',
  'function submitProof(bytes) public',

  // Getters
  'function deposits(bytes32) public view returns (uint256)',
  'function withdrawals(uint256, bytes32) public view returns (bool)',
  'function blockTransactionRoots(bytes32) public view returns (uint256)',
  'function blockCommitments(uint256) public view returns (bytes32)',
  'function blockTip() public view returns (uint256)',
  'function numTokens() public view returns (uint256)',
  'function blockProducer() public view returns (address)',
  'function tokens(address token) public view returns (uint256)',

  // Constants
  'function BOND_SIZE() public view returns (uint256)',
  'function FINALIZATION_DELAY() public view returns (uint256)',
  'function SUBMISSION_DELAY() public view returns (uint256)',
  'function CLOSING_DELAY() public view returns (uint256)',
  'function MAX_TRANSACTIONS_SIZE() public view returns (uint256)',

].concat(ERC20EventsInterface.abi).concat(FuelEventsInterface.abi));

// console.log(FuelEventsInterface.events.WithdrawalMade);

// Fuel Input
const FuelInputTypes = {
  'UTXO': 0,
  'Deposit': 1,
  'HTLC': 2,
  'Change': 3,
};

const FuelOutputTypes = {
  'UTXO': 0,
  'Withdrawal': 1,
  'HTLC': 2,
  'Change': 3,
};

// Proof Types
const FuelProofTypes = {
  'malformedBlock': 0,
  'malformedTransaction': 1,
  'invalidTransaction': 2,
  'invalidTransactionInput': 3,
  'invalidTransactionDoubleSpend': 4,
  'userWithdrawal': 5,
  'bondWithdrawal': 6,
};

// ByteLength Size
const TransactionLengthByteSize = 4;

// DB Keys
const FuelDBKeys = {
  storage: '0x00',
  token: '0x01',
  tokenID: '0x02',
  block: '0x03',
  transactionRoot: '0x04',
  deposit: '0x05',
  Deposit: '0x05',
  UTXO: '0x06',
  blockTip: '0x07',
  account: '0x08',
  withdraw: '0x09',
  transaction: '0x10',
  ethereumBlockProcessed: '0x11',
  lastEthereumFraudBlock: '0x12',
  numTokens: '0x13',
  mempool: '0x14',
  mempoolSpend: '0x15',
  mempoolTransaction: '0x16',
  withdrawal: '0x17',
  commitment: '0x18',
  ip: '0x19',
  contract: '0x20', // for fuel contract address.
  withdrawn: '0x21',
  swap: '0x22',
};

// Fuel Contract Instance
function FuelContract({ address, web3Provider, signerKey }) {
  types.TypeHex(address);
  types.TypeObject(web3Provider);
  if (typeof signerKey !== "undefined") { types.TypeObject(signerKey); }

  // We connect to the Contract using a Provider, so we will only
  // have read-only access to the Contract
  const contract = new Contract(address, FuelInterface.abi, new providers.Web3Provider(web3Provider));

  // Connect if Signer Key
  if (signerKey) {
    return contract.connect(new Wallet(signerKey.privateKey, new providers.Web3Provider(web3Provider)));
  }

  // Create a new instance of the Contract with a Signer, which allows
  return contract;
}

function FuelRPC({ web3Provider }) {
  // Build raw object
  const eth = new EthRPC(web3Provider);

  // RPC call
  return (method, ...args) => new Promise((resolve, reject) => eth
    .sendAsync({ method, params: args }, (err, result) => {
    if (err) return reject(err);
    if (result) return resolve(result);
  }));
}

module.exports = {
  FuelInterface,
  FuelUtilityInterface,
  FakeDaiInterface,
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
  FuelContract,
  FuelRPC,
  TransactionLengthByteSize,
  FuelDBKeys,
};
