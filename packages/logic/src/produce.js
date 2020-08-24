const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const mempool = require('./mempool');
const interface = require('@fuel-js/interface');
const refill = require('@fuel-js/refill');
const struct = require('@fuel-js/struct');
const transact = require('./transact');
const ethers = require('ethers');

// The root size target in bytes, currently 32kb
const rootLengthTarget = 31000;

// Max root producers
const maxRootProducers = 128;

// Max root producers
const maxBlockRoots = 128;

// default root producers
const defaultRootProducers = 8;

// Minimum txs per root
const minimumTransactionsPerRoot = 200;

// One hour
const oneHour = 3600;

// The oldest a transaction can be until it needs to be publshed, unixtimes
const maximumTransactionAge = oneHour * 1000;

// pull limit from mempool
const pullLimit = 2000;

// Root commitment options
const commitRootOptions = {
  gasLimit: 1500000,
};

// Cost per Root
const etherPerRoot = utils.parseEther('0.13');

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
    // If the client isn't synced enough up to current block
    if (blockNumber > currentBlockNumber
      || currentBlockNumber - blockNumber < config.confirmations
      || currentBlockNumber - blockNumber > (config.confirmations + 5)) {
      return;
    }

    // collection
    const options = {
      minTimestamp: 0,  //commitment.properties.endTimestamp().get(),
      minNonce: 0, //commitment.properties.endNonce().get(),
      minTransactionId: 0, //commitment.properties.endTransactionId().get(),
      limit: pullLimit,
    };

    // Proposed block height and root index
    const operators = operatorsToWallets(config);
    const blockProducer = operators[0]; // first operator is block producer
    // const rootProducer = operators[1];
    // const rootProducers = operators.slice(1, 2); // next are root producers

    // The block hash for the current blockNumber
    const blockHash = (await config.provider.getBlock(blockNumber)).hash;

    // The New block Heigth
    const blockHeight = state.properties.blockHeight().get().add(1);

    // Increase the blockHeight for the new proposed block height
    commitment.properties.blockHeight().set(blockHeight);

    // grab transactions
    const transactions = await mempool(options, config);

    // minimum target per root, adjustable for testing
    const minimumTargetTransactions = config.minimumTransactionsPerRoot === 0
      ? 0
      : (config.minimumTransactionsPerRoot || minimumTransactionsPerRoot);

    // block production
    config.console.log(`mempool size: ${transactions.length} | min root target: ${minimumTargetTransactions}`);

    // Get the oldest transaction presented, get their timestamp
    let oldestTime = timestamp;
    if (transactions.length) {
      oldestTime = transactions[0].transaction.getAddon()
        .properties.timestamp().get();
    }

    // less than minimum
    const minimumRequired = transactions.length > minimumTargetTransactions;
    const minimumAge = (timestamp.sub(oldestTime)).gte(maximumTransactionAge);

    // If there are too few transaxctions or there are some but they arn't old enough yet..
    if (!minimumRequired && !minimumAge) {
      return;
    }

    // Get balance
    const producerBalance = await config.provider.getBalance(blockProducer.address);

    // producer root potential
    let productionRootPotential =  producerBalance
      .sub(etherPerRoot) // 1 roots worht for gas expenditure
      .sub(await config.contract.BOND_SIZE()) // bond
      .div(etherPerRoot);

    if (productionRootPotential.gt(maxBlockRoots)) {
      productionRootPotential = utils.bigNumberify(maxBlockRoots);
    }

    // The maximum number of roots the producer can produce for this block given their balance
    let rootMaximum = Math.min(
      // producer balance estimate
      productionRootPotential.toNumber(),

      // Max blocks per root i.e. 128
      maxBlockRoots,
    );

    // ROOT MAX
    // rootMaximum = 128;

    // Console log this info
    config.console.log(`producer balance: ${utils.formatEther(producerBalance)} ether, max roots potential: ${rootMaximum}`);

    // not enough balance to produce roots
    if (!rootMaximum) return;

    // Setup Root Production
    let transactionCount = 0;
    let rootIndex = 0;
    let roots = [];
    let processed = [];
    let spent = {};
    let map = {};
    let max = {};

    // go through max amount of roots
    for (;rootIndex < rootMaximum;) {
      // root length
      let rootLength = 0;
      let leafHashes = [];
      let root = [];

      // Go through transactions
      let transactionIndex = 0;
      for (const { transactionHashId, end, transaction } of transactions.slice(transactionCount)) {

        // Get addon, encode tx packed, get leaf hash
        const addon = transaction.getAddon();
        const inputs = protocol.inputs.decodePacked(transaction.properties.inputs().hex());
        const data = addon.properties.data().get();

        // tx metadata
        let metadata = [];
        let containsSpent = false;

        // add two for the length specifier
        const transactionPackedSize = transaction.properties.length().get().add(2);

        // Now we pack and prepair inputs after metadata is formatted
        const packedSize = transactionPackedSize.toNumber();

        // target root length
        const targetRootLength = config.rootLengthTarget || rootLengthTarget;

        // If the root is full, stop the loop
        if (rootLength + packedSize > targetRootLength) break;

        // go through inputs and append corrent metadata
        let inputIndex = 0;
        for (const input of inputs) {
          const inputHash = data[inputIndex];
          const inputType = input.properties.type().get().toNumber();
          const isWithdraw = 0;

          // if the input is within this block, already mapped, use that in metadata
          if (map[inputHash]) {
            metadata.push(map[inputHash]);
          } else {
            // otherwise attempt to see if it's been mapped in previous blocks
            // if it can't be found here, it likely contains an input already spent
            try {
              const inputProof = await config.db.get([
                interface.db.inputHash,
                inputType,
                isWithdraw,
                inputHash,
              ], { remote: true }); // was not remote before

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
            } catch (noHashError) {
              console.log('no hash error!', noHashError);
              utils.assert(0, 'no-input-found');
              containsSpent = true;
            }
          }

          // if input already spent, mark it
          if (spent[inputHash]) {
            containsSpent = true;
          }

          // Mark spent
          spent[inputHash] = true;
          inputIndex += 1;
        }

        // if it contains an input already spent, DB it for investigation and than ignore it
        if (containsSpent) {
          utils.assert(0, `mempool stale ${end.timestamp} ${end.nonce} ${end.transactionId}`);
          return;
          // continue;
        }

        // set metadata
        transaction.properties.metadata().set(metadata.map(m => m.encodePacked()));

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

        // pack the transaction with appropriate metadata and build the new leaf
        const packed = transaction.encodePacked();
        const transactionLeafHash = utils.keccak256(packed);

        // Set latest max to the new *end*, increase rootLenght
        // add leafHash, add tx to processed
        max = end;
        rootLength += packedSize;
        leafHashes.push(transactionLeafHash);
        root.push(packed);
        processed.push(end);

        // Increase transaction index
        transactionIndex++;
        transactionCount++;
      }

      // if no transactions, go to the next possible root
      if (transactionIndex <= 0) break;

      // Root Header
      const header = new protocol.root.RootHeader({
        rootProducer: blockProducer.address, // rootProducers[rootIndex].address,
        merkleTreeRoot: protocol.root.merkleTreeRoot(leafHashes, false),
        commitmentHash: utils.keccak256(struct.chunkJoin(root)),
        rootLength,
        feeToken: 0,
        fee: 0,
      });

      // Add to roots
      roots.push({
        hash: header.keccak256Packed(),
        header,
        root,
      });

      // Increase Root Index
      rootIndex++;
    }

    // if no viable roots, stop sequence
    if (!roots.length) return;

    // Block production message
    config.console.log(`
Block Production Started
      Height : ${blockHeight}
  # of roots : ${roots.length}
    # of txs : ${transactionCount}
    Producer : ${blockProducer.address} (${utils.formatEther(producerBalance)} ether)
    `);

    // Refill Root Producers
    /*
    await refill(blockProducer,
      rootProducers.map(producer => producer.address),
      etherPerRoot);
      */

    // all the root transactions being deployed
    let rootTransactions = [];
    let nonce = await blockProducer.getTransactionCount();

    // The Root Transaction
    const contract = config.contract.connect(blockProducer); // rootProducers[rootIndex]);

    // ROOT COMMITMENTS
    for (const { hash, header, root } of roots) {

      // root existance check
      const rootExists = (await config.contract.rootBlockNumberAt(hash)).gt(0);

      // if the root does not exist, deploy it
      if (rootExists) continue;

      // Produce Root
      const rootTx = await contract.commitRoot(
        header.properties.merkleTreeRoot().get(),
        0,
        0,
        struct.chunkJoin(root),
        {
          ...commitRootOptions,
          // nonce: nonce,
        }
      );

      // Root committed message
      config.console.log(`
Commiting Root
Root Hash : ${hash}
Root Size : ${header.properties.rootLength().get()} bytes
 Tx Nonce : ${rootTx.hash} ${nonce}
      `);

      // wait a second for mempool to pick up previous
      await utils.wait(1500);

      // increase nonce virtually
      nonce += 1;

      // Add to pending root transactions
      rootTransactions.push(rootTx.wait());

      // Wait this Root to Finish
      // rootTx =
      await rootTx.wait();
    }

    // Wait for all roots to deploy
    // await Promise.all(rootTransactions);

    // Root committed message
    config.console.log(`Roots Committed: ${rootTransactions.length}`);

    // Commit Block
    const blockCommitment = await contract.commitBlock(
      blockNumber,
      blockHash,
      blockHeight,
      roots.map(root => root.hash), {
      gasLimit: 2500000,
      value: await contract.BOND_SIZE(),
    });

    // Wait on the Block to be produced
    blockReceipt = await blockCommitment.wait();

    // Set transaction hash
    commitment.properties.transactionHash().set(blockReceipt.transactionHash);

    // Set the new block commitment
    await config.db.put([ interface.db.commitment ], commitment);

    // Final
    config.console.log(`
Block Successfully Committed!
      Height : ${blockHeight}
  # of roots : ${roots.length}
    # of txs : ${transactionCount}
    Producer : ${blockProducer.address} (${utils.formatEther(producerBalance)} ether)
     Tx Hash : ${blockReceipt.transactionHash}
    `);

    // remove txs from the mempool
    await config.db.batch(processed.map(transaction => ({
      type: 'del',
      key: [ interface.db.mempool,
          transaction.timestamp,
          transaction.nonce,
          transaction.transactionId ],
    })));

    // removed
    config.console.log(`mempool items removed`);
  } catch (produceError) {
    throw new utils.ByPassError(produceError);
  }
}

module.exports = produce;
