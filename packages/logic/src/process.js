const protocol = require('@fuel-js/protocol');
const utils = require('@fuel-js/utils');
const struct = require('@fuel-js/struct');
const database = require('@fuel-js/database');
const { simulate } = require('@fuel-js/down');
const interface = require('@fuel-js/interface');
const streamToArray = require('stream-to-array');
const operatorsToWallets = require('./operatorsToWallets');
const memdown = require('memdown');
const balance = require('./balance');

function last(array = []) {
  return array[array.length - 1];
}

// Finalization period.
const FRAUD_FINALIZATION_PERIOD = 10;

/// @notice Make fraud commitment attempt.
async function commitFraud(kind = '', args = [], config = {}) {
  // Compute the fraud hash.
  const fraudHash = utils.keccak256(config.contract.interface.functions
    [kind].encode(args));

  // Declare fraud found.
  config.console.log(`Fraud detected, starting fraud submission sequence: 
    ${kind}, ${fraudHash}`);

  // Proposed block height and root index
  const operators = operatorsToWallets(config);
  const blockProducer = operators[0]; // first operator is block producer

  // The contract for block production.
  const contract = config.contract.connect(blockProducer); // rootProducers[rootIndex]);

  // current ethereum block number
  // If the fraud hash has been submitted, try submitting the proof.
  while (true) {
    // The current block number.
    const blockNumber = await config.provider.getBlockNumber();

    // Fraud block number.
    const fraudBlockNumber = await contract.fraudCommitment(
      contract.signer.address,
      fraudHash,
    );

    // Submit fraud hash.
    if (fraudBlockNumber.lte(0)) {
      // Comit fraud hash.
      const tx = await contract.commitFraudHash(
        fraudHash,
        { gasLimit: config.gas_limit },
      );

      // Wait for the fraud comitment hash.
      await tx.wait();

      // Break.
      continue;
    }

    // The block to pass before fraud is commitable.
    const fraudBlock = fraudBlockNumber.toNumber() 
      + FRAUD_FINALIZATION_PERIOD;

    // If increase block is available, increase it.
    // This is for testing.
    if (config.increaseBlock) {
      if (blockNumber <= fraudBlock) {
        await config.increaseBlock(
          (fraudBlock + 1) - blockNumber,
        );

        // Go through the loop again.;
        continue;
      }
    }

    // Once we have passed the fraud block.
    if (blockNumber > fraudBlock
      && fraudBlockNumber.toNumber() > 0) {
      // Submit the commit fraud tx.
      let tx = await contract[kind](
        ...args,
        { gasLimit: config.gas_limit },
      );

      // Wait for Tx success.
      tx = await tx.wait();

      // Break the while loop.
      break;
    }

    // Wait one block.
    await utils.wait(13 * 1000);
  }

  // Return not success.
  return {
    trades: 0,
    transactions: 0,
    success: false,
  };
}

