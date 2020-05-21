const { utils, Wallet } = require('ethers');
const _utils = require('../utils/utils');
const interfaces = require('../interfaces/interfaces');
const types = require('../types/types');
const structs = require('../structs/structs');
const errors = require('../errors/errors');
const { parseTransactions } = require('../blocks/parseTransactions');
const { processBlock, transactionsFromReceipt } = require('../blocks/processBlock');
const { addresses } = require('../config/config');
const intakeTransaction = require('../transactions/intakeTransaction');
const streamToArray = require('stream-to-array');

// Fuel Node Sync Process
async function sync(opts = {}) {
  try {
    // Duck-Type Checking
    types.TypeObject(opts);
    types.TypeDB(opts.db);
    if (opts.accounts) { types.TypeDB(opts.accounts); }
    if (opts.commitments) { types.TypeDB(opts.commitments); }
    types.TypeFunction(opts.rpc);
    types.TypeObject(opts.contract);
    types.TypeBoolean(opts.recordTransactions || false);
    if (opts.mempool) { types.TypeDB(opts.mempool); }
    if (opts.keys) { types.TypeObject(opts.keys); }

    // Non-Constant Variables
    let ethereumBlock = await structs.lastEthereumBlockProcessed(opts);
    let ethereumFraudBlock = ((await structs.latestFraudLog(opts)) || {}).blockNumber || _utils.big(0);
    let ethereumHeight = _utils.big(await opts.rpc('eth_blockNumber'));
    let loopPause = false;
    let useLowSpread = false;
    let commitment = structs.commitmentStruct(opts.mempool
        ? (await opts.mempool.get(interfaces.FuelDBKeys.commitment))
        : null); // this holds the commitment data
    let blockProducer = await opts.contract.blockProducer();
    let synced = _utils.big((await opts.db.get(interfaces.FuelDBKeys.blockTip)) || -1)
      .eq(await opts.contract.blockTip());
    let submission_addresses = null;
    let cycle = 0;
    let blockChanged = false;
    let _toBlock = _utils.big(-1);
    let lastFraudProofAttempted = null;
    const _gasLimit = opts.gasLimit || _utils.big(4000000);
    const maximumMempoolAge = opts.maximumMempoolAge || 1000;

    // Handle submission addresses (used to detect foreign root submissions)
    if (opts.keys && (opts.keys || {}).transactions_submission_keys) {
      submission_addresses = opts.keys.transactions_submission_keys
        .map(privateKey => String((new utils.SigningKey(privateKey)).address).toLowerCase());
    }

    // Constant Variables
    const logger = opts.logger || new structs.EmptyLogger();

    // Logger Type Enforcement
    types.TypeObject(opts.logger);

    // Handle Start Log
    if (ethereumBlock !== null) {
      ethereumBlock = ethereumBlock.add(1); // start fresh from last processed
    }

    // Start logging
    logger.log('Sync started..');

    // Start the node while loop
    while (!loopPause) {
      try {
        // Estamblish processing tick..
        await _utils.wait(opts.waitTime || 1000);

        // Ethereum Receipt Logs
        let fuelContractLogs = [];

        // Ethereum block reset to genesis
        if (ethereumBlock === null) {
          ethereumBlock = (await structs.genesisLog(opts)).blockNumber; // start at genesis..
        }

        // Bulk process and copy from the cache to storage every 10 cycles
        // This ensures a fault resistant copy of the DB
        if (cycle >= (opts.cycleInterval || 10)) {
          // Get block tip
          const blockTipRLP = await opts.db.get(interfaces.FuelDBKeys.blockTip);

          // Logger
          logger.log(`[Fuel Sync] ${(new Date())} Ethereum Block Last Synced: ${ethereumBlock.toNumber()} | Ethereum Fraud Block: ${ethereumFraudBlock.toNumber()} | Gas Limit: ${_gasLimit.toNumber()} | Block Producer: ${blockProducer} | Side Chain Block Tip: ${_utils.big(blockTipRLP || 0).toNumber()} | Queued Commitment Height: ${commitment.blockHeight} Roots: ${Object.keys(commitment.roots)}`);

          // Reset cycle to zero
          cycle = 0;
        }

        // Increase cycle
        cycle++;

        // Spread From <> To Block
        let toBlock = ethereumBlock.add(useLowSpread ?
          _utils.big(1) : (opts.ethereumBlockSpread || _utils.big(128)));

        // Attempt to eth_getLogs from contract..
        try {
          // This section is new, wait for confirmations before resetting new block
          // Check current height
          const __currentHeight = _utils.big(await opts.rpc('eth_blockNumber'));

          // Network info, comment out after
          // logger.log(`Fuel: Network height: ${__currentHeight.toNumber()} | To Block Target: ${toBlock.toNumber()} | Height Target: ${ethereumHeight.toNumber()}`);

          // Waiting for blocks to process, stay 10 blocks back
          if (ethereumHeight.gte(__currentHeight.sub(opts.confirmationBlocks || 0))) {
            continue;
          }

          // Check spread for most recent ethereum block..
          if (toBlock.gte(ethereumHeight)) {
            ethereumHeight = _utils.big(await opts.rpc('eth_blockNumber'));
            toBlock = ethereumHeight; // set to last recorded etheruem block number
          }

          // Get logs from the conract..
          fuelContractLogs = await opts.rpc('eth_getLogs', {
            address: opts.contract.address,
            fromBlock: ethereumBlock.toHexString(),
            toBlock: toBlock.toHexString(),
            topics: [],
          });

          // Logs detected
          if (fuelContractLogs.length > 0) {
            logger.log(`[Fuel Sync] ${(new Date())} | logs detected ${fuelContractLogs.length} | between Ethereum blocks: ${ethereumBlock.toNumber()} and ${toBlock.toNumber()}`);
          }

          // After, DB entry, Reset Low Spread, set ethereumBlock to past spread..
          useLowSpread = false;
        } catch (error) {
          // console.error(error);
          useLowSpread = true;
          logger.error('eth_getLogs error, attempting with lower spread...', error);
          continue;
        }

        // log index
        for (var logIndex = 0; logIndex < fuelContractLogs.length; logIndex++) {
          const rawLog = fuelContractLogs[logIndex];
          const log = interfaces.FuelEventsInterface.parseLog(rawLog);

          switch ((log || {}).name) {
            case 'TokenIndex':
              await opts.db.put(interfaces.FuelDBKeys.token
                  + log.values.index.sub(1).toHexString().slice(2), _utils.RLP.encode([
                log.values.token,
              ]));
              await opts.db.put(String(interfaces.FuelDBKeys.tokenID
                  + log.values.token.slice(2)).toLowerCase(), _utils.RLP.encode([
                log.values.index.sub(1).toHexString(),
              ]));
              await opts.db.put(interfaces.FuelDBKeys.numTokens,
                  _utils.RLP.encode( log.values.index.toHexString() ));
              break;

            case 'DepositMade':
              // We can batch these writes..
              const depositHashID = structs.constructDepositHashID({
                account: log.values.account,
                token: log.values.token,
                ethereumBlockNumber: _utils.big(rawLog.blockNumber),
              });

              const amount = await opts.contract.deposits(depositHashID);
              const tokenID = _utils.RLP.decode(await opts.db.get(String(interfaces.FuelDBKeys.tokenID
                  + log.values.token.slice(2)).toLowerCase())).pop();
              const deposit_key = interfaces.FuelDBKeys.deposit
                + depositHashID.toLowerCase().slice(2);
              const deposit_value = _utils.RLP.encode([
                log.values.account,
                log.values.token,
                rawLog.blockNumber,
                tokenID,
                amount.toHexString(),
              ]);

              await opts.db.put(deposit_key, deposit_value);

              // Account is just a list of UTXO keys..
              if (opts.accounts) {
                await opts.accounts.put(deposit_key, String(log.values.account).toLowerCase());
              }

              // if pubnub is available
              if (opts.pubnub) {
                try {
                  await opts.pubnub.publish({
                    channel: String('0x'
                      + String(process.env.chain_id) // chain id
                      + log.values.account.slice(2)).toLowerCase(), // owner address
                    message: {
                    	title: deposit_key,
                    	description: deposit_value,
                    },
                  });
                } catch (error) {
                  console.error(error);
                }
              }
              break;

            case 'TransactionsSubmitted':
              await opts.db.put(interfaces.FuelDBKeys.transactionRoot
                  + log.values.transactionRoot.slice(2), _utils.RLP.encode([
                log.values.producer,
                log.values.merkleTreeRoot,
                log.values.commitmentHash,
                rawLog.transactionHash,
              ]));

              // root header
              const rootHeader = new structs.TransactionRootHeader({
                producer: log.values.producer,
                merkleTreeRoot: log.values.merkleTreeRoot,
                commitmentHash: log.values.commitmentHash,
              });

              // Log sync
              logger.log(`[Fuel Sync] ${(new Date())} | Transactions Submitted | producer ${log.values.producer} | transaction hash ${rawLog.transactionHash} | transaction root ${log.values.transactionRoot} | hash ${rootHeader.hash}`);

              // State that this root has been commited
              // Note this might produce dead roots, but thats okay..
              if (opts.mempool && (opts.keys || {}).block_production_key) {
                if (typeof commitment.roots[rootHeader.hash] !== "undefined") {
                  await opts.mempool.put(interfaces.FuelDBKeys.commitment, structs.commitmentRLP(Object.assign({}, commitment, {
                    roots: Object.assign(commitment.roots, {
                      [rootHeader.hash]: true,
                    }),
                  })));

                  commitment.roots[rootHeader.hash] = true;
                }
              }

              // If this root is not from the producer, lets see if we can dump it into mempool..
              // we do this by picking out transactions and attemping to dump them into the mempool
              if (opts.mempool && submission_addresses
                  .indexOf(String(log.values.producer).toLowerCase()) === -1) {
                let leafs = [];
                let transactionData = [];

                // Attempt to parse out leafs..
                try {
                  // Proof Transactions
                  const proofTransactions = await transactionsFromReceipt(opts.rpc,
                    rawLog.transactionHash);
                  leafs = await parseTransactions(proofTransactions);
                } catch (parseTransactionError) { break; }

                // If leafs has length
                try {
                  if (!leafs.length) { break; }

                  for (let transactionIndex = 0;
                       transactionIndex < leafs.length;
                       transactionIndex++) {
                    transactionData[transactionIndex] = parseTransaction({
                      transactionLeaf: leafs[transactionIndex],
                      db: simulationDB,
                      block: blockHeader,
                      root: rootHeader,
                      transactionIndex,
                      numTokens,
                      contract,
                    });
                  }

                  // Resolve all transactions
                  transactionData = await Promise.all(transactionData);

                  // Interate through and attempt to deploy these txs..
                  for (let transactionIndex = 0;
                       transactionIndex < leafs.length;
                       transactionIndex++) {
                    try {
                      // Attempt transaction intake, foils complex tx dependency ordering attack
                      await intakeTransaction({
                        transaction: [
                          transactionData[transactionIndex].inputs.map(input => _utils.serializeRLP(input.values)),
                          transactionData[transactionIndex].outputs.map(output => _utils.serializeRLP(output.values)),
                          transactionData[transactionIndex].witnesses,
                        ],
                        db: opts.db,
                        mempool: opts.mempool,
                        accounts: opts.accounts,
                        force: true, // accept without considering fees..
                      });
                    } catch (intakeTransactionError) {
                      logger.error('Error while attempting to intake foreign transaction.');
                      logger.error(intakeTransactionError);
                    }
                  }
                } catch (parseIndividualTransactionError) { break; }
              }
              break;

            case 'BlockCommitted':
              // Node is not synced
              synced = false;

              // Get block height from log during processing
              const height = _utils.big(log.values.blockHeight);

              // new block header
              const block = new structs.BlockHeader({
                producer: log.values.blockProducer,
                previousBlockHash: log.values.previousBlockHash,
                ethereumBlockNumber: height.eq(0) ? _utils.big(0) : _utils.big(rawLog.blockNumber),
                blockHeight: height,
                transactionRoots: log.values.transactionRoots,
              });

              // Log sync
              logger.log(`[Fuel Sync] ${(new Date())} | Block Committed | producer ${log.values.blockProducer} | block height ${height} | transaction roots ${log.values.transactionRoots}`);

              // block hash
              const validBlockHash = await opts.contract.blockCommitments(log.values.blockHeight);
              const blockTip = await opts.contract.blockTip();

              // Synced is true
              logger.log(`Syncing block ${height.toNumber()}...`);

              // If block is valid, than process it
              if (block.hash === validBlockHash && block.height.lte(blockTip)) {

                // Num Tokens
                const numTokens = _utils.big(_utils.RLP.decode(
                    await opts.db.get(interfaces.FuelDBKeys.numTokens)));

                // block and block height
                await opts.db.put(interfaces.FuelDBKeys.block
                    + _utils.big(log.values.blockHeight.toNumber())
                      .toHexString().slice(2),
                    _utils.RLP.encode([
                  log.values.blockProducer,
                  log.values.previousBlockHash,
                  rawLog.blockNumber,
                  log.values.blockHeight,
                  log.values.transactionRoots,
                  block.hash,
                ]));

                // Process Block if no light client
                // Processblock should remove mempool keys
                const { success, proof } = await processBlock(block, {
                  db: opts.db,
                  rpc: opts.rpc,
                  accounts: opts.accounts,
                  blockTip,
                  numTokens,
                  contract: opts.contract,
                  recordAccounts: opts.recordAccounts,
                  recordTransactions: opts.recordTransactions,
                  logger });

                // not success
                if (success) {
                  // If the block is the commitment block, remove it from the mempool
                  if (opts.mempool) {
                    if (commitment.blockHeight.eq(block.height)
                      && !_utils.eq(blockProducer, _utils.emptyAddress)) {
                      // We should be removing more here once this block is commited, but that will happen in block process..
                      // to ensure the safe removal of utxo store keys
                      // for now we will just pull mempool transactions from the list..

                      // Remove commitments..
                      // Use stream benifits here instead of array conversion..
                      const commitmentTransactionHashes = (await streamToArray(await opts.commitments.createReadStream()))
                        .map(v => v.key);

                      // Remove transactions from the mempool, they have been processed into a block..
                      await opts.mempool.batch(commitmentTransactionHashes.map(transactionHashKey => ({
                        type: 'del', key: transactionHashKey,
                      })));

                      // clear commitments
                      if (opts.commitments) {
                        await opts.commitments.clear();
                      }

                      // Reset commitments
                      await opts.mempool.put(interfaces.FuelDBKeys.commitment, structs.commitmentRLP({
                        blockHeight: _utils.big(-1),
                        transactionHashes: [],
                        roots: {},
                        age: _utils.unixtime(),
                      }));

                      // Commitment local
                      commitment = {
                        blockHeight: _utils.big(-1),
                        transactionHashes: [],
                        roots: {},
                        age: _utils.unixtime(),
                      };
                    }
                  }

                  // block tip
                  await opts.db.put(interfaces.FuelDBKeys.blockTip,
                      _utils.RLP.encode(log.values.blockHeight.toHexString()));

                  // Syncings
                  if (block.height.eq(blockTip)) {
                    synced = true;
                    logger.log(`Synced to latest side-chain block ${height.toNumber()}!`);
                  }

                  // Stop node at the hard stop..
                  if (opts.hardStop && opts.hardStop.eq(block.height)) {
                    loopPause = true;
                    return;
                  }
                } else {
                  logger.log('Invalid block detected.');

                  if ((opts.keys || {}).fraud_commitment_key) {
                    // Log we are submitting the fraud proof
                    logger.log(`Submitting fraud proof for block ${height.toNumber()}!`,
                      proof.type);

                    // Contract Setup for Fraud Commitment
                    const _contract = opts.contract
                      .connect(new Wallet(opts.keys.fraud_commitment_key,
                        opts.contract.provider));

                    // Submit proof]
                    if (lastFraudProofAttempted !== proof.encoded) {
                      logger.log('Fraud detected, proof detailed below');
                      logger.log(proof);

                      lastFraudProofAttempted = proof.encoded;
                      const fraudTx = await _contract.submitProof(proof.encoded, {
                        gasLimit: _gasLimit,
                      });
                      await fraudTx.wait();

                    } else {
                      logger.log('Fraud proof already attempted, must have failed.');
                    }
                  } else {
                    logger.log(`Fraud detected but no fraud commitment key setup`);
                  }
                }
              }
              break;

            case 'WithdrawalMade':
              // await db.del(FuelDBKeys.withdrawal + input.utxoID.slice(2));
              // await db.del(FuelDBKeys.mempool + FuelDBKeys.withdrawal.slice(2) + input.utxoID.slice(2));
              // Notatre recordAccounts change
              if (opts.accounts) {
                // Token ID
                const tokenID = _utils.big(_utils.RLP.decode(await opts.db.get(String(interfaces.FuelDBKeys.tokenID
                    + log.values.token.slice(2)).toLowerCase())));

                // UTXO Proof creation
                const utxoProof = new structs.UTXOProof({
                  transactionHashId: log.values.transactionHashId,
                  outputIndex: _utils.big(log.values.outputIndex).toNumber(),
                  type: interfaces.FuelOutputTypes.Withdrawal,
                  owner: log.values.account,
                  amount: log.values.amount,
                  tokenID: tokenID,
                });

                // Delete
                await opts.db.del(interfaces.FuelDBKeys.withdrawal
                    + utxoProof.hash.slice(2));
                await opts.db.put(interfaces.FuelDBKeys.storage
                    + interfaces.FuelDBKeys.withdrawal.slice(2)
                    + utxoProof.hash.slice(2), utxoProof.rlp());

                // Input into accounts, we can make this better using batching..
                await opts.accounts
                  .del(interfaces.FuelDBKeys.withdrawal + utxoProof.hash.slice(2));
                await opts.accounts
                  .put(interfaces.FuelDBKeys.withdrawn + utxoProof.hash.slice(2),
                      String(log.values.account).toLowerCase());
              }
              break;

            case 'FraudCommitted':
              // Turn sync off
              synced = false;

              // if fraud not recent, skip
              if (_utils.big(rawLog.blockNumber).lte(ethereumFraudBlock)) { break; }

              // clear all..  a rewind sequence would be great here..
              await opts.db.clear();

              // set new fraud block
              await opts.db.put(interfaces.FuelDBKeys.lastEthereumFraudBlock, _utils.RLP.encode(
                _utils.big(rawLog.blockNumber).toHexString()
              ));

              // Reset block producer..
              blockProducer = await opts.contract.blockProducer();

              // reset from and to block to start for sync
              ethereumBlock = null; // (await structs.genesisLog(opts)).blockNumber;

              // Last fraud block is now this block
              ethereumFraudBlock = _utils.big(rawLog.blockNumber);

              // Continue
              continue;
              break;

            default: throw new errors.FuelError('Invalid log');
          }
        }

        // Set block processed
        if (ethereumBlock !== null && !toBlock.add(1).eq(_toBlock)) {
          await opts.db.put(interfaces.FuelDBKeys.ethereumBlockProcessed,
              toBlock.add(1).toHexString());

          // Eth block update, post DB update
          ethereumBlock = toBlock.add(1);

          // To BLock
          _toBlock = toBlock.add(1);
        }

        // Root hashes
        if (opts.mempool
            && commitment.blockHeight.gt(0)
            && synced) {
          // Root hash keys
          const rootHashes = Object.keys(commitment.roots).slice(0, 255);

          // we really should check just before commitment
          // If mempool is activated, and block height
          if (rootHashes.length > 0
            && rootHashes.filter(hash => commitment.roots[hash]).length === rootHashes.length) {
            try {
              if (commitment.transactionHash) {
                const commitReceipt = opts.rpc('eth_getTransactionReceipt', commitment.transactionHash);

                if (commitReceipt.status && _utils.big(commitReceipt.status || 1).eq(0)) {
                  logger.error(`[Fuel sync] | problem while submitting block receipt: ${JSON.stringify(commitReceipt)}`);
                }
              } else {
                const _contract = opts.contract
                  .connect(new Wallet(opts.keys.block_production_key,
                    opts.contract.provider));

                logger.log(`[Fuel sync] | committing block at: ${commitment.blockHeight.toNumber()} hashes: ${rootHashes}`);

                // Make block commitment
                const commitTx = await _contract.commitBlock(commitment.blockHeight, rootHashes, {
                  value: await opts.contract.BOND_SIZE(),
                  gasLimit: _gasLimit,
                });

                // Push the tx to mempool
                await opts.mempool.put(interfaces.FuelDBKeys.commitment,
                    structs.commitmentRLP(Object.assign({}, commitment, {
                      transactionHash: commitTx.hash,
                    })));
                commitment.transactionHash = commitTx.hash;
              }
            } catch (errorWhileCommiting) {
              logger.error('Error while commiting block');
              logger.error(errorWhileCommiting);
            }
          }
        }

        // Necessary block production elements, time, tip and transactions
        const currentTime = _utils.unixtime();

        // If there is no commitment queue, or the last commitment age is old, begin new commitment
        if (!opts.keys // no keys
          || !synced // not synced
          || !opts.mempool // no mempool db
          || !(opts.keys || {}).transactions_submission_keys // no submission keys
          || !(commitment.blockHeight.eq(_utils.big(-1)) // commitment isn't empy
          || ((currentTime - commitment.age) > _utils.minutes(30)))) { // commitment age is not 30 minutes old
          continue;
        }

        // UTXO's related to this mempool set
        let checkUTXOs = {};

        // Check current time
        const { mempoolTransactions,
            oldestTransactionAge,
            reads } = await structs.getMempoolTransactions(opts.mempool,
                maximumMempoolAge);

        // logger.log('Mempool tx',
        //  mempoolTransactions.length, oldestTransactionAge,
        //  commitment.age, currentTime - maximumMempoolAge);

        // Reads Check UTXOs, this is just to check if any of these UTXOs are somehow magically spent already..
        for (var readIndex = 0; readIndex < reads.length; readIndex++) {
          const checkUTXOKey = interfaces.FuelDBKeys.UTXO
            + reads[readIndex].slice(2);
          checkUTXOs[checkUTXOKey] = await opts.db.get(checkUTXOKey);
        }

        // If certain number of transactions reached in pool, or mempool age has hit maximum
        if (mempoolTransactions.length > 0 &&
            (mempoolTransactions.length > (opts.minimumTransactionVolume || 1000)
            || commitment.age < (currentTime - maximumMempoolAge))) {

          logger.log('Mempool submission process started');

          // Mempool commitment
          await opts.mempool.put(interfaces.FuelDBKeys.commitment, structs.commitmentRLP({
            blockHeight: (await opts.contract.blockTip()).add(1),
            roots: {},
            age: currentTime,
            transactionHashes: [], // empty
          }));

          commitment = structs
            .commitmentStruct(await opts.mempool.get(interfaces.FuelDBKeys.commitment));

          // Returns BytesTransactions roots for this mempool
          const roots = await structs.mempoolToRoots(
            commitment.blockHeight,
            blockProducer, // this is wrong, but we fix with a recompue later.
            mempoolTransactions,
            checkUTXOs);

          // Length of roots we can process..
          let rootsProcessLength = Math.min(roots.length,
              opts.keys.transactions_submission_keys.length);

          // process block addition starts here..
          // Here we run processBlock and test the mempool before it goes out
          // Previous block
          const previousBlock = _utils.RLP.decode(await opts.db
              .get(interfaces.FuelDBKeys.block
                  + _utils.big(commitment.blockHeight.sub(1).toNumber())
                  .toHexString().slice(2) ));

          // new block header
          const commitmentBlockHeader = new structs.BlockHeader({
            producer: blockProducer,
            previousBlockHash: previousBlock[5], // 5 => block hash
            ethereumBlockNumber: ethereumBlock,
            blockHeight: commitment.blockHeight,
            transactionRoots: roots.map(root => root.header.hash)
              .slice(0, rootsProcessLength),
          });

          // Get number of tokens
          const numTokens = _utils.big(_utils.RLP.decode(
              await opts.db.get(interfaces.FuelDBKeys.numTokens)));

          // Preventative process block
          try {
            // We feed in the roots, it knows its a commitment..
            await processBlock(commitmentBlockHeader, {
              db: opts.db,
              rpc: opts.rpc,
              blockTip: commitment.blockHeight.sub(1),
              numTokens,
              contract: opts.contract,
              _roots: roots.slice(0, rootsProcessLength), // this is key for testing
              logger,
            });
          } catch (error) {
            // Shut off root processing..
            rootsProcessLength = 0;
            logger.error('While producing block, error was detected, stop and investigate!');
            logger.error(error);
            throw new errors.ByPassError(error);
          }
          // ends here..

          // Deploy all new roots for commitment...
          for (let rootIndex = 0;
            (rootIndex < rootsProcessLength);
            rootIndex++) {
            // Root Selection
            const root = roots[rootIndex];

            // Attempt to get the root before deploying it..
            const attemptRootRetrieval = await opts.contract
              .blockTransactionRoots(root.header.hash);

            // contract work
            const _contract = opts.contract
              .connect(new Wallet(opts.keys.transactions_submission_keys[rootIndex],
                opts.contract.provider));

            // root recompute
            const rootRecompute = new structs.TransactionRootHeader({
              producer: _contract.signer.address,
              merkleTreeRoot: root.header.merkleTreeRoot,
              commitmentHash: root.header.commitmentHash,
            });

            // Eiher use already produced root, or deploy it
            if (!attemptRootRetrieval || attemptRootRetrieval.lte(0)) {
              try {
                // Commitments
                if (opts.commitments) {
                  // console.log('Root comitment hashes', root.hashes);
                  await opts.commitments.batch(root.hashes.map(keyHash => ({
                    type: 'put',
                    key: keyHash,
                    value: '0x0',
                  })));
                }

                // Attempt submit transaction
                await _contract.submitTransactions(root.header.merkleTreeRoot,
                  root.transactions.encoded, {
                  // gasPrice: _utils.big(1000000000), // try this?
                  gasLimit: _utils.big(7000000), // 8 million?
                });

                // Setup commitment if transaction sent off, false for not committed to L1 chain
                await opts.mempool.put(interfaces.FuelDBKeys.commitment,
                    structs.commitmentRLP(Object.assign({}, commitment, {
                  roots: Object.assign(commitment.roots, {
                    [rootRecompute.hash]: false,
                  }),
                })));

                // Make false here..
                commitment.roots[rootRecompute.hash] = false;

                // Logger Log
                logger.log(`Root submitted, roots waiting commitment ${Object.keys(commitment.roots)}`);
              } catch (submitTransactionError) {
                // Update commitment in mempool
                await opts.mempool.put(interfaces.FuelDBKeys.commitment, structs.commitmentRLP(Object.assign({}, commitment, {
                  blockHeight: _utils.big(-1),
                })));

                // Reset blocks..
                commitment.blockHeight = _utils.big(-1);
                logger.error('Error while submitting transaction root!');
                logger.error(submitTransactionError);
              }
            } else {
              // Update commitment roots, already committed
              await opts.mempool.put(interfaces.FuelDBKeys.commitment, structs.commitmentRLP(Object.assign({}, commitment, {
                roots: Object.assign(commitment.roots, {
                  [rootRecompute.hash]: true,
                }),
              })));

              // Setup commitment if root was already deployed in previous commitment attempt
              commitment.roots[rootRecompute.hash] = true;
            }
          }
        }
      } catch (loopError) {
        console.log(loopError);
        logger.error('Fatal error in loop, attempting to continue processing');
        logger.error(loopError);
      }
    }
  } catch (startupError) {
    throw new errors.ByPassError(startupError);
  }
}

module.exports = sync;
