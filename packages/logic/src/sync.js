const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const interface = require('@fuel-js/interface');
const process = require('./process');
const produce = require('./produce');
const genesis = require('./genesis');
const balance = require('./balance');

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

    // setup state, get from DB or blank state
    let state = null;
    let spread = 1;
    try {
      state = protocol.state.State(await config.db.get([ interface.db.state ]));
    } catch (stateError) {
      state = protocol.state.State({
        blockNumber: await genesis(config),
      });
    }

    // sync start message
    config.console.log(`
  sync started on network ${config.network.name} with contract ${config.contract.address}
    | block production : ${config.produce ? 'on' : 'off'}
    |     archive mode : ${config.archive ? 'on' : 'off'}
    |            state : ${JSON.stringify(state.object())}`);

    // Setup contract address, namely for testing / sanity checks
    await config.db.put([ interface.db.contract ], config.contract.address);

    // Begin primary sync loop
    while (state) {
      try {
        // current ethereum block number
        const blockNumber = await config.provider.getBlockNumber();

        // spread low
        if (state.properties.blockNumber().get().add(spread).gt(blockNumber)) spread = 1;

        // ensure blocks have enough confirmations
        if (state.properties.blockNumber().get()
          .gt(blockNumber - config.confirmations) && config.block_time) {
          config.console.log(`waiting for ${config.confirmations + 1} confirmations, synced @: ${state.properties.blockNumber().get().toNumber()} network @: ${blockNumber} `);
          await utils.wait(config.block_time * (config.confirmations + 1));
          continue; // restart & check again
        }

        // scraping logs
        config.console.log(`scraping logs from: ${state.properties.blockNumber().get().toNumber()} to: ${state.properties.blockNumber().get().add(1).toNumber()}`);

        // get logs
        const logs = await config.provider.getLogs({
          fromBlock: state.properties.blockNumber().get().toNumber(),
          toBlock: state.properties.blockNumber().get().add(spread).toNumber(),
          address: config.contract.address,
        });

        // logs detected
        config.console.log(`logs detected: ${logs.length}`);

        // state before new logs
        const preState = state.encodePacked();

        // go through logs
        for (const log of logs) {
          // parse log
          const event = config.contract.interface.parseLog(log);

          // handle each event from the contract, put in DB
          switch (event.name) {
            case 'DepositMade':
              const timestamp = utils.timestamp();
              const deposit = protocol.deposit.Deposit({
                ...event.values,
                blockNumber: log.blockNumber,
              }, protocol.addons.Deposit({
                timestamp,
                transactionHash: log.transactionHash,
              }));
              const depositHash = deposit.keccak256();
              const notWithdrawal = 0;

              await config.db.put([
                interface.db.deposit,
                deposit.properties.blockNumber().get(),
                deposit.properties.token().get(),
                deposit.properties.owner().get(),
              ], deposit);

              // this data is prunable
              if (config.archive) {
                await balance.increase(
                  event.values.owner,
                  event.values.token,
                  deposit.properties.value().get(),
                  config);
                await config.db.put([
                  interface.db.inputHash,
                  protocol.inputs.InputTypes.Deposit,
                  notWithdrawal,
                  depositHash
                ], deposit);
                await config.db.put([
                  interface.db.owner,
                  event.values.owner,
                  event.values.token,
                  timestamp,
                  protocol.inputs.InputTypes.Deposit,
                  notWithdrawal,
                  depositHash,
                ], deposit);
                await config.db.put([
                  interface.db.archiveHash,
                  protocol.inputs.InputTypes.Deposit,
                  notWithdrawal,
                  depositHash
                ], log.transactionHash);
              }
              break;

            case 'TokenIndexed':
              await config.db.put([interface.db.token, event.values.id],
                  event.values.token);
              await config.db.put([interface.db.tokenId, event.values.token],
                  event.values.id);
              state.properties.numTokens().set(event.values.id.add(1));
              break;

            case 'AddressIndexed':
              await config.db.put([interface.db.address, event.values.id],
                  event.values.owner);
              await config.db.put([interface.db.addressId, event.values.owner],
                  event.values.id);
              state.properties.numAddresses().set(event.values.id.add(1));
              break;

            case 'RootCommitted':
              const root = protocol.root.RootHeader(event.values, protocol.addons.RootHeader({
                timestamp: utils.timestamp(),
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
              }));
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

              // check the block isn't fraud
              const blockTip = await config.contract.blockTip();
              const blockHash = await config.contract.blockCommitment(block.properties.height().get());

              // checks
              const blockGreaterThanTip = block.properties.height().get().gt(blockTip);
              const blockHashInvalid = block.keccak256Packed() !== blockHash;
              const blockNotGenesis = block.properties.height().get().gt(0);

              // check if it's a fraudulent block
              if ((blockGreaterThanTip || blockHashInvalid) && blockNotGenesis) {
                config.console.log(`skipping fraudulant block ${block.properties.height().get().toNumber()} ${block.keccak256Packed()}`);
                continue;
              }

              config.console.log(`processing block height ${block.properties.height().get().toNumber()}`);
              const { trades, transactions } = await process(block, config);
              await config.db.put([
                interface.db.block,
                block.properties.height().get(),
              ], block);
              state.properties.blockHeight().set(block.properties.height().get());
              state.properties.transactions()
                .set(state.properties.transactions().get().add(transactions));
              state.properties.trades()
                .set(state.properties.trades().get().add(trades));

              // block height
              config.console.log(`block committed @ height ${block.properties.height().get().toNumber()}`);
              break;

            case 'FraudCommitted':
              // the new valid tip block header
              const tip = protocol.block.BlockHeader(await config.db.get([
                interface.db.block,
                event.values.currentTip,
              ]));

              // block height
              config.console.log(`fraud committed @ height ${event.values.previousTip} new tip: ${event.values.currentTip}`);
              break;

            case 'WithdrawalMade':
              const withdraw = protocol.withdraw.WithdrawProof(event.values);
              await config.db.put([interface.db.withdraw, withdraw.keccak256Packed()],
                protocol.withdraw.Withdraw(event.values));
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
              await config.db.del(metadataKey);
              await config.db.del([
                interface.db.inputHash,
                protocol.outputs.OutputTypes.Withdraw,
                isWithdraw,
                hash,
              ]);

              // prunable / archive
              if (config.archive) {
                await balance.decrease(
                  event.values.owner,
                  utxo.properties.token().get(),
                  utxo.properties.amount().get(),
                  config);
                await config.db.del([
                  interface.db.owner,
                  event.values.owner,
                  utxo.properties.token().get(),
                  utxo.getAddon()[0],
                  protocol.outputs.OutputTypes.Withdraw,
                  isWithdraw,
                  hash,
                ]);
              }
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

        // set new etheruem block Number
        state.properties.blockNumber()
          .set(state.properties.blockNumber().get().add(spread + 1));

        // max spread
        if (logs.length <= 0) spread = 100;

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
          await config.db.put([interface.db.state], state);
        } else {
          await utils.wait(config.block_time);
        }

        // after a certain cycle or amount, we process the mempool
        if (config.produce && config.archive) {
          await produce(state, config);
        }

        // if the configuration has a continue method, feed it the state, ask when to stop
        if (config.continue) {
          if (!config.continue(state)) {
            state = null;
            return;
          }
        }
      } catch (loopError) {
        // state = null; // stop loop for now.., remove later
        config.console.error(loopError);
        return;
      }
    }
  } catch (syncError) {
    throw new utils.ByPassError(syncError);
  }
}

module.exports = sync;
