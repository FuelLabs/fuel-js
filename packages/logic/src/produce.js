const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const mempool = require('./mempool');
const interface = require('@fuel-js/interface');
const refill = require('@fuel-js/refill');
const struct = require('@fuel-js/struct');
const transact = require('./transact');
const ethers = require('ethers');

// The root size target in bytes, currently 32kb
const rootLengthTarget = 32000;

// Max root producers
const maxRootProducers = 128;

// default root producers
const defaultRootProducers = 8;

// Minimum txs per root
const minimumTransactionsPerRoot = 2; // 200; // 1;

// One hour
const oneHour = 3600;

// The oldest a transaction can be until it needs to be publshed, unixtimes
const maximumTransactionAge = oneHour * 1000;

// pull limit from mempool
const pullLimit = 4; // 2042;

// Root commitment options
const commitRootOptions = {
  gasLimit: 1000000,
};

// Cost per Root
const etherPerRoot = utils.parseEther('0.1');

// Convert Seed / Comma Seperated Operators to usable Wallets
function operatorsToWallets(config = {}) {
  // Operators specified
  utils.assert(config.operators, 'no operators specified');

  // Is array
  if (Array.isArray(config.operators)) {
    return config.operators.map(privateKey => {
      return new ethers.Wallet(privateKey, config.provider);
    }).slice(0, 128);
  }

  // Is a comma seperated list
  if (config.operators.indexOf(',') === 0) {
    return config.operators.trim().split(',').map(privateKey => {
      return new ethers.Wallet(privateKey.trim(), config.provider);
    }).slice(0, 128);
  }

  // Is a mnemonic seed phrase
  let wallets = [];
  for (var i = 0; i < defaultRootProducers; i++) {
    const _wallet = new ethers.Wallet.fromMnemonic(
      config.operators,
      "m/44'/60'/0'/1/" + i,
    );
    wallets.push(_wallet.connect(config.provider));
  }

  // Return wallets
  return wallets;
}