/// @notice Proof from Metadata and Input.
async function proofFromMetadata({ metadata, input, config, includeFirstProof, returnUTXOProof }) {
  const block = await protocol.block.BlockHeader.fromLogs(
    metadata.properties.blockHeight().get().toNumber(),
    config.contract,
  );

  utils.assert(block.properties, 'block-not-found');

  const rootIndex = metadata.properties.rootIndex().get().toNumber();
  const roots = block.properties.roots().get();

  // Check the root index isn't invalid.
  utils.assert(roots[rootIndex], 'roots-index-overflow');

  // Get the root from logs.
  const rootHash = roots[rootIndex];
  const logs = await config.contract.provider.getLogs({
    fromBlock: 0,
    toBlock: 'latest',
    address: config.contract.address,
    topics: config.contract.filters.RootCommitted(rootHash).topics,
  });

  // Check root is real.
  utils.assert(logs.length > 0, 'no-root-available');

  // Parse log and build root struct.
  const log = config.contract.interface.parseLog(logs[0]);
  const root = new protocol.root.RootHeader({ ...log.values });

  // Get the root transaction data.
  const transactionData = await config.provider
    .getTransaction(logs[0].transactionHash);
  const calldata = config.contract.interface.parseTransaction(transactionData)
    .args[3];

  // attempt to decode the root from data.
  const transactions = protocol.root.decodePacked(calldata);

  // Selected transaction index.
  const transactionIndex = metadata.properties.transactionIndex().get().toNumber();

  // Check index overflow.
  utils.assert(transactions[transactionIndex], 'transaction-index');

  // Check transaction output overflow.
  const transaction = protocol.transaction
    .decodePacked(transactions[transactionIndex]);

  // Check output index overflow.
  const outputIndex = metadata.properties.outputIndex().get();

  // Output index overflow check.
  utils.assert(transaction.outputs[outputIndex], 'output-index-overflow');

  // The output owner.
  let outputOwner = transaction.outputs[outputIndex]
    .properties.owner().hex();

  // If the owner is a ID resolve, otherwise use it.
  if (utils.hexDataLength(outputOwner) !== 20) {
    try {
      outputOwner = await config.db.get([
        interface.db.address,
        outputOwner,
      ]);
    } catch (error) {
      utils.assert(0, 'invalid-owner-id');
    }
  }

  // Return owner.
  let returnOwner = utils.emptyAddress;

  // Output type.
  const outputType = transaction.outputs[outputIndex]
    .properties.type().get().toNumber();

  // If HTLC, resolve any owner ID's.
  if (outputType === protocol.outputs.OutputTypes.HTLC) {
    returnOwner = transaction.outputs[outputIndex]
      .properties.returnOwner().hex();

    if (utils.hexDataLength(outputOwner) !== 20) {
      try {
        returnOwner = await config.db.get([
          interface.db.address,
          returnOwner,
        ]);
      } catch (error) {
        utils.assert(0, 'invalid-return-owner-id');
      }
    }
  }

  // This covers the UTXO data hashes for each input in this tx.
  // The map of this is stored in the db.
  let data = [];

  // Feed the first proof into input proofs for invalidWitness.
  let inputProofs = [];

  // Go through each input and build the data array.
  for (var i = 0; i < transaction.inputs.length; i++) {
    const _input = transaction.inputs[i];
    const _metadata = transaction.metadata[i];
    const _type = _input.properties.type()
      .get().toNumber();
    const _isWithdraw = 0;
  
    // Handle different kinds of inputs.
    switch (_type) {
      case protocol.inputs.InputTypes.Transfer:
        // Push data into data array.
        data.push(
          await config.db.get([
            interface.db.inputMetadataHash,
            _type,
            _isWithdraw,
            _metadata.properties.blockHeight().get(),
            _metadata.properties.rootIndex().get(),
            _metadata.properties.transactionIndex().get(),
            _metadata.properties.outputIndex().get(),
          ]),
        );

        // Include this as first proof.
        if (includeFirstProof && i === 0) {
          inputProofs = (await proofFromMetadata({
            metadata: _metadata,
            input: _input,
            returnUTXOProof: true,
            config,
          })).encodePacked();
        }
        break;

      case protocol.inputs.InputTypes.Deposit:
        // Get the deposit amount.
        const _amount = await config.contract.depositAt(
          _input.properties.owner().hex(),
          _metadata.properties.token().get(),
          _metadata.properties.blockNumber().get(),
        );

        // The deposit proof.
        const _depositProof = protocol.deposit.Deposit({
          value: _amount,
          owner: _input.properties.owner().hex(),
          token: _metadata.properties.token().get(),
          blockNumber: _metadata.properties.blockNumber().get(),
        });

        // Include this as first proof.
        if (includeFirstProof && i === 0) {
          inputProofs = _depositProof.encode();
        }

        // Look up deposit details namely, amount.
        data.push(
          _depositProof.keccak256(),
        );
        break;

      case protocol.inputs.InputTypes.Root:
        // Look up the block, than the root hash, than the root.
        const _block = await protocol.block.BlockHeader.fromLogs(
          _metadata.properties.blockHeight().get().toNumber(),
          config.contract,
        );

        // Get the root index, than root hash.
        const _rootIndex = _metadata.properties.rootIndex().get();
        const _rootHash = _block.properties.roots().get()[_rootIndex];

        // Than get the logs for this root hash.
        const _logs = await config.contract.provider.getLogs({
          fromBlock: 0,
          toBlock: 'latest',
          address: config.contract.address,
          topics: config.contract.filters.RootCommitted(_rootHash).topics,
        });

        // Than get the root header.
        const _log = config.contract.interface.parseLog(_logs[0]);
        const _root = new protocol.root.RootHeader({
          ..._log.values,
        });

        // Include this as first proof.
        if (includeFirstProof && i === 0) {
          // Incldude the root proof, but without the first tx proof.
          inputProofs = (await proofFromMetadata({
            metadata: _metadata,
            input: _input,
            config,
          })).encodePacked();
        }

        // Look up root log.
        data.push(
          _root.keccak256Packed(),
        );
        break;

      case protocol.inputs.InputTypes.HTLC:
        // Push data into data array.
        data.push(
          await config.db.get([
            interface.db.inputMetadataHash,
            _type,
            _isWithdraw,
            _metadata.properties.blockHeight().get(),
            _metadata.properties.rootIndex().get(),
            _metadata.properties.transactionIndex().get(),
            _metadata.properties.outputIndex().get(),
          ]),
        );

        // Include this as first proof.
        if (includeFirstProof && i === 0) {
          inputProofs = (await proofFromMetadata({
            metadata: _metadata,
            input: _input,
            returnUTXOProof: true,
            config,
          })).encodePacked();
        }
        break;

      default:
        utils.assert(0, 'invalid-type');
    }
  }

  // If return UTXO proof of selected output, not Tx proof. Used for proveInvalidWitness.
  if (returnUTXOProof) {
    // Unsigned proof.
    const unsigned = protocol.transaction.Unsigned({
      inputs: transaction.inputs,
      outputs: transaction.outputs,
      data,
      signatureFee: root.properties.fee().get(),
      signatureFeeToken: root.properties.feeToken().get(),
    });

    // Compute transaction hash id.
    const id = protocol.witness.transactionHashId(
        unsigned,
        config.contract,
        config.network.chainId,
    );

    // Check output index overflow.
    const outputIndex = metadata.properties.outputIndex().get();
  
    // The output referenced.
    const outputReferenced = transaction.outputs[outputIndex];

    // Is HTLC.
    const _isHTLC = input.properties.type().get()
      .eq(protocol.inputs.InputTypes.HTLC);

    // Resolve address data.
    async function resolveAddress(addressData = '0x', config) {
      // Is an address.
      if (utils.hexDataLength(addressData) === 20) {
        return addressData;
      } else {
        // Return the owner address from id.
        return await config.db.get([ interface.db.address, addressData ]);
      }
    }

    // UTXO proof.
    return protocol.outputs.UTXO({
      transactionHashId: id,
      owner: await resolveAddress(outputReferenced.properties.owner().hex(), config),
      amount: protocol.outputs.decodeAmount(outputReferenced),
      token: outputReferenced.properties.token().get(),
      expiry: _isHTLC
        ? outputReferenced.properties.expiry().get()
        : 0,
      digest: _isHTLC
        ? outputReferenced.properties.digest().get()
        : utils.emptyBytes32,
      returnOwner: await resolveAddress(_isHTLC
        ? outputReferenced.properties.returnOwner().hex()
        : utils.emptyAddress, config),
    });
  }

  // Return transaction proof.
  return protocol.transaction.TransactionProof({
    block,
    root,
    transactions: transactions
      .map(txHex => protocol.root.Leaf({
        // Trim the length and 0x prefix.
        data: struct.chunk(
          '0x' + txHex.slice(6),
        ),
      })),
    data,
    rootIndex,
    transactionIndex,
    inputOutputIndex: outputIndex,
    token: outputOwner,
    selector: returnOwner,
    inputProofs,
  });
}

