const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const interface = require('@fuel-js/interface');
const struct = require('@fuel-js/struct');
const mempool = require('./mempool');
const operatorsToWallets = require('./operatorsToWallets');
const reconcileMempoolBalance = require('./reconcileMempoolBalance');

// Max root producers
const maxBlockRoots = 128;

// Minimum txs per root
const minimumTransactionsPerRoot = 8000;

// One hour
const oneHour = 3600;

// The oldest a transaction can be until it needs to be publshed, unixtimes
const maximumTransactionAge = oneHour * 1000;

// pull limit from mempool
const pullLimit = 12000;

// Root commitment options.
const commitRootOptions = {
  gasLimit: 1500000,
};

// Cost per Root.
const etherPerRoot = utils.parseEther('0.13');

// The maximum root size in bytes.
const maxRootSize = 31000;

// Search through roots to find highest referenced root this tx could exist in.
/// @dev This will locate a placement root given the utxo's.
function findReferencedRootIndex(roots = [], utxos = []) {
    // The return root index to start.
    let rootIndex = 0;

    // Scan through roots, from 0 to max (increasing).
    for (
        let _rootIndex = 0;
        _rootIndex < roots.length;
        _rootIndex++) {
        // The selectred root to check.
        const root = roots[_rootIndex];

        // Scan through hashes.
        for (const hash of utxos) {
            // If the tx's utxos are in this root, than select this root as a candidate.
            if (root.utxos[hash]) {
                rootIndex = _rootIndex;
            }
        }
    }

    // Return resulting root index.
    return rootIndex;
}

// Find a root for a given transaction.
function findRootIndex(roots = [], transaction = {}) {
    // Get addon, encode tx packed, get leaf hash
    const addon = transaction.getAddon();
    const inputs = protocol.inputs.decodePacked(
        transaction.properties
            .inputs()
            .hex(),
    );
    const data = addon.properties.data().get();
    
    // Add two for the length specifier.
    const transactionPackedSize = transaction.properties
        .length()
        .get()
        .add(2);

    // Now we pack and prepair inputs after metadata is formatted
    const packedSize = transactionPackedSize.toNumber();
    const signatureFeeToken = addon.properties.signatureFeeToken()
        .get();
    const signatureFee = addon.properties.signatureFee()
        .get();

    // Return root index.
    let rootIndex = null;

    // Filter roots.
    for (
        let _rootIndex = findReferencedRootIndex(
            roots,
            data,
        );
        _rootIndex < roots.length;
        _rootIndex++) {
        // Select the root.
        const root = roots[_rootIndex];

        // If root size is right and fee type.
        if (root.size + packedSize <= maxRootSize
            && signatureFeeToken.eq(root.token)
            && signatureFee.eq(root.fee)
        ) {
            rootIndex = _rootIndex;
            break;
        }
    }

    // If no good root fit is found, return null.
    return rootIndex;
}

// Find metadata from the root data.
function findMetadata(roots = [], inputHash = '0x') {
    // Interate through roots, find the correct metadata.
    for (const root of roots) {
        if (root.utxos[inputHash]) {
            return root.utxos[inputHash];
        }
    }
}

