const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const interface = require('@fuel-js/interface');
const process = require('./process');
const produce = require('./produce');
const genesis = require('./genesis');
const balance = require('./balance');
const bondRetrieval = require('./bondRetrieval');
const transactRoot = require('./root');
const reconcileMempoolBalance = require('./reconcileMempoolBalance');

/// @dev the Fuel sync sequence to sync against node logs.
async function sync(config = {}) {
  try {
    // clear db before syncing
    if (config.clear && config.prompt) {
      // ask to clear
      utils.assert(await config.prompt.confirm('are you sure you want to clear?'),
        'clear-confirm');

      // console log
      config.console.log(`clearing database...`);

      // clear the database
      await config.db.clear();
    }

    // Ideal spead is 100 logs.
    const SCAN_LOGS_SIZE = config.scanSize || 512;

    // setup state, get from DB or blank state
    let state = null;
    try {
      state = protocol.state.State(await config.db.get([
        interface.db.state,
      ]));
    } catch (stateError) {
      state = protocol.state.State({
        // We start 1 block behind genesis.
        blockNumber: await genesis(config) - 1,
      });
    }

    // sync start message
    config.console.log(`
  sync started on network ${config.network.name} with contract ${config.contract.address}
    | block production : ${config.produce ? 'on' : 'off'}
    |     archive mode : ${config.archive ? 'on' : 'off'}
    |         write fs : ${config.write ? 'on' : 'off'}
    |            state : ${JSON.stringify(state.object())}`);

    // Finalization delay.
    const FINALIZATION_DELAY = await config.contract.FINALIZATION_DELAY();

    // Setup contract address, namely for testing / sanity checks
    await config.db.put([
      interface.db.contract,
    ], config.contract.address);

    // Begin primary sync loop
    while (state) {
      try {
        // Current ethereum block number.
        let blockNumber = null;
        try {
          blockNumber = await config.provider.getBlockNumber();
        } catch (blockNumberError) {
          // Log the error. 
          config.console.error(blockNumberError);

          // Wait 4 seconds.
          await utils.wait(4000);

          // Try again.
          continue;
        }

        // Current block number.
        const fromBlock = state.properties.blockNumber()
          .get()
          .add(1)
          .toNumber();

        // Ensure blocks have enough confirmations.
        // Also: if Client is up to sync with current chain.
        // This is if the sync loop doesn't have enough confs.
        if (fromBlock > (
          blockNumber - config.confirmations
        )) {
          // Wait console log.
          config.console.log(`waiting for ${
            config.confirmations || 0
          } confirmations, synced @: ${
            state.properties.blockNumber().get().toNumber()
          } network @: ${
            blockNumber
          } `);

          // This simply scans the mempool for txs
          // Keeps a marker of what has been scanned
          // Updates balances of affected users
          if (config.archive) {
            await reconcileMempoolBalance(config);
          }

          // Do the bond retrieval, add FINALIZATION_DELAY.
          await bondRetrieval(state, {
            ...config,
            FINALIZATION_DELAY,
          });

          // If a plugin is available.
          if (config.plugin) {
            await config.plugin(state, config);
          }

          // Stop sync. overflow check.
          if (config.stopForOverflow
            || !config.block_time) return;

          // Continue or stop.
          if (config.continue) {
            if (!config.continue(state)) {
              state = null;
              return;
            }
          }

          // Wait 2 second, this allows for mempool syncing.
          await utils.wait(2000);
          
          // Restart & check again.
          continue;
        }

        // Get log properties.
        const getLogProps = {
          fromBlock,
          toBlock: blockNumber - config.confirmations,
          address: config.contract.address,
        };

        // If the to block is to big, just reduce it.
        if (getLogProps.toBlock - getLogProps.fromBlock 
          > SCAN_LOGS_SIZE) {
            getLogProps.toBlock = getLogProps.fromBlock + SCAN_LOGS_SIZE;
        }

        // Scraping logs.
        config.console.log(`scraping from: ${
          getLogProps.fromBlock
        } to ${
          getLogProps.toBlock
        }`);

        // Get logs.
        let logs = null;
        try {
          logs = await config.provider.getLogs(getLogProps);
        } catch (getLogsError) {
          // Log it.
          config.console.error('get logs error');
          config.console.error(getLogsError);

          // Wait 4 seconds.
          await utils.wait(4000);

          // Try again.
          continue;
        }

        // Logs detected.
        config.console.log(`# logs detected: ${logs.length}`);

        // state before new logs
        const preState = state.encodePacked();

        // go through logs
        for (const log of logs) {
          // parse log
          const event = config.contract.interface.parseLog(log);

          // If the log blockNumber is greater than toBlock, stop.
          // And record the state. Ensures better failure cases in sync.
          // In theory this will process out this toBlock, than stop.
          if (log.blockNumber > getLogProps.toBlock) {
            break;
          }

          // handle each event from the contract, put in DB
          switch (event.name) {
            case 'DepositMade':
              const timestamp = utils.timestamp();
              // More precise deposit tracking.
              const depositAmount = await config.contract.depositAt(
                event.values.owner,
                event.values.token,
                log.blockNumber,
              );
              const deposit = protocol.deposit.Deposit({
                ...event.values,
                value: depositAmount,
                blockNumber: log.blockNumber,
              }, protocol.addons.Deposit({
                timestamp,
                transactionHash: log.transactionHash,
              }));
              const depositHash = deposit.keccak256();
              const notWithdrawal = 0;

              // This data is prunable.
              if (config.archive) {
                // Attempt to retrieve deposit, if it exists, skip increase, otherwise process increase.
                try {
                  await config.db.get([
                    interface.db.deposit2,
                    deposit.properties.owner().get(),
                    deposit.properties.token().get(),
                    deposit.properties.blockNumber().get(),
                  ]);
                } catch (getDepositError) {
                  await balance.increaseSyncAndMempool(
                    event.values.owner,
                    event.values.token,
                    deposit.properties.value().get(),
                    config,
                    depositHash);
                }
                
                await config.db.put([
                  interface.db.inputHash,
                  protocol.inputs.InputTypes.Deposit,
                  notWithdrawal,
                  depositHash,
                ], deposit);

                // Put spent in place for balance rec.
                try {
                  await db.get([
                    interface.db.spent,
                    protocol.inputs.InputTypes.Deposit,
                    depositHash,
                  ]);
                } catch (err) {
                  await config.db.put([
                    interface.db.owner,
                    event.values.owner,
                    event.values.token,
                    timestamp,
                    protocol.inputs.InputTypes.Deposit,
                    notWithdrawal,
                    depositHash,
                  ], deposit);
                }

                // Archive this hash.
                await config.db.put([
                  interface.db.archiveHash,
                  protocol.inputs.InputTypes.Deposit,
                  notWithdrawal,
                  depositHash,
                ], log.transactionHash);

                // Archive this deposit
                await config.db.put([
                  interface.db.depositArchive,
                  deposit.properties.owner().get(),
                  deposit.properties.token().get(),
                  deposit.properties.blockNumber().get(),
                ], deposit);
              }

              // Write the deposit.
              await config.db.put([
                interface.db.deposit2,
                deposit.properties.owner().get(),
                deposit.properties.token().get(),
                deposit.properties.blockNumber().get(),
              ], deposit);
              break;

            case 'TokenIndexed':
              await config.db.put([interface.db.token, event.values.id],
                  event.values.token);
              await config.db.put([interface.db.tokenId, event.values.token],
                  event.values.id);
              state.properties.numTokens().set(event.values.id.add(1));

              if (config.archive && config.erc20) {
                // This registeres some metadata about this token.
                try {
                  await config.db.put([
                    interface.db.tokenMetadata,
                    event.values.id,
                  ], await protocol.token.encodeTokenMetadata(
                    event.values.token,
                    config,
                  ));
                } catch (tokeMetadataError) {
                  config.console.error('token metadata error');
                  config.console.error(tokeMetadataError);
                }
              }
              break;

            case 'AddressIndexed':
              await config.db.put([interface.db.address, event.values.id],
                  event.values.owner);
              await config.db.put([interface.db.addressId, event.values.owner],
                  event.values.id);
              state.properties.numAddresses().set(event.values.id.add(1));
              break;

            case 'RootCommitted':
              const root = protocol.root.RootHeader(
                event.values,
                protocol.addons.RootHeader({
                  timestamp: utils.timestamp(),
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                }),
              );

              // Advance root production.
              try {
                // Attempt to transact this root if third-party.
                await transactRoot(log, root, config);
              } catch (transactRootError) {
                // Make the error known.
                config.console.error('invalid root transact');
                config.console.error(transactRootError);
              }

              // Add the root to the DB.
              const isWithdrawableTx = 0;
              await config.db.put([
                interface.db.inputHash,
                protocol.inputs.InputTypes.Root,
                isWithdrawableTx,
                root.keccak256Packed(),
              ], root);
              break;

            case 'BlockCommitted':
              const block = protocol.block.BlockHeader({
                ...event.values,
                blockNumber: log.blockNumber,
              }, protocol.addons.BlockHeader({
                timestamp: utils.timestamp(),
                transactionHash: log.transactionHash,
              }));

              // Check the block isn't fraud.
              const blockTip = await config.contract.blockTip();
              const blockHash = await config.contract.blockCommitment(block.properties.height().get());

              // Checks.
              const blockGreaterThanTip = block.properties.height().get().gt(blockTip);
              const blockHashInvalid = block.keccak256Packed() !== blockHash;
              const blockNotGenesis = block.properties.height().get().gt(0);

              // Check if it's a fraudulent block.
              if ((blockGreaterThanTip || blockHashInvalid) && blockNotGenesis) {
                config.console.log(`skipping fraudulant block ${
                  block.properties.height().get().toNumber()
                } ${
                  block.keccak256Packed()
                }`);
                continue;
              }

              // We will now see if this block has already been successfully processed, if so, we skip.
              try {
                // Attempt reteiving this block.
                const getBlock = protocol.block.BlockHeader(await config.db.get([
                  interface.db.block,
                  block.properties.height().get(),
                ]));

                // If the block in the DB is the one being processed now, we skip.
                if (getBlock.keccak256Packed() === block.keccak256Packed()) {
                  // Write new height.
                  state.properties.blockHeight().set(block.properties.height().get());

                  // block height
                  config.console.log(`block already committed and skipped @ height ${
                    block.properties.height().get().toNumber()
                  }`);

                  // The sequence will stop, ensuring better failure case for future block writes.
                  getLogProps.toBlock = log.blockNumber;

                  // continue;
                  continue;
                }
              } catch (getBlockError) {
                config.console.log(`no block @ height ${
                  block.properties.height().get().toNumber()
                } ... processing ...`);
              }

              config.console.log(`processing block height ${
                block.properties.height().get().toNumber()
              }`);
              const {
                trades,
                transactions,
                success,
              } = await process(block, config);

              // If success, 
              if (success) {
                state.properties.transactions()
                  .set(state.properties.transactions().get().add(transactions));
                state.properties.trades()
                  .set(state.properties.trades().get().add(trades));

                // Write new height.
                state.properties.blockHeight().set(block.properties.height().get());

                // block height
                config.console.log(`block committed @ height ${
                  block.properties.height().get().toNumber()
                }`);
              } else {
                config.console.log(`fraud detected while processing block ${
                  block.properties.height().get().toNumber()
                }`);
              }

              // We set the toBlock max to this block number.
              // If the log processed in question is greater.
              // The sequence will stop, ensuring better failure case for future block writes.
              getLogProps.toBlock = log.blockNumber;
              break;

            case 'FraudCommitted':
              // block height
              config.console.log(`fraud committed @ height ${
                event.values.previousTip
              } new tip: ${
                event.values.currentTip
              }`);
              break;

            case 'WithdrawalMade':
              const withdraw = protocol.withdraw.WithdrawProof(event.values);

              // If it's a block retrieval, skip it.
              if (withdraw.properties.transactionLeafHash()
                .hex() === utils.emptyBytes32) {
                  continue;
              }

              // Remove the withdrawal key.
              const isWithdraw = 1;
              const metadataKey = [
                interface.db.inputMetadata,
                protocol.outputs.OutputTypes.Withdraw,
                isWithdraw,
                event.values.blockHeight,
                event.values.rootIndex,
                event.values.transactionIndex,
                event.values.outputIndex,
              ];
              const utxo = protocol.outputs.UTXO(await config.db.get(metadataKey));
              const hash = utxo.keccak256();

              // prunable / archive
              if (config.archive) {
                // Attempt to get withdraw from DB, if not processed, decrease, otherwise skip
                try {
                  await config.db.get([interface.db.withdraw, withdraw.keccak256Packed()]);
                } catch (getWithdrawError) {
                  await balance.decrease(
                    balance.withdrawAccount(event.values.owner),
                    utxo.properties.token().get(),
                    utxo.properties.amount().get(),
                    config,
                    hash);
                }
                await config.db.put([interface.db.withdraw, withdraw.keccak256Packed()],
                  protocol.withdraw.Withdraw(event.values));

                await config.db.del([
                  interface.db.owner,
                  event.values.owner,
                  utxo.properties.token().get(),
                  utxo.getAddon()[0],
                  protocol.outputs.OutputTypes.Withdraw,
                  isWithdraw,
                  hash,
                ]);
                await config.db.del([
                  interface.db.owner,
                  event.values.owner,
                  utxo.properties.token().get(),
                  0,
                  protocol.outputs.OutputTypes.Withdraw,
                  isWithdraw,
                  hash,
                ]);
              }

              await config.db.del([
                interface.db.inputHash,
                protocol.outputs.OutputTypes.Withdraw,
                isWithdraw,
                hash,
              ]);
              await config.db.del(metadataKey);
              break;

            case 'WitnessCommitted':
              await config.db.put([
                interface.db.caller,
                event.values.owner,
                event.values.blockNumber
              ], event.values.transactionId);
              break;

            default: throw new Error('unknown event log');
          }
        }

        // processed log
        config.console.log(`processed: ${logs.length} logs`);

        // Set new etheruem block Number.
        state.properties.blockNumber().set(
          getLogProps.toBlock,
        );

        // Produce a block if the variables are right.
        if (config.produce && config.archive) {
          try {
            await produce(blockNumber, state, config);
          } catch (productionError) {
            config.console.error('Production error:');
            config.console.error(productionError);
          }
        }

        // if new state changes have occured, update the state, otherwise wait a block
        if (preState !== state.encodePacked()) {

          // make an emmittion
          if (config.emit) {
            try {
              await config.emit({
                channel: `fuel_v1_${config.network.name}_state`,
                message: state.encodeRLP(),
              });
            } catch (emitError) {}
          }

          // state
          await config.db.put([
            interface.db.state,
          ], state);
        } else {
          await utils.wait(config.block_time);
        }

        // If the configuration has a continue method, feed it the state, ask when to stop
        if (config.continue) {
          if (!config.continue(state)) {
            state = null;
            return;
          }
        }

        // Throttle the client so it doesn't ping client to much.
        if (config.throttle) {
          await utils.wait(config.throttle || 0);
        }
      } catch (loopError) {
        // state = null; // stop loop for now.., remove later
        config.console.error('loop error, stopping');
        config.console.error(loopError);
        return;
      }
    }
  } catch (syncError) {
    throw new utils.ByPassError(syncError);
  }
}

module.exports = sync;