/// @notice Handle an invalid input situation.
/// @dev This could lead to either an invalidInput or doubleSpend submission.
async function invalidInput({
  proof,
  metadata,
  input,
  inputs,
  block,
  root,
  rootIndex,
  transactionIndex,
  inputIndex,
  config }) {
  // Some fill data.
  const dataFill = (new Array(inputs.length))
    .fill(0)
    .map(() => utils.keccak256('0xaa'));

  // Input is a deposit, skip to double spend.
  const inputType = input.properties
    .type().get();
  const isDeposit = inputType.toNumber() === protocol.inputs
    .InputTypes.Deposit;

  // If the input is a deposit.
  if (isDeposit) {
    // Deposit amount.
    const depositAmount = await config.contract.depositAt(
      input.properties.owner().hex(),
      metadata.properties.token().get(),
      metadata.properties.blockNumber().get(),
    );

    // If deposit is invalid.
    if (depositAmount.eq(0)) {
      return await commitFraud(
        'proveInvalidInput',
        [
          '0x', // this is ignored, not needed.
          proof.encodePacked(),
        ],
        config,
      );
    }
  }

  // If not a deposit, than find invalidity.
  if (!isDeposit) {
    // Is this an invalid input.
    let isInvalidInput = false;

    // Select the block referenced in metadata.
    const selectedBlock = await protocol.block.BlockHeader.fromLogs(
      metadata.properties.blockHeight().get().toNumber(),
      config.contract,
    );

    // Check root is real.
    utils.assert(selectedBlock, 'no-block-available-invalid-input');

    // This is the root being selected.
    let selectedRootIndex = metadata.properties.rootIndex().get().toNumber();
    const roots = selectedBlock.properties.roots().get();

    // The default root hash to select.
    let rootHash = roots[0];

    // The core root object to select.
    let selectedRoot = null;

    // Roots overflow. Submit any root as the invalit input proof.
    if (selectedRootIndex >= roots.length) {
      // we select the zero index here, than move to submit this invalid input.
      selectedRootIndex = 0;
      isInvalidInput = true;
    }

    // Get logs for the root in question.
    const logs = await config.contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      address: config.contract.address,
      topics: config.contract.filters.RootCommitted(rootHash).topics,
    });

    // Check root is real.
    utils.assert(logs.length > 0, 'no-root-available-while-invalid-input');

    // Parse log and build root struct.
    const log = config.contract.interface.parseLog(logs[0]);
    selectedRoot = new protocol.root.RootHeader({ ...log.values });

    // Get the root transaction data.
    const transactionData = await config.provider
      .getTransaction(logs[0].transactionHash);
    const calldata = config.contract.interface.parseTransaction(transactionData)
      .args[3];

    // attempt to decode the root from data.
    const transactions = protocol.root.decodePacked(calldata);

    // Selected transaction index.
    let selectedTransactionIndex = metadata.properties.transactionIndex().get().toNumber();

    // Roots overflow. Submit any root as the invalit input proof.
    if (selectedRootIndex >= roots.length) {
      // we select the zero index here, than move to submit this invalid input.
      selectedTransactionIndex = 0;
      isInvalidInput = true;
    }

    // Transactions index overflow, might need a MOD check here.
    if (selectedTransactionIndex >= transactions.length) {
      selectedTransactionIndex = transactions.length - 1;

      // Account for the empty leaf if any.
      if (transactions.length % 2 > 0) {
        selectedTransactionIndex = transactions.length;
      }

      isInvalidInput = true;
    }

    // Input output index.
    let inputOutputIndex = 0;

    // Tx data for input proof.
    let data = [];

    // If the transaciton index is valid.
    if (selectedTransactionIndex < transactions.length) {
      // Check transaction output overflow.
      const transaction = protocol.transaction
        .decodePacked(transactions[selectedTransactionIndex]);

      // Check output index overflow.
      inputOutputIndex = metadata.properties.outputIndex()
        .get();

      // Setup data fill.
      data = (new Array(transaction.metadata.length))
        .fill(0)
        .map(() => utils.emptyBytes32);

      // Selecting an input that doesn't exist (overflow).
      if (inputOutputIndex >= transaction.outputs.length) {
        isInvalidInput = true;
      }

      // Get the selected input type.
      if (!isInvalidInput) {
        // The input type from the actual tx.
        const _type = transaction.outputs[inputOutputIndex]
          .properties.type().get();

        // Invalid input.
        if (_type.eq(protocol.outputs.OutputTypes.Withdraw)
          || _type.eq(protocol.outputs.OutputTypes.Return)
          || !inputType.eq(_type)) {
          isInvalidInput = true;
        }
      }
    }

    // This is an invalid input so we will submit the fraud proof.
    if (isInvalidInput) {
      return await commitFraud(
        'proveInvalidInput',
        [
          protocol.transaction.TransactionProof({
            block: selectedBlock,
            root: selectedRoot,
            transactions: transactions
            .map(txHex => protocol.root.Leaf({
              // Trim the length and 0x prefix.
              data: struct.chunk(
                '0x' + txHex.slice(6),
              ),
            })),
            data,
            rootIndex: selectedRootIndex,
            transactionIndex: selectedTransactionIndex,
            inputOutputIndex: inputOutputIndex,
          }).encodePacked(),
          proof.encodePacked(),
        ],
        config,
      );
    }
  }

  // This is the metadata ID for this tx, and output.
  const inputMetadata = protocol.metadata.Metadata({
    blockHeight: block.properties.height().get(),
    rootIndex,
    transactionIndex,
    outputIndex: inputIndex,
  });

  // Else this is not an invalid input, it is a double spend!
  return await invalidDoubleSpend({
    proof,
    metadata,
    input,
    block,
    root,
    rootIndex,
    transactionIndex,
    inputMetadata,
    inputIndex,
    config });
}

