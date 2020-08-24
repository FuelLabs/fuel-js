const protocol = require('@fuel-js/protocol');
const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
const { simulate } = require('@fuel-js/down');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');
const memdown = require('memdown');
const balance = require('./balance');

function last(array = []) {
  return array[array.length - 1];
}

async function process(block = {}, config = {}) {
  try {
    utils.assert(config.db.supports.local, 'db must support .local');
    const db = database(simulate(config.db.supports.local, memdown()));
    let stats = {
      trades: 0,
      transactions: 0,
    };
    let rootIndex = 0;
    for (const rootHash of block.properties.roots().get()) {
      // establish the root header
      const root = protocol.root.RootHeader(await db.get([
        interface.db.inputHash,
        protocol.inputs.InputTypes.Root,
        0,
        rootHash,
      ]));
      const rootAddon = protocol.addons.RootHeader(root.getAddon());
      rootAddon.properties.blockHeight().set(block.properties.height().get());
      rootAddon.properties.blockProducer().set(block.properties.producer().hex());

      // get the root transaction data
      const transactionData = await config.provider
          .getTransaction(rootAddon.properties.transactionHash().get());
      const calldata = config.contract.interface.parseTransaction(transactionData)
        .args[3];

      // establish the fee token and token for this root
      const feeToken = root.properties.feeToken().get();
      const fee = root.properties.fee().get();

      // attempt to decode the root from data
      let transactions = null;
      try {
        transactions = protocol.root.decodePacked(calldata);
      } catch (malformedBlockError) {
        console.log('malformed block', malformedBlockError);
        utils.assert(0, 'malformed-block');
        break;
        // await config.contract.proveMalformedBlock()
      }

      // attempt transaction decode
      let transactionIndex = 0;
      for (const transactionHex of transactions) {
        let transaction = null;
        try {
          transaction = protocol.transaction.decodePacked(transactionHex);
        } catch (invalidTransaction) {
          console.log('invalid transaction', invalidTransaction);
          utils.assert(0, 'invalid-transaction');
          break;
        }
        const { inputs, outputs, metadata, witnesses } = transaction;

        let transactionTimestamp = [];
        let ins = {};
        let outs = {};
        let data = [];
        let proofs = [];

        // increase transactions
        stats.transactions += 1;

        // trades
        if (witnesses.length > 1) {
          stats.trades += 1;
        }

        // Gather initial inputs, check for invalidInput
        let inputIndex = 0, key = null;
        for (const input of inputs) {
          try {
            const spendableInput = 0;
            switch (input.properties.type().get().toNumber()) {
              case protocol.inputs.InputTypes.Transfer:
                const _key = utils.RLP.encode(interface.db.inputMetadata.encode([
                  protocol.inputs.InputTypes.Transfer,
                  spendableInput,
                  ...metadata[inputIndex].values(),
                ]));
                key = [
                  interface.db.inputMetadata,
                  protocol.inputs.InputTypes.Transfer,
                  spendableInput,
                  ...metadata[inputIndex].values(),
                ];
                proofs.push(protocol.outputs.UTXO(await db.get(key)));
                data.push(last(proofs).keccak256());

                // delete the input metadata key
                await db.del(key);

                // archival deletes
                if (config.archive) {
                  await balance.decrease(
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    last(proofs).properties.amount().get(),
                    config);
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Transfer,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Transfer,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.decrease,
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Transfer,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.inputHash,
                    protocol.inputs.InputTypes.Transfer,
                    spendableInput,
                    last(data)
                  ]);
                }
                break;

              case protocol.inputs.InputTypes.Deposit:
                key = [
                  interface.db.deposit,
                  metadata[inputIndex].properties.blockNumber().get(),
                  metadata[inputIndex].properties.token().get(),
                  input.properties.owner().get(),
                ];
                proofs.push(protocol.deposit.Deposit(await db.get(key)));
                data.push(last(proofs).keccak256());

                // delete input
                if (config.archive) {
                  await balance.decrease(
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    last(proofs).properties.value().get(),
                    config);
                  await db.del([
                    interface.db.owner,
                    input.properties.owner().get(),
                    metadata[inputIndex].properties.token().get(),
                    last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Deposit,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.owner,
                    input.properties.owner().get(),
                    metadata[inputIndex].properties.token().get(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Deposit,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.decrease,
                    input.properties.owner().get(),
                    metadata[inputIndex].properties.token().get(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Deposit,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.inputHash,
                    protocol.inputs.InputTypes.Deposit,
                    spendableInput,
                    last(data)
                  ]);
                }
                break;

              case protocol.inputs.InputTypes.HTLC:
                key = [
                  interface.db.inputMetadata,
                  protocol.inputs.InputTypes.HTLC,
                  spendableInput,
                  ...metadata[inputIndex].values(),
                ];
                proofs.push(protocol.outputs.UTXO(await db.get(key)));
                data.push(last(proofs).keccak256());

                if (block.properties.blockNumber().get()
                  .lte(last(proofs).properties.expiry().get())) {
                  utils.assertHexEqual(utils.keccak256(input.properties.preImage().hex()),
                    last(proofs).properties.digest().hex(), 'htlc-pre-image');
                }

                // increase trades
                stats.trades += 1;

                // delete the metadata input
                await db.del(key);

                // delete input
                if (config.archive) {
                  await balance.decrease(
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    last(proofs).properties.amount().get(),
                    config);
                  await balance.decrease(
                    last(proofs).properties.returnOwner().hex(),
                    last(proofs).properties.token().hex(),
                    last(proofs).properties.amount().get(),
                    config);
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.returnOwner().hex(),
                    last(proofs).properties.token().hex(),
                    last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.returnOwner().hex(),
                    last(proofs).properties.token().hex(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.decrease,
                    last(proofs).properties.returnOwner().hex(),
                    last(proofs).properties.token().hex(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.decrease,
                    last(proofs).properties.owner().hex(),
                    last(proofs).properties.token().hex(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.inputHash,
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(data)
                  ]);
                }
                break;

              case protocol.inputs.InputTypes.Root:
                key = [
                  interface.db.inputMetadata,
                  protocol.inputs.InputTypes.Root,
                  spendableInput,
                  ...metadata[inputIndex].values(),
                ];
                proofs.push(protocol.root.RootHeader(await db.get(key)));
                data.push(last(proofs).keccak256Packed());
                const rootAddon = last(proofs).getAddon();

                // delete metadata input
                await db.del(key);

                // archive deletes
                if (config.archive) {
                  await db.del([
                    interface.db.inputHash,
                    protocol.inputs.InputTypes.Root,
                    spendableInput,
                    last(data)
                  ]);
                  await balance.decrease(
                    rootAddon[1],
                    last(proofs).properties.feeToken().hex(),
                    last(proofs).properties.fee().get()
                      .mul(last(proofs).properties.rootLength().get()),
                    config);
                  await db.del([
                    interface.db.owner,
                    rootAddon[1], // addon.RootHeader.properties.blockProducer
                    last(proofs).properties.feeToken().hex(),
                    rootAddon[0], // addon.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Root,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.owner,
                    rootAddon[1], // addon.RootHeader.properties.blockProducer
                    last(proofs).properties.feeToken().hex(),
                    0, // addon.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Root,
                    spendableInput,
                    last(data)
                  ]);
                  await db.del([
                    interface.db.decrease,
                    rootAddon[1], // addon.RootHeader.properties.blockProducer
                    last(proofs).properties.feeToken().hex(),
                    0, // addon.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Root,
                    spendableInput,
                    last(data)
                  ]);
                }
                break;
            }
            inputIndex++;
          } catch (invalidInput) {
            console.log('invalid input', invalidInput);
            utils.assert(0, 'invalid-input');
            // config.contract.proveInvalidInput(...)
            break;
          }
        } // InputsEnd

        // Compute transactionHashId
        const transactionHashId = protocol.witness
          .transactionHashId(protocol.transaction.Unsigned({
            inputs,
            outputs,
            data,
            signatureFeeToken: feeToken,
            signatureFee: fee,
          }), config.contract, config.network.chainId);

        // Go through the inputs again, this time look for double spends
        inputIndex = 0; // reset index
        for (const input of inputs) {
          let proof = null,
            owner = null,
            amount = utils.bigNumberify(0),
            token = null;

          // The current input position as Metadata
          const inputMetadata = protocol.metadata.Metadata({
            blockHeight: block.properties.height().get(),
            rootIndex,
            transactionIndex,
            outputIndex: inputIndex,
          });

          // InputTypes cases
          switch (input.properties.type().get().toNumber()) {
            case protocol.inputs.InputTypes.Transfer:
              proof = proofs[inputIndex];
              token = proof.properties.token().get();
              amount = proof.properties.amount().get();
              owner = proof.properties.owner().hex();
              break;

            case protocol.inputs.InputTypes.Deposit:
              proof = proofs[inputIndex];
              token = proof.properties.token().get();
              amount = proof.properties.value().get();
              owner = proof.properties.owner().hex();
              break;

            case protocol.inputs.InputTypes.HTLC:
              proof = proofs[inputIndex];
              token = proof.properties.token().get();
              amount = proof.properties.amount().get();
              owner = proof.properties.owner().hex();

              if (block.properties.blockNumber().get()
                .gt(proof.properties.expiry().get())) {
                owner = proof.properties.returnOwner().hex();
              }
              break;

            case protocol.inputs.InputTypes.Root:
              proof = proofs[inputIndex];
              token = proof.properties.feeToken().get();
              amount = proof.properties.fee().get().mul(proof.properties.length().get());
              owner = proof.properties.rootProducer().hex();
              break;
          }

          // increase ins
          ins[utils.bigstring(token)] = (ins[utils.bigstring(token)]
            || utils.bigNumberify(0)).add(amount);

          // check witness
          try {
            let callers = {};
            const witnessReference = input.properties.witnessReference().get().toNumber();

            // if is Caller, get Caller from database
            if (witnesses[witnessReference].properties
                .type().get().toNumber() === protocol.witness.WitnessTypes.Caller) {
              callers[witnesses[witnessReference].keccak256()] = await db.get([
                interface.db.caller,
                witnesses[witnessReference].properties.owner().hex(),
                witnesses[witnessReference].properties.blockNumber().hex(),
              ]);
            }

            // check the witness
            utils.assertHexEqual(owner, protocol
                .witness.recover(witnesses[witnessReference],
                  transactionHashId, callers, block), 'invalid-witness');
          } catch (invalidWitness) {
            console.log('invalid witness', invalidWitness);
            utils.assert(0, 'invalid-witness');
            // config.contract.proveInvalidWitness
          }

          // Increase Index
          inputIndex++;
        } // InputsEnd

        // begin parsing outputs
        let outputIndex = 0;
        let owners = {};
        let spendableHashes = [];
        for (const output of outputs) {
          const outputType = output.properties.type().get().toNumber();
          let token = null, amount = null, owner = null,
            returnOwner = utils.emptyAddress, expiry = 0, digest = utils.emptyBytes32;

          // Resolve addess ID's
          if (outputType !== protocol.outputs.OutputTypes.Return) {
            if (outputType === protocol.outputs.OutputTypes.HTLC) {
              const returnData = output.properties.returnOwner().hex();
              const returnId = utils.bigstring(returnData);

              if (utils.hexDataLength(returnData) < 20 && !owners[returnId]) {
                owners[returnId] = await db.get([ interface.db.address, returnData ]);
              }
            }

            const ownerData = output.properties.owner().hex();
            const ownerId = utils.bigstring(ownerData);

            if (utils.hexDataLength(ownerData) < 20 && !owners[ownerId]) {
              owners[ownerId] = await db.get([ interface.db.address, ownerData ]);
            }
          }

          // Attempt Output Decoding
          try {
            switch (outputType) {
              case protocol.outputs.OutputTypes.Transfer:
                token = protocol.outputs.decodeToken(output, block);
                amount = protocol.outputs.decodeAmount(output);
                owner = protocol.outputs.decodeOwner(output, block, owners);
                break;

              case protocol.outputs.OutputTypes.Withdraw:
                token = protocol.outputs.decodeToken(output, block);
                amount = protocol.outputs.decodeAmount(output);
                owner = protocol.outputs.decodeOwner(output, block, owners);
                break;

              case protocol.outputs.OutputTypes.HTLC:
                token = protocol.outputs.decodeToken(output, block);
                amount = protocol.outputs.decodeAmount(output);
                owner = protocol.outputs.decodeOwner(output, block, owners);
                returnOwner = protocol.outputs.decodeReturnOwner(output, block, owners);
                expiry = output.properties.expiry().get();
                digest = output.properties.digest().get();
                break;

              case protocol.outputs.OutputTypes.Return:
                const returnDataLength = utils.hexDataLength(output.properties.data().hex());
                utils.assert(returnDataLength > 0, 'return-data-overflow');
                utils.assert(returnDataLength < 512, 'return-data-overflow');
                break;
            }
          } catch (invalidTransactionError) {
            console.log('invalid transaction error', invalidTransactionError);
            utils.assert(0, 'invalid-transaction');
            break;
            // config.contract.invalidTransactionError()
          }

          // Handle UTXO outputss
          if (outputType !== protocol.outputs.OutputTypes.Return) {
            const timestamp = utils.timestamp();
            const utxo = protocol.outputs.UTXO({
              transactionHashId,
              outputType,
              outputIndex,
              token,
              amount,
              owner,
              expiry,
              digest,
              returnOwner,
            }, protocol.addons.UTXO({
              timestamp,
              blockHeight: block.properties.height().get(),
              rootIndex,
              transactionIndex,
              outputIndex,
            }));
            const hash = utxo.keccak256();
            const isWithdraw = outputType === protocol.outputs.OutputTypes.Withdraw ? 1 : 0;
            const zeroTimestamp = 0;

            // add to spendable hashes
            spendableHashes.push(!isWithdraw ? hash : utils.emptyBytes32);

            // Build input hash keys
            const inputHashKey = [outputType, isWithdraw, hash];
            const inputMetadataKey = [
              outputType,
              isWithdraw,
              block.properties.height().get(),
              rootIndex,
              transactionIndex,
              outputIndex,
            ];

            // metadata input
            await db.put([interface.db.inputMetadata, ...inputMetadataKey], utxo);

            // Database this output, we database the utxo twice, eventually this will go
            if (returnOwner && config.archive) {
              // increase return owner balance
              await balance.increase(returnOwner, token, amount, config);

              // delete the mempool vbersion
              await db.del([interface.db.owner, returnOwner, token, zeroTimestamp,
                outputType, isWithdraw, hash]);

              // add the processed version, need to remove these also..
              await db.put([interface.db.owner, returnOwner, token, timestamp,
                outputType, isWithdraw, hash], utxo);

              // remove change delta
              await db.del([interface.db.increase, returnOwner, token, zeroTimestamp,
                outputType, isWithdraw, hash]);

              // add the archive stub
              await db.put([
                interface.db.archiveOwner,
                returnOwner,
                transactionData.timestamp * 1000,
                transactionHashId,
              ], transactionHashId);
            }

            // delete the mempool version
            if (config.archive) {
              // input hash
              await db.put([interface.db.inputHash, ...inputHashKey], utxo);

              // add archival inputs with reference to the transactionHashId
              await db.put([interface.db.archiveHash, ...inputHashKey], transactionHashId);
              await db.put([interface.db.archiveMetadata, ...inputMetadataKey], transactionHashId);

              // increase return owner balance
              await balance.increase(owner, token, amount, config);

              // owner deletion
              await db.del([interface.db.owner, owner, token, zeroTimestamp,
                outputType, isWithdraw, hash]);

              // add the processed version
              await db.put([interface.db.owner, owner, token, timestamp,
                outputType, isWithdraw, hash], utxo);

              // remove change delta
              await db.del([interface.db.increase, owner, token, zeroTimestamp,
                outputType, isWithdraw, hash]);

              // add the archive stub
              await db.put([
                interface.db.archiveOwner,
                owner,
                transactionData.timestamp * 1000,
                transactionHashId,
              ], transactionHashId);
            }

            // increase outs
            outs[utils.bigstring(token)] = (outs[utils.bigstring(token)]
              || utils.bigNumberify(0)).add(amount);
          } else {
            if (config.archive) {
              // If it's a Return output, database this as well, this is prunable
              await db.put([interface.db.return, transactionHashId, outputIndex],
                output.properties.data().hex());
            }

            // add a hash here to keep order with returns
            spendableHashes.push(utils.emptyBytes32);
          }
          outputIndex++;
        } // OutputsEnd

        // Include root fee
        if (fee.gt(0)) {
          outs[utils.bigstring(feeToken)] = (outs[utils.bigstring(feeToken)]
            || utils.bigNumberify(0)).add(fee.mul(utils.hexDataLength(transactionHex)));
        }

        // Check for InvalidSum
        const outsKeys = Object.keys(outs).sort();
        const inKeys = Object.keys(ins).sort();
        inKeys.forEach((v, i) => {
          try {
            utils.assert(v === outsKeys[i], 'ins-outs-keys');
            utils.assert(ins[v].eq(outs[outsKeys[i]]), 'inputs-mismatch-outputs');
          } catch (invalidSum) {
            console.log('invalidSum', invalidSum);
            utils.assert(0, 'invalid-sum');
          }
        });

        if (config.archive) {
          // archival metadata, this is prunable
          await db.put([
            interface.db.transactionMetadata,
            block.properties.height().get(),
            rootIndex,
            transactionIndex,
          ], transactionHashId);

          // archival transaction data, this is prunable
          await db.put([
            interface.db.transactionId,
            transactionHashId,
          ], protocol.addons.Transaction({
            transaction: transactionHex,
            data,
            transactionIndex,
            rootIndex,
            inputsLength: inputs.length,
            outputsLength: outputs.length,
            witnessesLength: witnesses.length,
            blockHeight: block.properties.height().get(),
            blockNumber: block.properties.blockNumber().get(),
            timestamp: utils.timestamp(),
            signatureFeeToken: feeToken,
            signatureFee: fee,
            spendableOutputs: spendableHashes,
          }));
        }

        // increase tx index
        transactionIndex++;
      }

      // add this root as a spendable root, add for both hash and metadata addressable
      root.setAddon(rootAddon);

      // input metadata
      await db.put([
          interface.db.inputMetadata,
          protocol.inputs.InputTypes.Root,
          0,
          block.properties.height().get(),
          rootIndex,
          0,
          0,
        ], root);

      // add interface.db.owner input here!
      if (config.archive) {
        try {
          await db.put([
            interface.db.owner,
            block.properties.producer().get(),
            root.properties.feeToken().get(),
            rootAddon.properties.timestamp().get(),
            protocol.inputs.InputTypes.Root,
            0,
            rootHash
          ], root);
          await balance.increase(
            block.properties.producer().get(),
            root.properties.feeToken().get(),
            root.properties.fee().get()
              .mul(root.properties.rootLength().get()),
            config);
        } catch (rootOwnerError) {
          config.console.error(rootOwnerError);
          utils.assert(0, 'root-process-error');
        }

        await db.put([
          interface.db.inputHash,
          protocol.inputs.InputTypes.Root,
          0,
          rootHash,
        ], root);
        await db.put([
          interface.db.archiveHash,
          protocol.inputs.InputTypes.Root,
          0,
          rootHash,
        ], root);
        await db.put([
          interface.db.root,
          block.properties.height().get(),
          rootIndex,
        ], root);
      }

      // Increase Root Index
      rootIndex++;
    }

    let entries = (await streamToArray(db.createReadStream({
      deleted: true,
    }))).map(entry => ({
      type: 'del',
      key: entry.value,
    })).concat((await streamToArray(db.createReadStream({
      beforedeleted: true,
    }))).map(entry => ({
      type: 'put',
      key: entry.key,
      value: entry.value,
    }))).concat((await streamToArray(db.createReadStream({
      afterdeleted: true,
    }))).map(entry => ({
      type: 'put',
      key: entry.key,
      value: entry.value,
    })));

    // 20k per batch, safley 256 per payload for now, ~1.3 minutes per 100k writes
    const batchSize = 20000;
    const payloadSize = 256;
    const numberOfRetries = 10;

    // Entries
    config.console.log(`making ${entries.length} entries for block, batch size: ${batchSize}, payload size: ${payloadSize}`);

    // Make 20k groups of batches, execute them in parallel in payloads of 128 writes each
    for (var retry = 0; retry < numberOfRetries; retry++) {
      try {
        // We attempt a large 20k batch size first, if it fails, than we try smaller batch sizes
        const batchAttemptSize = Math.round(batchSize / (retry + 1));

        // attempt 20k batchs
        for (var bindex = 0; bindex < entries.length; bindex += batchAttemptSize) {
          const _entries = entries.slice(bindex, bindex + batchAttemptSize);
          let batches = [];

          // build the payloads
          for (var index = 0; index < _entries.length; index += payloadSize) {
            batches.push(config.db.batch(_entries.slice(index, index + payloadSize)));
          }

          // send entire batch and payloads in parallel
          await Promise.all(batches);
        }

        // if all is well, break retry cycle, carry on..
        break;
      } catch (error) {
        // wait 10 seconds for potentially more connections
        await utils.wait(10000);

        // let the terminal know a batch error has occured
        config.console.error(`batch processing error: ${error.message}`);
      }
    }

    // clear the cache / simulation db
    await db.clear();

    // return the stats for this block
    return stats;
  } catch (processError) {
    config.console.log('process error', processError);
    throw new utils.ByPassError(processError);
  }
}

module.exports = process;