// Add transaction to root.
async function addTransaction(
    roots = {},
    rootIndex = null,
    transaction = {},
    config = {},
    blockHeight = null,
) { 
    // Select the root.
    const root = roots[rootIndex];

    // Decode transaction data.
    const addon = transaction.getAddon();
    const inputs = protocol.inputs
        .decodePacked(
            transaction.properties.inputs().hex(),
        );
    const data = addon.properties.data().get();

    // Add transaction to the root.
    const transactionIndex = root.transactions.length;

    // add two for the length specifier
    const transactionPackedSize = transaction.properties
        .length().get().add(2);

    // Now we pack and prepair inputs after metadata is formatted
    const packedSize = transactionPackedSize.toNumber();

    // Add to total root size.
    root.size += packedSize;

    // The metadata for this transaction.
    let metadata = [];

    // Go through inputs and append corrent metadata.
    let inputIndex = 0;
    for (const input of inputs) {
      const inputHash = data[inputIndex];
      const inputType = input.properties.type() 
        .get().toNumber();
      const isWithdraw = 0;

      // Seek through this blocks utxos.
      const foundMetadata = findMetadata(
          roots,
          inputHash,
      );

      // if the input is within this block, already mapped, use that in metadata
      if (foundMetadata) {
        metadata.push(foundMetadata);
      } else {
        // otherwise attempt to see if it's been mapped in previous blocks
        // if it can't be found here, it likely contains an input already spent
        try {
          // Get the input proof from the db.
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
          config.console.error('no hash error!');
          config.console.error(noHashError);
          utils.assert(0, 'no-input-found');
        }
      }

      // Increase input index. 
      inputIndex += 1;
    }

    // Add spendable input hashes to this root.
    let outputIndex = 0;
    for (const spendableInputHash of addon.properties
        .spendableOutputs().get()) {
        // If this is an empty hash don't include it.
        if (spendableInputHash !== utils.emptyBytes32) {
            // Add spendable has to this root.
            root.utxos[spendableInputHash] = protocol.metadata.Metadata({
                blockHeight,
                rootIndex: rootIndex,
                transactionIndex,
                outputIndex,
            });
        }

        // Increase output index.
        outputIndex++;
    }
    
    // Set the transaction metadata.
    transaction.properties.metadata().set(
        metadata.map(m => m.encodePacked()),
    );

    // Add transaction too root.
    root.transactions.push(
        transaction,
    );

    // Return the root.
    return root;
}