/// @notice Handle double spend situation.
/// @dev Will require a full scan starting from the block tip backward.
async function invalidDoubleSpend({
    proof,
    metadata,
    input,
    inputMetadata,
    config,
    data,
  }) {
  // Get the block tip.
  const tip = inputMetadata.properties.blockHeight()
    .get().toNumber();

  // Empty owner used for comparison.
  let owner = utils.emptyAddress;

  // Owner check.
  if (input.properties.type().get().eq(1)) {
    owner = input.properties.owner().hex();
  }

  // Go through each block height.
  for (let blockHeight = tip; blockHeight > 0; blockHeight--) {
    // Get the block header.
    const block = await protocol.block.BlockHeader.fromLogs(
      blockHeight,
      config.contract,
    );

    // Get the roots from this block.
    const roots = block.properties.roots().get();

    // Go through each of the block roots here.
    for (let rootIndex = 0; rootIndex < roots.length; rootIndex++) {
      // The root hash in question.
      const rootHash = roots[rootIndex];

      // Get logs for the root in question.
      const logs = await config.contract.provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: config.contract.address,
        topics: config.contract.filters
          .RootCommitted(rootHash).topics,
      });

      // Check root is real.
      utils.assert(logs.length > 0, 'no-root-available-while-double-spend');

      // Parse log and build root struct.
      const log = config.contract.interface.parseLog(logs[0]);
      const root = new protocol.root.RootHeader({ ...log.values });

      // Get the root transaction data.
      const transactionData = await config.provider
        .getTransaction(logs[0].transactionHash);
      const calldata = config.contract.interface
        .parseTransaction(transactionData).args[3];

      // Now we have the calldata do a simple string search before parsing.
      const stringMetadata = metadata.encodePacked().slice(2);

      // Test if the metadata like bytes are in this root.
      if(calldata.indexOf(stringMetadata) !== -1) {
        // We decode the root if it is.
        const transactions = protocol.root.decodePacked(calldata);

        // Now we cycle through these transactions and find where the metadata might be.
        for (let transactionIndex = 0;
          transactionIndex < transactions.length;
          transactionIndex++) {
          // Get the transaction hex.
          const transactionHex = transactions[transactionIndex];

          // If the metadata is in this tx, than we continue.
          if(calldata.indexOf(stringMetadata) !== -1) {
            // Check transaction output overflow.
            const transaction = protocol.transaction
              .decodePacked(transactionHex);

            // Now we check through the metadata to identify the overlap.
            for (let inputIndex = 0;
              inputIndex < transaction.metadata.length;
              inputIndex++) {
              // Test metadata.
              const testMetadata = transaction.metadata[inputIndex];

              // Get the input specified.
              const checkInput = transaction.inputs[inputIndex];
              
              // This is the metadata for this inputs current id.
              const checkMetadata = protocol.metadata.Metadata({
                blockHeight: block.properties.height().get(),
                rootIndex,
                transactionIndex,
                outputIndex: inputIndex,
              });

              // check owner.
              let checkOwner = utils.emptyAddress;

              // If type is a Deposit.
              if (checkInput.properties.type().get().eq(1)) {
                checkOwner = checkInput.properties.owner().hex();
              }

              // Ensure the metadata ID's are not identical, just skip if they are.
              // You don't want to call bullshit on the questionable input twice.
              if (checkOwner === owner
                && inputMetadata.encodePacked() === checkMetadata.encodePacked()) {
                continue;
              }

              // If the metadata is the same we have a double spend.
              if (checkOwner === owner
                && testMetadata.encodePacked() === metadata.encodePacked()) {
                // Commit double spend fraud proof.
                return await commitFraud(
                  'proveDoubleSpend',
                  [
                    protocol.transaction.TransactionProof({
                      block,
                      root,
                      transactions: transactions
                        .map(txHex => protocol.root.Leaf({
                          // Trim the length and 0x prefix.
                          data: struct.chunk(
                            '0x' + txHex.slice(6),
                          ),
                        })),
                      rootIndex,
                      transactionIndex,
                      data,
                      inputOutputIndex: inputIndex,
                    }).encodePacked(),
                    proof.encodePacked(),
                  ],
                  config,
                );
              }
            }
          }
        }
      }
    }
  }
}

