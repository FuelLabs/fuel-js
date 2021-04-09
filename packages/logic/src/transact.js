const protocol = require('@fuel-js/protocol');
const utils = require('@fuel-js/utils');
const batch = require('@fuel-js/batch');
const struct = require('@fuel-js/struct');
const interface = require('@fuel-js/interface');
const balance = require('./balance');

/// @dev the main mempool intake for transactions.
async function transact(unsigned = '0x', _witnesses = '0x', nonce = 0, config = {}) {
  try {
    // decoding
    const decoded = protocol.transaction
      .Unsigned.decodeRLP(unsigned);
    const witnesses = protocol.witness.decodePacked(_witnesses);
    const data = utils.toLowerCaseHex(decoded.properties.data().get());
    const inputs = protocol.inputs.decodePacked(decoded.properties.inputs().hex());
    const outputs = protocol.outputs.decodePacked(decoded.properties.outputs().hex());

    // mismatch length checks
    utils.assert(inputs.length === data.length, 'inputs-data-length-mismatch');

    // if testing mode
    if (!(config.contract || {}).address) {
      config.contract = {
        address: await config.db.get([ interface.db.contract ], {
          remote: true,
        }),
      };
      config.contract.chainId = config.network.chainId;
    }

    // gather ids, transaction hash ids
    const transactionHashId = protocol.witness.transactionHashId(
      decoded,
      config.contract,
      config.network.chainId
    );

    // Get Owner ids from Data
    const ownerIds = protocol.outputs.decodeOwnerIds(outputs);
    const ownerIdsKeys = ownerIds.map(id => [interface.db.address, id]);

    // Get State Registered Callers, if Any from Witnesses
    const callerWitnesses = protocol.witness.filter(witnesses);
    const callerKeys = callerWitnesses.map(witness => {
      return [
        interface.db.caller,
        witness.properties.owner().hex(),
        witness.properties.blockNumber().hex(),
      ];
    });

    // Ensure no duplicate inputs within the transaction itself, hashes are lowercased
    utils.assert(!utils.hasDuplicates(data), 'double-spend');

    // gather necessary data from the database
    const inputKeys = inputs
      .map((input, i) => [
        interface.db.inputHash,
        input.properties.type().get(),
        0,
        data[i]
      ]);

    // Get all Keys in a single Batch Request to DB
    const getKeys = inputKeys
      .concat([
        [ interface.db.state ],
      ])
      .concat(ownerIdsKeys)
      .concat(callerKeys);

    // get all necessary state / keys from db
    let retrieve = null;
    try {
      retrieve = (await batch(config.db, getKeys, { remote: true }))
        .map(entry => entry.value);
    } catch (error) {
      utils.assert(0, 'invalid-inputs');
    }

    // Input Proofs, Owner IDs, Caller Ids
    let proofs = retrieve.slice(0, inputs.length);
    let outputProofs = [];
    let values = retrieve.slice(inputs.length);

    // Get State.
    const state = protocol.state.State(values[0]);
    values = values.slice(1);

    // Get current timestamp.
    const timestamp = utils.timestamp();

    // Parse Data Retrieved from DB
    const owners = values
      .slice(0, ownerIds.length)
      .reduce((acc, value, i) => ({
        ...acc,
        [utils.bigstring(ownerIds[i])]: value,
      }), {});
    values = values.slice(ownerIds.length);

    // Determine callers map.
    let callers = {};
    for (var i = 0; i < values.length; i++) {
      callers[callerWitnesses[i].keccak256()] = values[i];
    }

    // ensure caller is registered before current sync block
    for (const [index, owner, blockNumber] of callerKeys) {
      utils.assert(utils.bigNumberify(blockNumber)
        .lte(state.properties.blockNumber().get()),
        'caller-block-number-overflow');
    }

    // ensure id is available in current state
    for (const [id] of ownerIds) {
      utils.assert(utils.bigNumberify(id).lt(state.properties.numAddresses().get()),
        'owner-id-overflow');
    }

    // fee checking, this will be more dynamic overtime, based upon feeToken submitted
    const feeToken = decoded.properties.signatureFeeToken().get();
    const fee = decoded.properties.signatureFee().get();

    // Check fee token.
    utils.assert(feeToken.gte(0), 'fee-token-underflow');
    utils.assert(feeToken.lt(state.properties.numTokens().get()), 'fee-token-overflow');

    // If fee enforcement is on.
    if (config.feeEnforcement) {
      // Get the required fee for this tx.
      try {
        const requiredFee = utils.bigNumberify(await config.db.get([
          interface.db.fee,
          feeToken,
        ], { remote: true }));
  
        // Fee not set.
        utils.assert(requiredFee.gte(0), 'no-fee-found');
  
        // Require the fee here.
        utils.assert(fee.eq(requiredFee), 'fee-mismatch');
      } catch (feeError) {
        utils.assert(0, 'no-fee-found');
      }
    }

    // inputs
    let ins = {};
    let spentInputs = inputKeys.map(key => ({
      type: 'put',
      key: [ interface.db.spent, key[1], key[3] ],
      value: '0x01',
    }));
    let deltas = [];
    const inputHashes = inputKeys.map(v => v[3]);
    let inputTypes = [];

    for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
      const input = inputs[inputIndex];
      const inputType = input.properties.type().get().toNumber();
      inputTypes.push(inputType);
      let proof = null, token = null, amount = null,
        owner = null, returnOwner = null, expiry = null;
      let rootBlock = null;

      switch (inputType) {
        case protocol.inputs.InputTypes.Transfer:
          proof = proofs[inputIndex] = protocol.outputs.UTXO(proofs[inputIndex]);
          token = proof.properties.token().get();
          amount = proof.properties.amount().get();
          owner = proof.properties.owner().hex();

          utils.assert(proof.properties.outputType().get()
            .eq(protocol.inputs.InputTypes.Transfer), 'transfer-type');
          break;

        case protocol.inputs.InputTypes.Deposit:
          proof = proofs[inputIndex] = protocol.deposit.Deposit(proofs[inputIndex]);
          token = proof.properties.token().get();
          amount = proof.properties.value().get();
          owner = proof.properties.owner().hex();

          utils.assert(owner === input.properties.owner().get(), 'input-deposit-owner');
          utils.assert(proof.properties.blockNumber().get()
            .lte(state.properties.blockNumber().get()), 'deposit-block-overflow');
          break;

        case protocol.inputs.InputTypes.HTLC:
          proof = proofs[inputIndex] = protocol.outputs.UTXO(proofs[inputIndex]);
          token = proof.properties.token().get();
          amount = proof.properties.amount().get();
          owner = proof.properties.owner().hex();
          expiry = proof.properties.expiry().get();
          returnOwner = proof.properties.returnOwner().hex();

          utils.assert(proof.properties.outputType().get()
              .eq(protocol.inputs.InputTypes.HTLC), 'htlc-type');

          spentInputs.push({
            type: 'del',
            key: [interface.db.owner, returnOwner, token, proof.getAddon()[0], inputType, 0, inputHashes[inputIndex]],
          });
          spentInputs.push({
            type: 'del',
            key: [interface.db.owner, returnOwner, token, 0, inputType, 0, inputHashes[inputIndex]],
          });

          if (state.properties.blockNumber().get().gt(expiry)) {
            owner = returnOwner;

            // Increase return owner amount.
            deltas.push({
              type: 'put',
              key: [interface.db.increase, returnOwner, token, 0, inputType, 0, inputHashes[inputIndex]],
              value: amount,
            });
          } else {
            // Check preimage.
            utils.assertHexEqual(utils.sha256(input.properties.preImage().hex()),
              proof.properties.digest().hex(), 'htlc-pre-image');

            // Increase owner balance.
            deltas.push({
              type: 'put',
              key: [interface.db.increase, owner, token, 0, inputType, 0, inputHashes[inputIndex]],
              value: amount,
            });
          }
          break;

        case protocol.inputs.InputTypes.Root:
          proof = proofs[inputIndex] = protocol.root.RootHeader(proofs[inputIndex]);
          const rootAddon = protocol.addons.RootHeader(proof.getAddon());
          token = proof.properties.feeToken().get();
          amount = proof.properties.fee().get().mul(proof.properties.rootLength().get());
          owner = rootAddon.properties.blockProducer().hex();
          utils.assert(rootAddon.properties.blockHeight().get().gt(0), 'invalid-root-spend');

          // Specify the root block.
          rootBlock = protocol.block.BlockHeader(
            await config.db.get([
              interface.db.block,
              rootAddon.properties.blockHeight().get(),
            ], { remote: true }),
          );
          break;
      }

      utils.assert(token.lt(state.properties.numTokens().get()), 'input-token-overflow');

      spentInputs.push({
        type: 'del',
        key: [
          interface.db.owner,
          owner,
          token,
          proof.getAddon()[0],
          inputType,
          0,
          inputHashes[inputIndex]
        ],
      });
      spentInputs.push({
        type: 'del',
        key: [
          interface.db.owner,
          owner,
          token,
          0,
          inputType,
          0,
          inputHashes[inputIndex]
        ],
      });
      deltas.push({
        type: 'put',
        key: [interface.db.decrease, owner, token, 0, inputType, 0, inputHashes[inputIndex]],
        value: amount,
      });

      // increase ins
      ins[utils.bigstring(token)] = (ins[utils.bigstring(token)]
        || utils.bigNumberify(0)).add(amount);

      // witness reference
      const witnessReference = input.properties.witnessReference()
        .get().toNumber();

      // witness refernece
      utils.assert(witnesses[witnessReference], 'invalid-witness-reference');

      // If the owner is null, also throw invalid witness.
      utils.assert(
        utils.bigNumberify(owner).gt(0),
        'null-witness',
      );

      // check witnesses
      utils.assertHexEqual(owner, protocol
        .witness.recover(witnesses[witnessReference], transactionHashId, callers, rootBlock),
        'witness-recover');
    }

    // outputs
    let outs = {};
    let spendableOutputs = [];
    let spendableHashes = [];
    let accountOutputs = [];
    let emits = [];
    for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
      const output = outputs[outputIndex];
      const outputType = output.properties.type().get().toNumber();
      let token = null, amount = null, owner = null,
        returnOwner = null, expiry = null, digest = null;

      switch (outputType) {
        case protocol.outputs.OutputTypes.Transfer:
          token = protocol.outputs.decodeToken(output, state);
          amount = protocol.outputs.decodeAmount(output);
          owner = protocol.outputs.decodeOwner(output, state, owners);
          break;

        case protocol.outputs.OutputTypes.Withdraw:
          token = protocol.outputs.decodeToken(output, state);
          amount = protocol.outputs.decodeAmount(output);
          owner = protocol.outputs.decodeOwner(output, state, owners);
          break;

        case protocol.outputs.OutputTypes.HTLC:
          token = protocol.outputs.decodeToken(output, state);
          amount = protocol.outputs.decodeAmount(output);
          owner = protocol.outputs.decodeOwner(output, state, owners);
          returnOwner = protocol.outputs.decodeReturnOwner(output, state, owners);
          expiry = output.properties.expiry().get();
          digest = output.properties.digest().get();
          break;

        case protocol.outputs.OutputTypes.Return:
          const returnDataLength = utils.hexDataLength(output.properties.data().hex());
          utils.assert(returnDataLength > 0, 'return-data-overflow');
          utils.assert(returnDataLength < 512, 'return-data-overflow');
          break;
      }

      // handle databasing of outputs
      if (outputType !== protocol.outputs.OutputTypes.Return) {
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
        }, protocol.addons.UTXO({ timestamp }));
        const hash = utxo.keccak256();
        const utxoRLP = utxo.encodeRLP();
        const isWithdraw = outputType === protocol.outputs.OutputTypes.Withdraw ? 1 : 0;
        const isHTLC = outputType === protocol.outputs.OutputTypes.HTLC ? 1 : 0;

        if (returnOwner) {
          accountOutputs.push({
            type: 'put',
            key: [interface.db.owner, returnOwner, token, 0, outputType, isWithdraw, hash],
            value: utxo,
          });
          accountOutputs.push({
            type: 'put',
            key: [interface.db.archiveOwner, returnOwner, timestamp, transactionHashId],
            value: transactionHashId,
          });

          // emit to publisher, if any
          if (config.emit) {
            try {
              emits.push({
                channel: `fuel_v1_${config.network.name}_${owner.toLowerCase()}`,
                message: utils.RLP.encode([
                  utils.bigNumberify(outputType).toHexString(),
                  isWithdraw ? '0x01' : '0x00',
                  token,
                  utxoRLP,
                ]),
              });
            } catch (error) { config.console.error(error); }
          }
        }

        accountOutputs.push({
          type: 'put',
          key: [interface.db.owner, owner, token, 0, outputType, isWithdraw, hash],
          value: utxo,
        });
        accountOutputs.push({
          type: 'put',
          key: [interface.db.archiveOwner, owner, timestamp, transactionHashId],
          value: transactionHashId,
        });

        if (!isWithdraw) {
          if (!isHTLC) {
            deltas.push({
              type: 'put',
              key: [interface.db.increase, owner, token, 0, outputType, isWithdraw, hash],
              value: amount,
            });
          }
        } else {
          deltas.push({
            type: 'put',
            key: [interface.db.increase, 
              balance.withdrawAccount(owner), token, 0, outputType, isWithdraw, hash],
            value: amount,
          });
        }

        // emit to publisher, if any
        if (config.emit) {
          try {
            emits.push({
              channel: `fuel_v1_${config.network.name}_${owner.toLowerCase()}`,
              message: utils.RLP.encode([
                utils.bigNumberify(outputType).toHexString(),
                isWithdraw ? '0x01' : '0x00',
                token,
                utxoRLP,
              ]),
            });
          } catch (error) { config.console.error(error); }
        }

        spendableOutputs.push({
          type: 'put',
          key: [interface.db.inputHash, output.properties.type().get(), isWithdraw, hash],
          value: utxo,
        });

        // Add to spendable hashes
        spendableHashes.push(!isWithdraw ? hash : utils.emptyBytes32);

        // Output proofs.
        outputProofs.push(utxo);

        // increase outputs
        outs[utils.bigstring(token)] = (outs[utils.bigstring(token)]
          || utils.bigNumberify(0)).add(amount);
      } else {
        // Database this return data.
        accountOutputs.push({
          type: 'put',
          key: [interface.db.return, transactionHashId, outputIndex],
          value: output.properties.data().hex(),
        });

        // Output proof
        outputProofs.push(protocol.root.Leaf({ data: output.properties.data().hex() }));

        // Add to keep ordering correct
        spendableHashes.push(utils.emptyBytes32);
      }
    }

    // Compute the delats.
    let deltaObjects = [];

    // Go through Deltas turn them into objects.
    for (const {
      key,
      value,
    } of deltas) {
      // Append delta object.
      deltaObjects.push(protocol.addons.Delta({
        amount: value,
        token: key[2],
        account: key[1],
        isIncrease: key[0] === interface.db.increase 
          ? 1
          : 0,
      }));
    }

    // Additional transactional metadata
    const transactionAddon = protocol.addons.Transaction({
      data,
      inputsLength: inputs.length,
      outputsLength: outputs.length,
      witnessesLength: witnesses.length,
      timestamp,
      signatureFeeToken: feeToken,
      signatureFee: fee,
      spendableOutputs: spendableHashes,
      deltas: deltaObjects.map(v => v.encodeRLP()),
      inputProofs: proofs.map(v => v.encodeRLP()),
      outputProofs: outputProofs.map(v => v.encodeRLP()),
      inputTypes,
    });

    // Build temporary transaction for storage
    let transaction = protocol.transaction._Transaction({
      metadata: protocol.addons.metadataFromProofs(inputs, proofs).map(m => m.encodePacked()),
      witnesses: struct.pack(...witnesses),
      ...decoded.object(),
    }, transactionAddon);
    transaction.properties.length().set(utils.hexDataLength(transaction.encodePacked()) - 2);

    // Set transaction leaf packed as the transaction in the addon
    transactionAddon.properties.transaction().set(transaction.encodePacked());

    // check leaf size
    const sizePacked = transaction.sizePacked();
    utils.assert(sizePacked > protocol.transaction.TransactionSizeMinimum,
        'transaction-size-underflow');
    utils.assert(sizePacked < protocol.transaction.TransactionSizeMaximum,
        'transaction-size-overflow');

    // add committed fee to outs
    if (fee.gt(0)) {
      const transactionLength = utils.hexDataLength(
        transaction.encodePacked(),
      );

      // Add fee to total outputs.
      outs[utils.bigstring(feeToken)] = (outs[utils.bigstring(feeToken)] || utils.bigNumberify(0))
        .add(fee.mul(transactionLength));
    }

    // check ins === outs
    const outsKeys = Object.keys(outs).sort();
    const inKeys = Object.keys(ins).sort();

    inKeys.forEach((v, i) => {
      utils.assert(v === outsKeys[i], 'ins-outs-keys');
      utils.assert(ins[v].eq(outs[outsKeys[i]]), 'inputs-mismatch-outputs');
    });

    // The entry added to the mempool
    let mempoolEntry = [{
      type: 'put',
      key: [interface.db.mempool, timestamp, nonce, transactionHashId],
      value: transaction,
    }, {
      type: 'put',
      key: [
        interface.db.transactionId,
        transactionHashId,
      ],
      value: transactionAddon,
    }];

    // If no mempool is true, then we don't record locally.
    if (config.nomempool) {
      mempoolEntry = [{
        type: 'put',
        key: [
          interface.db.transactionId,
          transactionHashId,
        ],
        value: transactionAddon,
      }];
    }

    // If there is an API account provider present.
    if (config.account) {
      mempoolEntry.push({
        type: 'put',
        key: [
          interface.db.record,
          config.account,
          timestamp,
          transactionHashId,
        ],
        value: transactionHashId,
      });
    }

    // double spend protection
    try {
      // If the network is local, check for double spends manually.
      if (config.network.name === 'unspecified') {
        let doubleSpend = false;

        for (const spendInput of spentInputs) {
          try {
            // If the key is a spend key.
            if (spendInput.key.length === 3) {
              // Attempt to get this from the db.
              await config.db.get(spendInput.key, { remote: true });

              // If get success, this has already been spent. Stop.
              doubleSpend = true;

              // Spent here.
              console.log('spent!', spendInput.key);
            }
          } catch (error) {
          }
        }

        utils.assert(doubleSpend === false, 'input-already-spent');
      }

      await config.db.batch(spentInputs, { remote: true, upsert: false, transact: true });
    } catch (error) {
      utils.assert(0, 'input-already-spent');
    }

    // all is well, make database upserts
    // problem here.
    try {
      await config.db.batch(accountOutputs
          .concat(deltas)
          .concat(spendableOutputs)
          .concat(mempoolEntry), { remote: true });
    } catch (error) {
      console.error(error);
      utils.assert(0, 'failed-to-insert');
    }

    // new emit
    if (config.emit) {
      try {
        for (const emittion of emits) {
          await config.emit(emittion);
        }
      } catch (emitError) {
        console.error(emitError);
        utils.assert(0, 'failed-to-emit');
      }
    }

    // bool success for now..
    return '0x01';
  } catch (error) {
    config.console.error(error);
    throw new utils.ByPassError(error);
  }
}

module.exports = transact;