// produce, intakes a config, will produce a block from mempool data / last commitment
async function produce(state = {}, config = {}) {
  try {
    // Get commitment
    let commitment = protocol.addons.Commitment(state.object());
    try {
      // If commitment is available, it hasn't been processed yet.
      commitment = protocol.addons.Commitment(await config.db.get([ interface.db.commitment ]));
    } catch (noCommitmentError) {}

    // if current height is less than commitment, stop
    if (state.properties.blockHeight().get()
      .lt(commitment.properties.blockHeight().get())) {
      return;
    }

    // if the current state blockheight is at or past previous commit, start new commitment
    if (state.properties.blockHeight().get()
      .gte(commitment.properties.blockHeight().get())) {
      commitment = protocol.addons.Commitment(state.object());
    }

    // Get state blocknumber from state
    const blockNumber = state.properties.blockNumber().get().toNumber();

    // Establish current micro time
    const timestamp = utils.timestamp();

    // Check block numebr
    const currentBlockNumber = await config.provider.getBlockNumber();

    // If the current block number is gt current or blockNumber doesn't have enough confs..
    if (blockNumber > currentBlockNumber
      || currentBlockNumber - blockNumber < config.confirmations) {
      return;
    }

    // collection
    const options = {
      minTimestamp: commitment.properties.endTimestamp().get(),
      minNonce: commitment.properties.endNonce().get(),
      minTransactionId: commitment.properties.endTransactionId().get(),
      limit: pullLimit, // absolute max number of transactions in a block anyway..
    };

    // Proposed block height and root index
    const operators = operatorsToWallets(config);
    const blockProducer = operators[0];
    const rootProducer = operators[1];
    const blockHash = (await config.provider.getBlock(blockNumber)).hash;
    const blockHeight = state.properties.blockHeight().get().add(1);

    // Increase the blockHeight for the new proposed block height
    commitment.properties.blockHeight().set(blockHeight);

    // grab transactions
    const transactions = await mempool(options, config);

    // block production
    config.console.log(`mempool size: ${transactions.length} | min root target: ${minimumTransactionsPerRoot}`);

    // Get the oldest transaction presented, get their timestamp
    let oldestTime = timestamp;
    if (transactions.length) {
      oldestTime = transactions[0].transaction.getAddon()
        .properties.timestamp().get();
    }

    // less than minimum
    const minimumRequired = transactions.length > minimumTransactionsPerRoot;
    const minimumAge = (timestamp.sub(oldestTime)).gte(maximumTransactionAge);

    // If there are too few transaxctions or there are some but they arn't old enough yet..
    if (!minimumRequired && !minimumAge) {
      return;
    }

    // Get balance
    const producerBalance = await config.provider.getBalance(blockProducer.address);

    // Block production message
    config.console.log(`
Block Production Started:
  Height : ${blockHeight}
  # of txs : ${transactions.length}
  Producer : ${blockProducer.address} (${utils.formatUnits(producerBalance, 'ether')} ether)
    `);

    // Setup Root
    const rootIndex = 0;
    let rootLength = 0;
    let leafHashes = [];
    let root = [];
    let map = {};
    let max = {};

    // Go through transactions
    let transactionIndex = 0;
    for (const { transactionHashId, end, transaction } of transactions) {

      // Get addon, encode tx packed, get leaf hash
      const addon = transaction.getAddon();
      const inputs = protocol.inputs.decodePacked(transaction.properties.inputs().hex());
      const data = addon.properties.data().get();

      // tx metadata
      let metadata = [];

      // go through inputs and append corrent metadata
      let inputIndex = 0;
      for (const input of inputs) {
        const inputHash = data[inputIndex];
        const inputType = input.properties.type().get().toNumber();
        const isWithdraw = 0;

        if (map[inputHash]) {
          metadata.push(map[inputHash]);
        } else {
          const inputProof = await config.db.get([
            interface.db.inputHash,
            inputType,
            isWithdraw,
            inputHash,
          ]);

          switch (inputType) {
            case protocol.inputs.InputTypes.Deposit:
              const deposit = protocol.deposit.Deposit(inputProof);
              metadata.push(protocol.metadata.MetadataDeposit(deposit.object()));
              break;

            default:
              const utxo = protocol.outputs.UTXO(inputProof, null, protocol.addons.UTXO);
              metadata.push(protocol.metadata.Metadata(utxo.getAddon().object()));
              break;
          }
        }
        inputIndex += 1;
      }

      // set metadata
      transaction.properties.metadata().set(metadata.map(m => m.encodePacked()));

      // Now we pack and prepair inputs
      const packed = transaction.encodePacked();
      const packedSize = utils.hexDataLength(packed);
      const transactionLeafHash = utils.keccak256(packed);

      // If the root is full, stop the loop
      if (rootLength + packedSize > rootLengthTarget) break;

      // Include as end of tx
      max = end;

      // Increase root size
      rootLength += packedSize;

      // Add transaction Hash, packed data, metadata in mapping
      leafHashes.push(transactionLeafHash);
      root.push(packed);

      // Go through spendable hashes
      let outputIndex = 0;
      for (const spendableInputHash of addon.properties.spendableOutputs().get()) {
        // Add this spendable output to the map
        if (spendableInputHash != utils.emptyBytes32) {

          // Add this output to the metadata map
          map[spendableInputHash] = protocol.metadata.Metadata({
            blockHeight,
            rootIndex,
            transactionIndex,
            outputIndex,
          });
        }

        // Increase output index
        outputIndex++;
      }

      // Increase transaction index
      transactionIndex++;
    }

    // Refill Root Producers
    await refill(blockProducer, [
      rootProducer.address,
    ], etherPerRoot);

    // Root Header
    const rootHeader = new protocol.root.RootHeader({
      rootProducer: rootProducer.address,
      merkleTreeRoot: protocol.root.merkleTreeRoot(leafHashes, false),
      commitmentHash: utils.keccak256(struct.chunkJoin(root)),
      rootLength,
      feeToken: 0,
      fee: 0,
    });

    // The Root Transaction
    let contract = config.contract.connect(rootProducer);

    // Produce Root
    let rootTx = await contract.commitRoot(
      rootHeader.properties.merkleTreeRoot().get(),
      0,
      0,
      struct.chunkJoin(root),
      commitRootOptions,
    );

    // Wait this Root to Finish
    rootTx = await rootTx.wait();

    // Root hash
    const rootHash = rootHeader.keccak256Packed();

    // Setup the new commitment
    commitment.properties.startTimestamp().set(options.minTimestamp);
    commitment.properties.startNonce().set(options.minNonce);
    commitment.properties.startTransactionId().set(options.minTransactionId);
    commitment.properties.endTimestamp().set(max.timestamp);
    commitment.properties.endNonce().set(max.nonce);
    commitment.properties.endTransactionId().set(max.transactionId);

    // Make block commitment
    contract = config.contract.connect(blockProducer);

    // Commit Block
    const blockCommitment = await contract.commitBlock(
      blockNumber,
      blockHash,
      blockHeight,
      [rootHash], {
      gasLimit: 2000000,
      value: await contract.BOND_SIZE(),
    });

    // Wait on the Block to be produced
    blockReceipt = await blockCommitment.wait();

    // remove txs from the mempool
    await config.db.batch(transactions.map(transaction => ({
      type: 'del',
      key: [ interface.db.mempool,
          transaction.end.timestamp,
          transaction.end.nonce,
          transaction.end.transactionId ],
    })));

    // Set transaction hash
    commitment.properties.transactionHash().set(blockReceipt.transactionHash);

    // Set the new block commitment
    await config.db.put([ interface.db.commitment ], commitment);

    // Final
    config.console.log(`
Block Successfully Committed!
  Height : ${blockHeight}
  # of txs : ${transactions.length}
  Producer : ${blockProducer.address} (${utils.formatUnits(producerBalance, 'ether')} ether)
  Transaction Hash (ETH): ${blockReceipt.transactionHash}
    `);
  } catch (produceError) {
    throw new utils.ByPassError(produceError);
  }
}

module.exports = produce;