/// Prepair UTXO proofs for invalid sum.
/// @dev if root, provie the metadata proof.
async function prepairUTXOForSum(proofs, metadata, inputs, config) {
  // Return proofs.
  let _proofs = [];

  // Input index.
  let index = 0;

  // Proof.
  for (const proof of proofs) {
    // Root.
    if (proof.properties.rootProducer) {
      _proofs.push(
        (await proofFromMetadata({
          metadata: metadata[index],
          inputs: inputs[index],
          config,
        })).encodePacked(),
      );
    } else {
      // Deposit / UTXO
      _proofs.push(proof.encode());
    }

    // Increase index.
    index++;
  }

  // Return proofs.
  return struct.chunkJoin(_proofs);
}

/// @notice Build input Transaction proofs from inputs.
async function inputTransactionProofs({ metadata, inputs, config }) {
  // The returned input proofs.
  let proofs = [];

  // Go through each input.
  let inputIndex = 0;
  for (const input of inputs) {
    const inputType = input.properties.type()
      .get().toNumber();
    const data = metadata[inputIndex];

    // Go through each type handle accordingly.
    switch (inputType) {
      case protocol.inputs.InputTypes.Transfer:
        proofs.push((await proofFromMetadata({
          input,
          metadata: data,
          config,
          includeFirstProof: true,
        })).encodePacked());
        break;

      case protocol.inputs.InputTypes.Deposit:
        const depositAmount = await config.contract.depositAt(
          input.properties.owner().hex(),
          data.properties.token().get(),
          data.properties.blockNumber().get(),
        );
        proofs.push(protocol.deposit.Deposit({
          owner: input.properties.owner().hex(),
          token: data.properties.token().get(),
          value: depositAmount,
          blockNumber: data.properties.blockNumber().get(),
        }).encode());
        break;

      case protocol.inputs.InputTypes.HTLC:
        proofs.push((await proofFromMetadata({
          input,
          metadata: data,
          config,
          includeFirstProof: true,
        })).encodePacked());
        break;

      case protocol.inputs.InputTypes.Root:
        proofs.push((await proofFromMetadata({
          input,
          metadata: data,
          config,
        })).encodePacked());
        break;
    }

    // Increase index.
    inputIndex++;
  }

  return proofs;
}

