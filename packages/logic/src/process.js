const protocol = require('@fuel-js/protocol');
const utils = require('@fuel-js/utils');
const database = require('@fuel-js/database');
const { simulate } = require('@fuel-js/down');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');
const memdown = require('memdown');
// const level = require('leveldown');

function last(array = []) {
  return array[array.length - 1];
}

async function process(block = {}, config = {}) {
  try {
    if (!config.db.supports.local) throw new Error('db must support local');
    const db = database(simulate(config.db.supports.local, memdown()));

    let stats = {
      trades: 0,
      transactions: 0,
    };
    let rootIndex = 0;
    for (const rootHash of block.properties.roots().get()) {
      const root = protocol.root.RootHeader(await db.get([
        interface.db.inputHash,
        protocol.inputs.InputTypes.Root,
        0,
        rootHash,
      ]));
      const rootAddon = protocol.addons.RootHeader(root.getAddon());
      rootAddon.properties.blockHeight().set(block.properties.height().get());
      rootAddon.properties.blockProducer().set(block.properties.producer().hex());
      const transactionData = await config.provider
          .getTransaction(rootAddon.properties.transactionHash().get());
      const calldata = config.contract.interface.parseTransaction(transactionData)
        .args[3];
      const feeToken = root.properties.feeToken().get();
      const fee = root.properties.fee().get();


      // attempt to decode the root from data
      let transactions = null;
      try {
        transactions = protocol.root.decodePacked(calldata);
      } catch (malformedBlockError) {
        console.log('malformed block', malformedBlockError);
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
                key = [
                  interface.db.inputMetadata,
                  protocol.inputs.InputTypes.Transfer,
                  spendableInput,
                  ...metadata[inputIndex].values(),
                ];
                proofs.push(protocol.outputs.UTXO(await db.get(key)));
                data.push(last(proofs).keccak256());

                await db.del([
                  interface.db.owner,
                  last(proofs).properties.owner().hex(),
                  protocol.inputs.InputTypes.Transfer,
                  spendableInput,
                  last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                  last(data)
                ]);
                await db.del([
                  interface.db.owner,
                  last(proofs).properties.owner().hex(),
                  protocol.inputs.InputTypes.Transfer,
                  spendableInput,
                  0, // addons.RootHeader.properties.timestamp
                  last(data)
                ]);
                // delete input
                await db.del(key);
                await db.del([
                  interface.db.inputHash,
                  protocol.inputs.InputTypes.Transfer,
                  spendableInput,
                  last(data)
                ]);
                await db.del([
                  interface.db.spent, protocol.inputs.InputTypes.Transfer, last(data)
                ]);
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
                await db.del([
                  interface.db.owner,
                  input.properties.owner().get(),
                  protocol.inputs.InputTypes.Deposit,
                  spendableInput,
                  last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                  last(data)
                ]);
                await db.del([
                  interface.db.owner,
                  input.properties.owner().get(),
                  protocol.inputs.InputTypes.Deposit,
                  spendableInput,
                  0, // addons.RootHeader.properties.timestamp
                  last(data)
                ]);
                await db.del([
                  interface.db.inputHash,
                  protocol.inputs.InputTypes.Deposit,
                  spendableInput,
                  last(data)
                ]);
                await db.del([
                  interface.db.spent, protocol.inputs.InputTypes.Deposit, last(data)
                ]);
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
                } else {
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.returnOwner.hex(),
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                    last(data)
                  ]);
                  await db.del([
                    interface.db.owner,
                    last(proofs).properties.returnOwner.hex(),
                    protocol.inputs.InputTypes.HTLC,
                    spendableInput,
                    0, // addons.RootHeader.properties.timestamp
                    last(data)
                  ]);
                }

                // increase trades
                stats.trades += 1;

                // delete input
                await db.del([
                  interface.db.owner,
                  last(proofs).properties.owner().hex(),
                  protocol.inputs.InputTypes.HTLC,
                  spendableInput,
                  last(proofs).getAddon()[0], // addons.RootHeader.properties.timestamp
                  last(data)
                ]);
                await db.del([
                  interface.db.owner,
                  last(proofs).properties.owner().hex(),
                  protocol.inputs.InputTypes.HTLC,
                  spendableInput,
                  0, // addons.RootHeader.properties.timestamp
                  last(data)
                ]);
                await db.del(key);
                await db.del([
                  interface.db.inputHash,
                  protocol.inputs.InputTypes.HTLC,
                  spendableInput,
                  last(data)
                ]);
                await db.del([
                  interface.db.spent, protocol.inputs.InputTypes.HTLC, last(data)
                ]);
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

                // delete input
                await db.del([
                  interface.db.owner,
                  rootAddon[1], // addon.RootHeader.properties.blockProducer
                  protocol.inputs.InputTypes.Root,
                  spendableInput,
                  rootAddon[0], // addon.RootHeader.properties.timestamp
                  last(data)
                ]);
                await db.del([
                  interface.db.owner,
                  rootAddon[1], // addon.RootHeader.properties.blockProducer
                  protocol.inputs.InputTypes.Root,
                  spendableInput,
                  0, // addon.RootHeader.properties.timestamp
                  last(data)
                ]);
                await db.del(key);
                await db.del([
                  interface.db.inputHash,
                  protocol.inputs.InputTypes.Root,
                  spendableInput,
                  last(data)
                ]);
                await db.del([
                  interface.db.spent, protocol.inputs.InputTypes.Root, last(data)
                ]);
                break;
            }
            inputIndex++;
          } catch (invalidInput) {
            console.log('invalid input', invalidInput);
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
            // config.contract.proveInvalidWitness
          }

          // Increase Index
          inputIndex++;
        } // InputsEnd

        // begin parsing outputs
        let outputIndex = 0;
        let owners = {};
        for (const output of outputs) {
          const outputType = output.properties.type().get().toNumber();
          let token = null, amount = null, owner = null,
            returnOwner = utils.emptyAddress, expiry = 0, digest = utils.emptyBytes32;

          // Resolve addess ID's
          if (outputType !== protocol.outputs.OutputTypes.Return) {
            const ownerData = output.properties.owner().hex();
            if (utils.hexDataLength(ownerData) < 20 && !owners[ownerData]) {
              owners[ownerData] = await db.get([ interface.db.address, ownerData ]);
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
                break;
            }
          } catch (invalidTransactionError) {
            console.log('invalid transaction error', invalidTransactionError);
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

            // Database this output, we database the utxo twice, eventually this will go
            if (returnOwner) {
              // delete the mempool vbersion
               await db.del([interface.db.owner, returnOwner, outputType, isWithdraw,
                    zeroTimestamp, hash]);

              // add the processed version, need to remove these also..
              await db.put([interface.db.owner, returnOwner, outputType, isWithdraw,
                timestamp, hash], hash);

              // add the archive stub
              await db.put([
                interface.db.archiveOwner,
                returnOwner,
                transactionData.timestamp * 1000,
                transactionHashId,
              ], transactionHashId);
            }
            // delete the mempool version
            await db.del([interface.db.owner, owner, outputType, isWithdraw,
               zeroTimestamp, hash]);

            // add the processed version
            await db.put([interface.db.owner, owner, outputType, isWithdraw,
              timestamp, hash], hash);

            // add the archive stub
            await db.put([
              interface.db.archiveOwner,
              owner,
              transactionData.timestamp * 1000,
              transactionHashId,
            ], transactionHashId);

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

            // add inputs
            await db.put([interface.db.inputHash, ...inputHashKey], utxo);
            await db.put([interface.db.inputMetadata, ...inputMetadataKey], utxo);

            // add archival inputs with reference to the transactionHashId
            await db.put([interface.db.archiveHash, ...inputHashKey], utxo);
            await db.put([interface.db.archiveMetadata, ...inputMetadataKey], utxo);

            // increase outs
            outs[utils.bigstring(token)] = (outs[utils.bigstring(token)]
              || utils.bigNumberify(0)).add(amount);
          } else {
            // If it's a Return output, database this as well, this is prunable
            await db.put([interface.db.return, transactionHashId, outputIndex],
              output.properties.data().hex());
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
          }
        });

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
        }));

        // increase tx index
        transactionIndex++
      }

      // add this root as a spendable root, add for both hash and metadata addressable
      root.setAddon(rootAddon);
      await db.put([
        interface.db.inputHash,
        protocol.inputs.InputTypes.Root,
        0,
        rootHash,
      ], root);
      await db.put([
        interface.db.root,
        block.properties.height().get(),
        rootIndex,
      ], root);
      await db.put([
          interface.db.inputMetadata,
          protocol.inputs.InputTypes.Root,
          0,
          block.properties.height().get(),
          rootIndex,
          0,
          0,
        ], root);
    }

    // Make all the deletes to the database
    await config.db.batch((await streamToArray(db.createReadStream({
      deleted: true,
    }))).map(entry => ({
      type: 'del',
      key: entry.value,
    })));

    // Make all the puts to the database, do not add internal delete keys
    await config.db.batch((await streamToArray(db.createReadStream({
      beforedeleted: true,
    }))).map(entry => ({
      type: 'put',
      key: entry.key,
      value: entry.value,
    })));

    // Make all the puts to the database, do not add internal delete keys
    await config.db.batch((await streamToArray(db.createReadStream({
      afterdeleted: true,
    }))).map(entry => ({
      type: 'put',
      key: entry.key,
      value: entry.value,
    })));

    // clear the cache / simulation db
    await db.clear();

    // return the stats for this block
    return stats;
  } catch (processError) {
    console.log('process error', processError);
    throw new utils.ByPassError(processError);
  }
}

module.exports = process;