// Produce a Fuel block.
async function produce(currentBlockNumber = {}, state = {}, config = {}) {
    // Wait in blockNumber for production.
    let commitmentWait = protocol.addons.CommitmentWait({});
    try {
      // If commitment is available, it hasn't been processed yet.
      commitmentWait = protocol.addons.CommitmentWait(
        await config.db.get([ interface.db.commitmentWait ]),
      );
    } catch (noCommitmentError) {}

    // Stop the block production sequence,
    // if there is a block waiting to be committed.
    if (commitmentWait.properties.time().get().gt(0)
      && state.properties.blockNumber().get()
      .lt(commitmentWait.properties.time().get())) {
        return;
    }

    // Get commitment
    /*
    let commitment = protocol.addons.Commitment(state.object());
    try {
      // If commitment is available, it hasn't been processed yet.
      commitment = protocol.addons.Commitment(await config.db.get([ interface.db.commitment ]));
    } catch (noCommitmentError) {}
    */

    // if current height is less than commitment, stop
    /*
    if (state.properties.blockHeight().get()
      .lt(commitment.properties.blockHeight().get())) {
      return;
    }

    // if the current state blockheight is at or past previous commit, start new commitment
    if (state.properties.blockHeight().get()
      .gte(commitment.properties.blockHeight().get())) {
      commitment = protocol.addons.Commitment(state.object());
    }
    */

    // Get state blocknumber from state
    const blockNumber = state.properties.blockNumber()
        .get().toNumber();

    // Establish current micro time
    const timestamp = utils.timestamp();

    // The difference between the current num and block number.
    const difference = currentBlockNumber - blockNumber;

    // If the different between current block and the recorded state block
    // Does not have enough confirmations or there is not enough sync, stop the process.
    // Between 7 and 14 confirmations.
    if (blockNumber > currentBlockNumber
      || difference < config.confirmations
      || difference > config.confirmations * 2) {
        return;
    }

    // Reconcile balances before processing.
    await reconcileMempoolBalance(config);

    // collection
    const options = {
      minTimestamp: 0,  //commitment.properties.endTimestamp().get(),
      minNonce: 0, //commitment.properties.endNonce().get(),
      minTransactionId: 0, //commitment.properties.endTransactionId().get(),
      limit: config.pullLimit || pullLimit,
    };

    // Proposed block height and root index
    const operators = operatorsToWallets(config);
    const blockProducer = operators[0]; // first operator is block producer

    // Production operator.
    const productionOperator = config.proxy
      ? config.proxy.address
      : blockProducer.address;

    // The block hash for the current blockNumber
    const blockHash = (await config.provider.getBlock(blockNumber)).hash;

    // Current block height.l
    const currentBlockHeight = state.properties.blockHeight().get();

    // The New block Heigth
    const blockHeight = currentBlockHeight.add(1);

    // Increase the blockHeight for the new proposed block height
    // commitment.properties.blockHeight().set(blockHeight);

    // grab transactions
    const transactions = await mempool(options, config);

    // minimum target per root, adjustable for testing
    const minimumTargetTransactions = config.minimumTransactionsPerRoot === 0
      ? 0
      : (config.minimumTransactionsPerRoot
        || minimumTransactionsPerRoot);

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
    const minimumAge = (timestamp.sub(oldestTime))
      .gte(config.maximumTransactionAge || maximumTransactionAge);

    // If there are too few transaxctions or there are some but they arn't old enough yet..
    if (!minimumRequired && !minimumAge) {
      return;
    }

    // Get balance
    const producerBalance = await config.provider.getBalance(blockProducer.address);

    // producer root potential
    let productionRootPotential = producerBalance
      .sub(etherPerRoot) // 1 roots worht for gas expenditure
      .sub(await config.contract.BOND_SIZE()) // bond
      .div(etherPerRoot);

    // Produce root.
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

    // Console log this info
    config.console.log(`producer balance: ${utils.formatEther(producerBalance)} ether, max roots potential: ${rootMaximum}`);

    // Producer balance empty..
    if (!rootMaximum) {
      config.console.error(`producer balance empty ${blockProducer.address}, please refill!`);
    }

    // not enough balance to produce roots
    if (!rootMaximum) return;

    // Block Roots.
    let roots = [];

    // The transactions that have been processed.
    let processed = [];

    // The contract for block production.
    const contract = config.contract.connect(blockProducer); // rootProducers[rootIndex]);

    // Check if block height on-chain is the same as the one in state.
    if (!(await config.contract.blockTip())
      .eq(currentBlockHeight)) {
      return;
    }

    // If there is a commitment wait in place
    // Then roots are already deployed, so we skip root produciton to deploy those.
    if (commitmentWait.properties.time().get().gt(0)) {
      config.console.log('Third-party producer detected, waiting for root submission delay.');

      // Set roots.
      roots = commitmentWait.properties.roots().get()
        .map(hash => ({ hash }));

      // Set procssed, decode and rebuild.
      processed = commitmentWait.properties.processed().get()
        .map(transaction => {
          const decoded = utils.RLP.decode(transaction);
          return {
            timestamp: decoded[0],
            nonce: decoded[1],
            transactionId: decoded[2],
          };
        });
    } else {
      // Go through all them and queue them into seperate roots.
      for (const {
          // transactionHashId,
          end,
          transaction,
      } of transactions) {
          // Get token fee and fee token.
          const addon = transaction.getAddon();
          const signatureFeeToken = addon.properties
              .signatureFeeToken()
              .get();
          const signatureFee = addon.properties
              .signatureFee()
              .get();

          // Find a root for this transaction
          // if none available, create one
          let rootIndex = findRootIndex(
              roots,
              transaction,
          );

          // Too many roots, stop adding txs.
          if (rootIndex === null
            && roots.length >= rootMaximum) break;

          // If no root found, add a root.
          if (rootIndex === null) {
              // Add a root.
              roots.push({
                  size: 0, // size in bytes.
                  token: signatureFeeToken, // fee token type.
                  fee: signatureFee, // fee.
                  utxos: {}, // hash => metadata.
                  transactions: [], // index => _Transaction.
                  header: null, // root header.
                  hash: utils.emptyAddress, // root header hash.
              });

              // Set the root to add tx too.
              rootIndex = roots.length - 1;

              // Set root index.
              roots[rootIndex].index = rootIndex;
          }

          // Add transaction to this root.
          roots[rootIndex] = await addTransaction(
              roots,
              rootIndex,
              transaction,
              config,
              blockHeight,
          );

          // Add to processed
          processed.push(end);
      }

      // Interate through roots, build the headers.
      for (const root of roots) {
          // The leafs.
          const leafs = root.transactions.map(
              transaction => transaction.encodePacked(),
          );

          // Hashes.
          const hashes = leafs.map(
              leaf => utils.keccak256(leaf),
          );

          // Root Header
          root.header = new protocol.root.RootHeader({
              rootProducer: blockProducer.address, // rootProducers[rootIndex].address,
              merkleTreeRoot: protocol.root.merkleTreeRoot(
                  hashes,
                  false,
              ),
              commitmentHash: utils.keccak256(
                  struct.chunkJoin(leafs),
              ),
              rootLength: root.size,
              feeToken: root.token,
              fee: root.fee,
          });

          // Root hash
          root.hash = root.header.keccak256Packed();
      }

      // Deploy the roots onto Ethereum.
      for (const root of roots) {

        // root existance check.
        const rootExists = (await config.contract
          .rootBlockNumberAt(root.hash)).gt(0);

        // if the root does not exist, deploy it.
        if (rootExists) continue;

        // Produce Root.
        let rootTx = await contract.commitRoot(
          root.header.properties.merkleTreeRoot().get(),
          root.token,
          root.fee,
          struct.combine(root.transactions),
          {
            ...commitRootOptions,
          }
        );

        // Root committed message
        config.console.log(`
  Commiting Root..
  Root Hash : ${root.hash}
  Transacts : ${root.transactions.length}
  Fee Token : ${root.token}
        Fee : ${root.fee}
  Root Size : ${root.header.properties.rootLength().get()} bytes
        `);

        // Wait this Root to Finish
        rootTx = await rootTx.wait();

        // Root committed message
        config.console.log(`
  Committed Root..
  Root Hash : ${root.hash}
  Completed : ${JSON.stringify(rootTx, null, 2)}
        `);
      }
    }

    // Get the operator.
    const operator = await contract.operator();

    // If there has been no commitment wait and the block producer
    // Is not the operator, than stop the sequence.
    // We will need to wait for the SUBMISSION delay before continuing.
    if (productionOperator !== operator
      && commitmentWait.properties.time().get().lte(0)) {
      config.console.log('Third party operator detected, starting a commitment wait.');

      // Current block number + submission delay.
      commitmentWait.properties.time().set(
        state.properties.blockNumber()
        .get()
        .add(await contract.SUBMISSION_DELAY()),
      );

      // Set the deployed roots.
      commitmentWait.properties.roots().set(
        roots.map(root => root.hash),
      );

      // Processed.
      commitmentWait.properties.processed().set(
        processed.map(transaction => utils.RLP.encode([
          utils.bigNumberify(transaction.timestamp),
          utils.bigNumberify(transaction.nonce),
          transaction.transactionId,
        ])),
      );

      // Set commitment wait in the DB.
      await config.db.put([
        interface.db.commitmentWait
      ], commitmentWait);

      // Stop production sequence.
      return;
    }

    // Block commitment tx.
    let blockCommitment = null;

    // Wait a few seconds.
    if (config.increaseBlock) {
      await config.increaseBlock(5);
    }

    // If the proxy is turned on.
    if (config.proxy) {
      config.console.log('Committing block as proxy');

      // Commit transaction encoded data.
      const commitTx = contract.interface.functions.commitBlock.encode([
        blockNumber,
        blockHash,
        blockHeight,
        roots.map(root => root.hash),
      ]);

      // Set block commitment.
      blockCommitment = await config.proxy.transact(
        contract.address,
        await contract.BOND_SIZE(),
        commitTx,
        {
            gasLimit: 4000000,
            value: await contract.BOND_SIZE(),
        },
      );
    } else {
      config.console.log('Committing block as sender.');

      // Non proxied, i.e. a key is used.
      blockCommitment = await contract.commitBlock(
        blockNumber,
        blockHash,
        blockHeight,
        roots.map(root => root.hash), {
        gasLimit: 2500000,
        value: await contract.BOND_SIZE(),
      });
    }

    // Wait on the Block to be produced
    blockReceipt = await blockCommitment.wait();

    // Set transaction hash
    /*
    commitment.properties.transactionHash().set(
        blockReceipt.transactionHash,
    );
    */

    // Set the new block commitment
    /*
    await config.db.put([
        interface.db.commitment,
    ], commitment);
    */

    // Final
    config.console.log(`
Block Successfully Committed!
      Height : ${blockHeight}
  # of roots : ${roots.length}
    Producer : ${blockProducer.address} (${utils.formatEther(producerBalance)} ether)
     Tx Hash : ${blockReceipt.transactionHash}
    `);

    // remove txs from the mempool
    await config.db.batch(processed.map(transaction => ({
        type: 'del',
        key: [
            interface.db.mempool,
            transaction.timestamp,
            transaction.nonce,
            transaction.transactionId,
        ],
    })));

    // If the third party commitment was a success
    // Let's delete the commitment wait.
    if (commitmentWait.properties.time().get().gt(0)) {
      await config.db.del([ interface.db.commitmentWait ]);
    }

    // removed
    config.console.log(`Mempool items removed success.`);
}

module.exports = produce;