async function process(block = {}, config = {}) {
  try {
    utils.assert(config.db.supports.local, 'db must support .local');
    const db = database(simulate(config.db.supports.local, memdown()));

    // setup a local config but with the new simulation db
    const local = { ...config, db };
    const timestamp = utils.timestamp();

    // stats object
    let stats = {
      trades: 0,
      transactions: 0,
      success: true,
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
        // Transactions decoded into hex.
        transactions = protocol.root.decodePacked(calldata);

        // Check the merkle root.
        const computedRoot = protocol.root.merkleTreeRoot(
          transactions,
        );

        // Check invalid merkle root.
        utils.assert(
          computedRoot === root.properties.merkleTreeRoot().hex(),
          'invalid-merkle-root');
      } catch (malformedBlockError) {
        // Commit fraud.
        return await commitFraud(
          'proveMalformedBlock',
          [
            block.encodePacked(),
            root.encodePacked(),
            rootIndex,
            calldata,
          ],
          config,
        );
      }

      // attempt transaction decode
      let transactionIndex = 0;
      for (const transactionHex of transactions) {
        let transaction = null;
        try {
          transaction = protocol.transaction.decodePacked(transactionHex);

          // Verify the metadata correctness.
          protocol.metadata.verifyMetadata({
            metadata: transaction.metadata,
            block,
            rootIndex,
            transactionIndex,
          });
        } catch (invalidTransaction) {
          // Invalid transaction encoding.
          return await commitFraud(
            'proveInvalidTransaction',
            [
              protocol.transaction.TransactionProof({
                block,
                root,
                transactions: transactions
                  .map(txHex => protocol.root.Leaf({
                    // Trim the length and 0x prefix.
                    data: struct.chunk(
                      '0x' + txHex.slice(6),
                    ),
                  })),
                rootIndex,
                transactionIndex,
              }).encodePacked(),
            ],
            config,
          );
        }
        const { inputs, outputs, metadata, witnesses } = transaction;

        let transactionTimestamp = [];
        let ins = {};
        let outs = {};
        let data = [];
        let proofs = [];
        let outputProofs = [];
        let inputTypes = [];

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
            // Spendable input constant.
            const spendableInput = 0;

            // Add to input types.
            inputTypes.push(input.properties.type().get().toNumber());

            // Go through each input type case.
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

                // delete the input metadata key
                await db.del(key);

                // archival deletes
                if (config.archive) {
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
                    interface.db.inputHash,
                    protocol.inputs.InputTypes.Transfer,
                    spendableInput,
                    last(data)
                  ]);
                }
                break;

              case protocol.inputs.InputTypes.Deposit:
                key = [
                  interface.db.deposit2,
                  input.properties.owner().get(),
                  metadata[inputIndex].properties.token().get(),
                  metadata[inputIndex].properties.blockNumber().get(),
                ];
                proofs.push(protocol.deposit.Deposit(await db.get(key)));
                data.push(last(proofs).keccak256());

                // delete the input metadata key
                await db.del(key);

                // delete input
                if (config.archive) {
                  await db.del([
                    interface.db.owner,
                    input.properties.owner().get(),
                    metadata[inputIndex].properties.token().get(),
                    last(proofs).getAddon()[0],
                    protocol.inputs.InputTypes.Deposit,
                    spendableInput,
                    last(data),
                  ]);
                  await db.del([
                    interface.db.owner,
                    input.properties.owner().get(),
                    metadata[inputIndex].properties.token().get(),
                    0, // addons.RootHeader.properties.timestamp
                    protocol.inputs.InputTypes.Deposit,
                    spendableInput,
                    last(data),
                  ]);
                  await db.del([
                    interface.db.inputHash,
                    protocol.inputs.InputTypes.Deposit,
                    spendableInput,
                    last(data),
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
                  utils.assertHexEqual(utils.sha256(input.properties.preImage().hex()),
                    last(proofs).properties.digest().hex(), 'htlc-pre-image');
                }

                // increase trades
                stats.trades += 1;

                // delete the metadata input
                await db.del(key);

                // delete input
                if (config.archive) {
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
                }
                break;
            }
            inputIndex++;
          } catch (invalidInputError) {
            // Submit an invalid input.
            return await invalidInput({
              proof: protocol.transaction.TransactionProof({
                block,
                root,
                transactions: transactions
                  .map(txHex => protocol.root.Leaf({
                    // Trim the length and 0x prefix.
                    data: struct.chunk(
                      '0x' + txHex.slice(6),
                    ),
                  })),
                rootIndex,
                transactionIndex,
                inputOutputIndex: inputIndex,
              }),
              metadata: metadata[inputIndex],
              input: inputs[inputIndex],
              inputs,
              block,
              root,
              rootIndex,
              transactionIndex,
              inputIndex,
              config,
            });
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

              if (config.archive) {
                await balance.decrease(
                  proof.properties.owner().hex(),
                  proof.properties.token().hex(),
                  proof.properties.amount().get(),
                  local,
                  transactionHashId);
              }
              break;

            case protocol.inputs.InputTypes.Deposit:
              proof = proofs[inputIndex];
              token = proof.properties.token().get();
              amount = proof.properties.value().get();
              owner = proof.properties.owner().hex();

              if (config.archive) {
                await balance.decrease(
                  proof.properties.owner().hex(),
                  proof.properties.token().hex(),
                  proof.properties.value().get(),
                  local,
                  transactionHashId);
              }
              break;

            case protocol.inputs.InputTypes.HTLC:
              proof = proofs[inputIndex];
              token = proof.properties.token().get();
              amount = proof.properties.amount().get();
              owner = proof.properties.owner().hex();

              // If expired.
              if (block.properties.blockNumber().get()
                .gt(proof.properties.expiry().get())) {
                owner = proof.properties.returnOwner().hex();

                // Increase return owner balance if expired.
                if (config.archive) {
                  await balance.increase(
                    proof.properties.returnOwner().hex(),
                    proof.properties.token().hex(),
                    proof.properties.amount().get(),
                    local,
                    transactionHashId);
                }
              } else {
                // If not expired, increase the owner.
                if (config.archive) {
                  await balance.increase(
                    proof.properties.owner().hex(),
                    proof.properties.token().hex(),
                    proof.properties.amount().get(),
                    local,
                    transactionHashId);
                }
              }
              break;

            case protocol.inputs.InputTypes.Root:
              proof = proofs[inputIndex];
              const proofAddon = protocol.addons.RootHeader(
                proof.getAddon(),
              );
              token = proof.properties.feeToken().get();
              amount = proof.properties.fee().get().mul(proof.properties.rootLength().get());
              owner = proofAddon.properties.blockProducer().hex();

              if (config.archive) {
                await balance.decrease(
                  proofAddon.properties.blockProducer().get(),
                  proof.properties.feeToken().hex(),
                  proof.properties.fee().get()
                    .mul(proof.properties.rootLength().get()),
                  local,
                  transactionHashId);
              }
              break;
          }

          // increase ins
          ins[utils.bigstring(token)] = (ins[utils.bigstring(token)]
            || utils.bigNumberify(0)).add(amount);

          // check witness
          try {
            let callers = {};
            const witnessReference = input.properties
              .witnessReference().get().toNumber();

            // if is Caller, get Caller from database
            if (witnesses[witnessReference].properties
                .type().get().toNumber() === protocol.witness.WitnessTypes.Caller) {
              try {
                callers[witnesses[witnessReference].keccak256()] = await db.get([
                  interface.db.caller,
                  witnesses[witnessReference].properties.owner().hex(),
                  witnesses[witnessReference].properties.blockNumber().hex(),
                ]);
              } catch (invalidTransactionError) {
                // Invalid transaction encoding.
                return await commitFraud(
                  'proveInvalidTransaction',
                  [
                    protocol.transaction.TransactionProof({
                      block,
                      root,
                      transactions: transactions
                        .map(txHex => protocol.root.Leaf({
                          // Trim the length and 0x prefix.
                          data: struct.chunk(
                            '0x' + txHex.slice(6),
                          ),
                        })),
                      data,
                      rootIndex,
                      transactionIndex,
                    }).encodePacked(),
                  ],
                  config,
                );
              }
            }

            // If the owner is null, also throw invalid witness.
            utils.assert(
              utils.bigNumberify(owner).gt(0),
              'null-witness',
            );

            // check the witness
            utils.assertHexEqual(owner, protocol
                .witness.recover(witnesses[witnessReference],
                  transactionHashId, callers, block), 'invalid-witness');
          } catch (invalidWitness) {
            // Prove the witness is invalid.
            return await commitFraud(
              'proveInvalidWitness',
              [
                protocol.transaction.TransactionProof({
                  block,
                  root,
                  transactions: transactions
                    .map(txHex => protocol.root.Leaf({
                      // Trim the length and 0x prefix.
                      data: struct.chunk(
                        '0x' + txHex.slice(6),
                      ),
                    })),
                  data,
                  signatureFee: fee,
                  signatureFeeToken: feeToken,
                  inputOutputIndex: inputIndex,
                  rootIndex,
                  transactionIndex,
                  chainId: config.network.chainId,
                  inputProofs: struct.chunkJoin(await inputTransactionProofs({
                    metadata,
                    inputs,
                    config,
                  })),
                }).encodePacked(),
              ],
              config,
            );
          }

          // Increase Index
          inputIndex++;
        } // InputsEnd

        // begin parsing outputs
        let outputIndex = 0;
        let owners = {};
        let spendableHashes = [];
        const numAddresses = block.properties.numAddresses().get();
        for (const output of outputs) {
          const outputType = output.properties.type().get().toNumber();
          let token = null, amount = null, owner = null,
            returnOwner = utils.emptyAddress, expiry = 0, digest = utils.emptyBytes32;

          try {
            // Resolve addess ID's
            if (outputType !== protocol.outputs.OutputTypes.Return) {
              if (outputType === protocol.outputs.OutputTypes.HTLC) {
                const returnData = output.properties.returnOwner().hex();
                const returnId = utils.bigstring(returnData);
                const idLength = utils.hexDataLength(returnData);

                if (idLength < 20 && !owners[returnId]) {
                  utils.assert(numAddresses.gte(returnData), "owner-id-overflow");

                  owners[returnId] = await db.get([ interface.db.address, returnData ]);
                }
              }

              const ownerData = output.properties.owner().hex();
              const ownerId = utils.bigstring(ownerData);

              if (utils.hexDataLength(ownerData) < 20 && !owners[ownerId]) {
                utils.assert(numAddresses.gte(ownerData), "owner-id-overflow");
                owners[ownerId] = await db.get([ interface.db.address, ownerData ]);
              }
            }

            // Attempt Output Decoding
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
                utils.assert(returnDataLength <= 512, 'return-data-overflow');
                break;
            }
          } catch (invalidTransactionError) {
            // Invalid transaction encoding.
            return await commitFraud(
              'proveInvalidTransaction',
              [
                protocol.transaction.TransactionProof({
                  block,
                  root,
                  transactions: transactions
                    .map(txHex => protocol.root.Leaf({
                      // Trim the length and 0x prefix.
                      data: struct.chunk(
                        '0x' + txHex.slice(6),
                      ),
                    })),
                  data,
                  rootIndex,
                  transactionIndex,
                }).encodePacked(),
              ],
              config,
            );
            break;
          }

          // Handle UTXO outputss
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

            // add to output proofs.
            outputProofs.push(utxo);

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

            // metadata input, we need to make a copy of this which is *eventually* prunable, but is kept until finality.
            await db.put([interface.db.inputMetadata, ...inputMetadataKey], utxo);

            // We keep an extra copy as such -> id -> hash.
            await db.put([interface.db.inputMetadataHash, ...inputMetadataKey], hash);

            // Database this output, we database the utxo twice, eventually this will go
            if (outputType === protocol.outputs.OutputTypes.HTLC && config.archive) {
              // increase return owner balance
              // await balance.increase(returnOwner, token, amount, local, transactionHashId);

              // delete the mempool vbersion
              await db.del([interface.db.owner, returnOwner, token, zeroTimestamp,
                outputType, isWithdraw, hash]);

              // here we check for a spend, if spent don't put owner.
              try {
                await db.get([ interface.db.spent, outputType, hash ]);
              } catch (notAlreadySpent) {
                await db.put([interface.db.owner, returnOwner, token, timestamp,
                  outputType, isWithdraw, hash], utxo);
              }

              // add the archive stub
              await db.put([
                interface.db.archiveOwner,
                returnOwner,
                timestamp,
                transactionHashId,
              ], transactionHashId);
            }

            // delete the mempool version
            if (config.archive) {
              // input hash
              await db.put([interface.db.inputHash, ...inputHashKey], utxo);

              // increase return owner balance
              if (!isWithdraw) {
                if (outputType !== protocol.outputs.OutputTypes.HTLC) {
                  await balance.increase(owner, token, amount, local, transactionHashId);
                }
              } else {
                await balance.increase(
                  balance.withdrawAccount(owner), 
                  token, amount, local, transactionHashId);
              }

              // owner deletion
              await db.del([interface.db.owner, owner, token, zeroTimestamp,
                outputType, isWithdraw, hash]);

              // Check to see if this has already been spent, if so, don't flag owner.
              try {
                await db.get([ interface.db.spent, outputType, hash ]);
              } catch (notAlreadySpent) {
                // add the processed version
                await db.put([interface.db.owner, owner, token, timestamp,
                  outputType, isWithdraw, hash], utxo);
              }

              // add the archive stub
              await db.put([
                interface.db.archiveOwner,
                owner,
                timestamp,
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

            // Output proofs.
            outputProofs.push(protocol.root.Leaf({ data: output.properties.data().hex() }));

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

        // Interate through used token types.
        for (var i = 0; i < inKeys.length; i++) {
          // In key token ID value.
          const v = inKeys[i];

          try {
            utils.assert(v === outsKeys[i], 'ins-outs-keys');
            utils.assert(ins[v].eq(outs[outsKeys[i]]), 'inputs-mismatch-outputs');
          } catch (invalidSum) {
            // Prepair the token ID.
            const tokenId = utils.bigNumberify(parseInt(outsKeys[i], 10));

            // Get the token address for this token ID.
            const token = await config.db.get([
              interface.db.token,
              tokenId,
            ]);

            // Invalid transaction encoding.
            return await commitFraud(
              'proveInvalidSum',
              [
                protocol.transaction.TransactionProof({
                  block,
                  root,
                  transactions: transactions
                    .map(txHex => protocol.root.Leaf({
                      // Trim the length and 0x prefix.
                      data: struct.chunk(
                        '0x' + txHex.slice(6),
                      ),
                    })),
                  data,
                  signatureFee: fee,
                  signatureFeeToken: feeToken,
                  rootIndex,
                  transactionIndex,
                  token,
                  chainId: config.network.chainId,
                  inputProofs: await prepairUTXOForSum(
                    proofs,
                    metadata,
                    inputs,
                    config,
                  ),
                }).encodePacked(),
              ],
              config,
            );
          }
        }

        if (config.archive) {
          // archival metadata, this is prunable
          await db.put([
            interface.db.transactionMetadata,
            block.properties.height().get(),
            rootIndex,
            transactionIndex,
          ], transactionHashId);

          // Filter option now available.
          const _transactionInput = protocol.addons.Transaction({
            transaction: transactionHex,
            data,
            transactionIndex,
            rootIndex,
            inputsLength: inputs.length,
            outputsLength: outputs.length,
            witnessesLength: witnesses.length,
            blockHeight: block.properties.height().get(),
            blockNumber: block.properties.blockNumber().get(),
            timestamp,
            signatureFeeToken: feeToken,
            signatureFee: fee,
            spendableOutputs: spendableHashes,
            inputProofs: proofs.map(v => v.encodeRLP()),
            outputProofs: outputProofs.map(v => v.encodeRLP()),
            inputTypes,
          });

          // Filter API would allow developers to run a node and create simple filter plugins easily.
          try {
            // If the transaction filter is present, currently if there is an error it will just continue syncing.
            if (config.filter) {
              await config.filter(_transactionInput);
            }
          } catch (filterError) {}

          // archival transaction data, this is prunable
          await db.put([
            interface.db.transactionId,
            transactionHashId,
          ], _transactionInput);
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
            rootHash,
          ], root);
          await balance.increaseSyncAndMempool(
            block.properties.producer().get(),
            root.properties.feeToken().get(),
            root.properties.fee().get()
              .mul(root.properties.rootLength().get()),
            local,
            rootHash,
          );
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
    try {
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
          // If on the last retry, than throw an error.
          if (retry > numberOfRetries - 2) {
            throw new utils.ByPassError(error);
          }

          // wait 10 seconds for potentially more connections
          await utils.wait(10000);
  
          // let the terminal know a batch error has occured
          config.console.error(`batch processing error: ${error.message}`);
        }
      }

      // Write the block header
      await config.db.put([
        interface.db.block,
        block.properties.height().get(),
      ], block);
    } catch (batchWriteError) {
      // This is a catastrophic write error.
      // We will dump the dels and puts so we can force recover from this event.
      // Then we would add in the block header after.
      config.console.error(`catastrophic batch write during block processing error!`);
      config.console.error(batchWriteError);

      // if File system is available, write a dump for recovery.
      if (config.write) {
        await config.write(
          './block-write-dump.json',
          JSON.stringify(entries),
        );
        await config.write(
          './block-header-dump.json',
          JSON.stringify(block.object()),
        );

        // Process write dump success
        config.console.error(`process write dump success!`);
      }

      // Throw an error now.
      throw new utils.ByPassError(batchWriteError);
    }

    // clear the cache / simulation db
    await db.clear();

    // return the stats for this block
    return stats;
  } catch (processError) {
    config.console.error('process error', processError);
    throw new utils.ByPassError(processError);
  }
}

module.exports = process;
