const { test, utils, overrides } = require('@fuel-js/environment');
const { chunk, combine } = require('@fuel-js/struct');
const { ERC20, OwnedProxy, Fuel } = require('@fuel-js/contracts');

const { BlockHeader, RootHeader, Leaf,
    merkleTreeRoot } = require('@fuel-js/protocol2/src/block');
const tx = require('@fuel-js/protocol2/src/transaction');
const { Deposit } = require('@fuel-js/protocol2/src/deposit');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol2');
const struct = require('@fuel-js/struct');
const config = require('./config.local');
const sync = require('../sync');
const transact = require('../transact');

module.exports = test('prover', async t => {
    // Setup Addresses
    const producer = t.wallets[0].address;
    const cold = t.wallets[1].address;
    const coldWallet = t.wallets[1];
    const userA = t.wallets[2].address;
    const userAWallet = t.wallets[2];
    const userB = t.wallets[3].address;
    const userBWallet = t.wallets[3];
    const __chainId = 0;

    // Before method.
    async function state (opts = {}) {
        async function substate(substateOpts = {}) {
            // Produce the Block Producer Proxy.
            const proxy = await t.deploy(OwnedProxy.abi, OwnedProxy.bytecode, [
                producer,
                cold,
            ]);

            // Produce Fuel and the Genesis Hash.
            const genesisHash = utils.keccak256('0xdeadbeaf');
            const contract = await t.deploy(Fuel.abi, Fuel.bytecode, [
                proxy.address,
                40,
                20,
                20,
                utils.parseEther('1.0'),
                "Fuel",
                "1.1.0",
                __chainId,
                genesisHash,
            ]);

            // Set proxy target to Fuel.
            const coldProxy = proxy.connect(coldWallet);
            await t.wait(coldProxy.setTarget(contract.address, overrides),
                'set target', OwnedProxy.errors);

            // Commit addresses.
            await t.wait(contract.commitAddress(producer, overrides),
                'commit addresses', Fuel.errors);
            await t.wait(contract.commitAddress(t.wallets[1].address, overrides),
                'commit addresses', Fuel.errors);

            // State the number of addresses.
            let numAddresses = 3;

            // Specify the owners in question here.
            const owners = {
                '0': utils.emptyAddress,
                '1': producer,
                '2': t.wallets[1].address,
            };

            // Resolve data to the owner address.
            function resolveOwner(data = 0) {
                let ownerId = data.toHexString
                    ? data.toNumber()
                    : data;

                // If it's an address, return it.
                if (typeof ownerId === 'string'
                    && utils.hexDataLength(ownerId) == 20) {
                    return ownerId;
                }

                // If it's a 20 byte address, than pack and return.
                if (Array.isArray(ownerId) && ownerId.length === 20) {
                    return chunkJoin(ownerId);
                }

                // If it's a 4 byte identifier.
                if (Array.isArray(ownerId) && ownerId.length <= 8) {
                    ownerId = utils.bigNumberify(chunkJoin(ownerId)).toNumber();
                }

                // Return resolved owner address.
                return owners[ownerId];
            }

            // Settings.
            const settings = config({
                network: 'unspecified',
                provider: t.getProvider(),
                // console: console,
                contract,
                increaseBlock: t.increaseBlock,
                continue: () => false,
                produce: true,
                operators: [
                    t.getWallets()[0].privateKey
                ],
            });

            // Sync.
            await sync(settings);

            // Produce the token.
            const totalSupply = utils.parseEther('100000000000000.00');
            const erc20 = await t.deploy(ERC20.abi, ERC20.bytecode, [producer, totalSupply]);

            // Make a Deposit for User A.
            const userAFunnel = await contract.funnel(userA);
            const userAAmount = utils.parseEther('1000');

            // Two tokens, ether and token.
            let numTokens = 2;

            // Trander for User A Deposit Funnel.
            await t.wait(erc20.transfer(userAFunnel, userAAmount, overrides), 'erc20 transfer');
            await t.wait(t.wallets[0].sendTransaction({
                ...overrides,
                value: userAAmount,
                to: userAFunnel,
            }), 'ether to funnel');

            // User A Deposit Ether.
            const userADepositEther = new Deposit({
                token: 0,
                owner: userA,
                blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
                value: userAAmount,
            });
            const userADepositEtherx = await t.wait(contract.deposit(userA, utils.emptyAddress, overrides),
                'ether deposit', Fuel.errors);

            // User A Deposit Token.
            const userADepositToken = new Deposit({
                token: 1,
                owner: userA,
                blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
                value: userAAmount,
            });
            const userADepositTokenTx = await t.wait(contract.deposit(userA, erc20.address, overrides),
                'ether deposit', Fuel.errors);

            // Producer funnel.
            const producerAFunnel = await contract.funnel(producer);
            await t.wait(t.wallets[0].sendTransaction({
                ...overrides,
                value: userAAmount,
                to: producerAFunnel,
            }), 'ether to producer funnel');

            // Producer Deposit.
            const producerADepositToken = new Deposit({
                token: 0,
                owner: producer,
                blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
                value: userAAmount,
            });
            const producerADepositTokenTx = await t.wait(contract.deposit(producer, utils.emptyAddress, overrides),
                'producer deposit', Fuel.errors);

            // Producer Deposit.
            const inputAFunnel = await contract.funnel(producer);
            await t.wait(t.wallets[0].sendTransaction({
                ...overrides,
                value: userAAmount,
                to: inputAFunnel,
            }), 'ether to producer funnel');

            const inputADepositToken = new Deposit({
                token: 0,
                owner: producer,
                blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
                value: userAAmount,
            });
            const inputADepositTokenTx = await t.wait(contract.deposit(producer, utils.emptyAddress, overrides),
                'producer deposit', Fuel.errors);

            // Producer Deposit 2.
            await t.wait(t.wallets[0].sendTransaction({
                ...overrides,
                value: userAAmount,
                to: inputAFunnel,
            }), 'ether to producer funnel');

            const inputADepositToken2 = new Deposit({
                token: 0,
                owner: producer,
                blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
                value: userAAmount,
            });
            const inputADepositTokenTx2 = await t.wait(contract.deposit(producer, utils.emptyAddress, overrides),
                'producer deposit', Fuel.errors);

            // Produce a valid tx for the Main tx to input.
            const inputTx0HTLCExpiry = (
                await t.provider.getBlockNumber()
            ) + 4;
            let inputTx0 = await tx.Transaction({
                override: true,
                chainId: __chainId,
                witnesses: [
                    { _caller: true },
                ],
                metadata: [
                    tx.MetadataDeposit({
                        blockNumber: inputADepositToken2.properties.blockNumber().get(),
                        token: inputADepositToken2.properties.token().get(),
                    }),
                ],
                data: [
                    inputADepositToken2.keccak256(),
                ],
                inputs: [
                    tx.InputDeposit({
                        owner: inputADepositToken2.properties.owner().get(),
                    }),
                ],
                signatureFeeToken: 0,
                signatureFee: utils.parseEther('0.000003'),
                signatureFeeOutputIndex: 0,
                outputs: [
                    tx.OutputTransfer({
                        noshift: true,
                        token: '0x00',
                        owner: producer,
                        amount: utils.parseEther('500.00'),
                    }),
                    tx.OutputTransfer({
                        token: '0x00',
                        owner: '0x01',
                        amount: utils.parseEther('250.00'),
                    }),
                    tx.OutputHTLC({
                        token: '0x00',
                        owner: producer,
                        amount: utils.parseEther('150.00'),
                        digest: utils.sha256(utils.hexZeroPad('0xdeadbeaf', 32)),
                        expiry: 10000,
                        returnOwner: '0x00',
                    }),
                    tx.OutputHTLC({
                        token: '0x00',
                        owner: producer,
                        amount: utils.parseEther('100.00'),
                        digest: utils.sha256(utils.hexZeroPad('0xdeadbeaf', 32)),
                        expiry: inputTx0HTLCExpiry,
                        returnOwner: userA,
                    }),
                ],
                contract,
            });

            // Metadata used here and for double spend.
            const inputTxMetadata = tx.Metadata({
                blockHeight: 1,
                rootIndex: 0,
                transactionIndex: 0,
                outputIndex: 1,
            });

            const inputPrecTxUTXO = tx.UTXO({
                transactionHashId: inputTx0.transactionHashId(),
                outputIndex: 1,
                amount: utils.parseEther('250.00'),
                owner: producer,
            });

            // Used for double spend.
            const inputTxMetadataHTLC = tx.Metadata({
                blockHeight: 1,
                rootIndex: 0,
                transactionIndex: 0,
                outputIndex: 2,
            });

            // Produce a valid tx for the Main tx to input.
            let inputTx = await tx.Transaction({
                override: true,
                chainId: __chainId,
                witnesses: [
                    { _caller: true },
                ],
                metadata: [
                    tx.MetadataDeposit({
                        blockNumber: inputADepositToken.properties.blockNumber().get(),
                        token: inputADepositToken.properties.token().get(),
                    }),
                    inputTxMetadata,
                    inputTxMetadataHTLC,
                ],
                data: [
                    inputADepositToken.keccak256(),
                    tx.UTXO({
                        transactionHashId: inputTx0.transactionHashId(),
                        outputIndex: 1,
                        outputType: 0,
                        amount: utils.parseEther('250.00'),
                        token: 0,
                        owner: producer,
                    }).keccak256(),
                    tx.UTXO({
                        transactionHashId: inputTx0.transactionHashId(),
                        outputIndex: 2,
                        outputType: protocol.outputs.OutputTypes.HTLC,
                        amount: utils.parseEther('150.00'),
                        digest: utils.sha256(utils.hexZeroPad('0xdeadbeaf', 32)),
                        token: 0,
                        expiry: 10000,
                        owner: producer,
                        returnOwner: utils.emptyAddress,
                    }).keccak256(),
                ],
                inputs: [
                    tx.InputDeposit({
                        owner: inputADepositToken.properties.owner().get(),
                    }),
                    tx.Input({}),
                    tx.InputHTLC({
                        preImage: utils.hexZeroPad('0xdeadbeaf', 32),
                    }),
                ],
                signatureFeeToken: 0,
                signatureFee: utils.parseEther('0.000003'),
                signatureFeeOutputIndex: 0,
                outputs: [
                    tx.OutputTransfer({
                        noshift: true,
                        token: '0x00',
                        owner: producer,
                        amount: utils.parseEther('250.00'),
                    }),
                    tx.OutputTransfer({
                        token: '0x00',
                        owner: producer,
                        amount: utils.parseEther('1000.00'),
                    }),
                    tx.OutputTransfer({
                        token: '0x00',
                        owner: producer,
                        amount: utils.parseEther('150.00'),
                    }),
                    tx.OutputWithdraw({
                        token: '0x00',
                        owner: producer,
                        amount: '0x00',
                    }),
                    tx.OutputReturn({
                        data: '0xaa',
                    }),
                ],
                contract,
            });

            // Produce a seperate root with this transaction.
            const inputTxs = opts.emptyTransaction 
                ? [inputTx0]
                : [inputTx0, inputTx];
            const inputRootFee = utils.parseEther('0.000003');
            const inputRoot = (new RootHeader({
                rootProducer: producer,
                merkleTreeRoot: merkleTreeRoot(inputTxs),
                commitmentHash: utils.keccak256(combine(inputTxs)),
                rootLength: utils.hexDataLength(combine(inputTxs)),
                fee: inputRootFee,
            }));
            await t.wait(contract.commitRoot(
                inputRoot.properties.merkleTreeRoot().get(),
                0,
                utils.parseEther('0.000003'),
                combine(inputTxs),
                overrides),
                'valid submit', Fuel.errors);
            const inputRootAmount = inputRootFee.mul(
                utils.hexDataLength(combine(inputTxs)),
            );

            // Sync.
            await sync(settings);
            await sync(settings);

            // The fuel block tip.
            let blockTip = (await contract.blockTip()).add(1);

            // Produce a block header with this transaction.
            const inputHeader = (new BlockHeader({
                producer,
                height: blockTip,
                numTokens,
                numAddresses: numAddresses,
                roots: [inputRoot.keccak256Packed()],
            }));

            // Produce a block with this transaction.
            let currentBlock = await t.provider.getBlockNumber();
            let currentBlockHash = (await t.provider.getBlock(currentBlock)).hash;
            
            // Commit transaction encoded data.
            const commitInputTx = contract.interface.functions.commitBlock.encode([
                currentBlock,
                currentBlockHash,
                blockTip,
                [inputRoot.keccak256Packed()],
            ]);

            await t.wait(
                proxy.transact(
                    contract.address,
                    await contract.BOND_SIZE(),
                    commitInputTx,
                    {
                        gasLimit: 4000000,
                        value: await contract.BOND_SIZE(),
                    },
                ),
                'commit block',
                Fuel.errors);
        
            // END of Input production.

            // Sync.
            await sync(settings);

            // Set fee stipulations.
            let feeToken = 1;
            let fee = opts.signatureFee || utils.parseEther('.000012');
            let noFee = utils.bigNumberify(fee).lte(0);

            // The transaction data for the input above.
            const inputTxData = {
                metadata: tx.Metadata({
                    blockHeight: 1,
                    rootIndex: 0,
                    transactionIndex: 1,
                    outputIndex: (
                        opts.spendWithdraw
                            ? 3
                            : (opts.spendReturn ? 4 : 1)
                    ),
                }),
                data: tx.UTXO({
                    transactionHashId: inputTx.transactionHashId(),
                    outputIndex: (
                        opts.spendWithdraw
                            ? 3
                            : (opts.spendReturn ? 4 : 1)
                    ),
                    amount: userAAmount,
                    token: 0,
                    owner: producer,
                }),
            };

            const expiredHTLCInput = {
                metadata: tx.Metadata({
                    blockHeight: 1,
                    rootIndex: 0,
                    transactionIndex: opts.transactionIndexOverflow ? 2 : 0,
                    outputIndex: 3,
                }),
                data: tx.UTXO({
                    transactionHashId: inputTx0.transactionHashId(),
                    outputIndex: 3,
                    outputType: protocol.outputs.OutputTypes.HTLC,
                    amount: utils.parseEther('100.00'),
                    digest: utils.sha256(utils.hexZeroPad('0xdeadbeaf', 32)),
                    token: 0,
                    expiry: inputTx0HTLCExpiry,
                    owner: producer,
                    returnOwner: userA,
                }),
            };

            // Set the index of this HTLC to a transfer.
            if (opts.spendTransferWhenHTLC) {
                // Set the HTLC to a transfer output.
                expiredHTLCInput.metadata.properties
                    .outputIndex()
                    .set(1);
            }

            // Second deposit, used for double spend.
            const secondDepositUsed = opts.doubleSpendDepositSameTx
                ? producerADepositToken
                : userADepositToken;

            // Build the transaction in question.
            let transactionMain = await tx.Transaction({
                override: true,
                chainId: __chainId,
                witnesses: opts.witnesses || [
                    userAWallet,
                    { _caller: true },
                    { _producer: true },
                ],
                metadata: opts.metadata || [
                    tx.MetadataDeposit({
                        blockNumber: userADepositEther.properties
                            .blockNumber().get(),
                        token: userADepositEther.properties
                            .token().get(),
                    }),
                    tx.MetadataDeposit({
                        blockNumber: (opts.depositValueUnderflow 
                            ? '0x01'
                            : secondDepositUsed.properties.blockNumber().get()),
                        token: secondDepositUsed.properties.token().get(),
                    }),
                    (opts.doubleSpendTransfer
                        ? inputTxMetadata
                        : inputTxData.metadata),
                    tx.MetadataDeposit({
                        blockNumber: (opts.doubleSpendDeposit
                            ? inputADepositToken2
                            : producerADepositToken).properties.blockNumber().get(),
                        token: producerADepositToken.properties.token().get(),
                    }),
                    tx.Metadata({
                        blockHeight: 1,
                        rootIndex: opts.rootOverflow ? 1 : 0,
                        transactionIndex: opts.rootMetadataIndexOverflow ? 1 : 0,
                        outputIndex: opts.rootMetadataOutputOverflow 
                            ? 1
                            : 0,
                    }),
                    (opts.doubleSpendHTLC 
                        ? inputTxMetadataHTLC
                        : expiredHTLCInput.metadata),
                ],
                data: opts.data || [
                    userADepositEther.keccak256(),
                    secondDepositUsed.keccak256(),
                    (opts.doubleSpendTransfer 
                        ? inputPrecTxUTXO
                        : inputTxData.data).keccak256(),
                    (opts.doubleSpendDepositSameTx
                        ? inputADepositToken2
                        : producerADepositToken).keccak256(),
                    inputRoot.keccak256Packed(),
                    expiredHTLCInput.data.keccak256(),
                ],
                inputs: opts.inputs || [
                    tx.InputDeposit({
                        owner: userADepositEther.properties.owner().get(),
                    }),
                    tx.InputDeposit({
                        owner: secondDepositUsed.properties.owner().get(),
                    }),
                    tx.Input({
                        witnessReference: 1,
                    }),
                    tx.InputDeposit({
                        witnessReference: 1,
                        owner: producerADepositToken.properties.owner().get(),
                    }),
                    tx.InputRoot({
                        witnessReference: 2,
                    }),
                    tx.InputHTLC({ // is expired.
                        witnessReference: opts.expiredHtlcReference || 0,
                        preImage: utils.emptyAddress,
                    }),
                ],
                signatureFeeToken: feeToken,
                signatureFee: fee,
                signatureFeeOutputIndex: noFee ? null : 0,
                outputs: opts.outputs || [
                    tx.OutputTransfer({
                        noshift: true,
                        token: '0x01',
                        owner: utils.emptyAddress,
                        amount: utils.parseEther('100.00'),
                    }),
                    tx.OutputWithdraw({
                        token: '0x00',
                        owner: producer,
                        amount: utils.parseEther('3000.00')
                            .add(inputRootAmount)
                            .add(utils.parseEther('100.00')),
                    }),
                    tx.OutputHTLC({
                        token: '0x01',
                        owner: '0x00',
                        amount: utils.parseEther('100.00'),
                        expiry: 70000,
                        digest: utils.sha256('0xdeadbeaf'),
                        returnOwner: utils.emptyAddress,
                    }),
                    tx.OutputTransfer({
                        token: '0x01',
                        owner: producer,
                        amount: utils.parseEther('100.00'),
                    }),
                    tx.OutputTransfer({
                        token: '0x01',
                        owner: '0x01',
                        amount: utils.parseEther('100.00'),
                    }),
                    tx.OutputTransfer({
                        token: '0x01',
                        owner: '0x02',
                        amount: utils.parseEther('100.00'),
                    }),
                    tx.OutputReturn({
                        data: utils.hexlify(utils.randomBytes(45)),
                    }),
                    tx.OutputTransfer({
                        token: '0x01',
                        owner: producer,
                        amount: utils.parseEther('500.00'),
                    }),
                ],
                contract,
            });

            // Here we go the transact root, stop early.
            if (substateOpts.transact
                && !opts.metadataFraud) {
                await sync(settings);

                if (opts.fraud) {
                    try {
                        await transact(
                            transactionMain.unsigned().encodeRLP(),
                            transactionMain.properties.witnesses().hex(),
                            0,
                            settings,
                        );
                        t.ok(0, 'transaction success when fraud: ' + opts.fraud);
                    } catch (transactError) {
                        t.ok(transactError, 'transaction stopped' + opts.fraud);
                    }
                    return;
                }

                // Transact.
                await transact(
                    transactionMain.unsigned().encodeRLP(),
                    transactionMain.properties.witnesses().hex(),
                    0,
                    settings,
                );
                
                // Stop process here.
                return;
            }

            // Produce a seperate root with this transaction.
            const txsMain = opts.txs || [transactionMain];
            const rootMain = (new RootHeader({
                rootProducer: producer,
                merkleTreeRoot: merkleTreeRoot(txsMain),
                commitmentHash: utils.keccak256(combine(txsMain)),
                rootLength: utils.hexDataLength(combine(txsMain)),
                feeToken: feeToken,
                fee: fee,
            }));
            await t.wait(contract.commitRoot(
                rootMain.properties.merkleTreeRoot().get(),
                feeToken,
                fee,
                combine(txsMain),
                overrides),
                'valid submit', Fuel.errors);

            // The fuel block tip.
            blockTip = (await contract.blockTip()).add(1);

            // Produce a block header with this transaction.
            const headerMain = (new BlockHeader({
                producer,
                height: blockTip,
                numTokens,
                numAddresses: numAddresses,
                roots: [rootMain.keccak256Packed()],
            }));

            // Specify the main root index.
            const mainRootIndex = 0;

            // Produce a block with this transaction.
            currentBlock = await t.provider.getBlockNumber();
            currentBlockHash = (await t.provider.getBlock(currentBlock)).hash;
            
            // Commit transaction encoded data.
            const commitTx = contract.interface.functions.commitBlock.encode([
                currentBlock,
                currentBlockHash,
                blockTip,
                [rootMain.keccak256Packed()],
            ]);

            const block = await t.wait(
                proxy.transact(
                    contract.address,
                    await contract.BOND_SIZE(),
                    commitTx,
                    {
                        gasLimit: 4000000,
                        value: await contract.BOND_SIZE(),
                    },
                ),
                'commit block',
                Fuel.errors);

            const blockEvent = contract.interface
                .parseLog(block.logs[0]);
            headerMain.properties.blockNumber()
                .set(block.logs[0].blockNumber);
            headerMain.properties.previousBlockHash()
                .set(blockEvent.values.previousBlockHash);

            // Process the block in question.
            await sync(settings);
            await sync(settings);
            await sync(settings);
            await sync(settings);

            // Get the pre-state before the block in question is processed.
            const preState = protocol.state.State(await settings.db.get([
                interface.db.state,
            ]));

            // Process the block in question.
            await sync(settings);

            // Run sync again, this time, after 10 blocks have passed.
            if (opts.fraud) {
                await t.increaseBlock(10);
                await sync(settings);
                await sync(settings);
                await sync(settings);
            }

            // Need to further sync one cycle for a positive state.
            if (!opts.fraud) {
                await sync(settings);
                await sync(settings);
                await sync(settings);
            }

            // Get the post-state before the block in question is processed.
            const postState = protocol.state.State(await settings.db.get([
                interface.db.state,
            ]));

            // Check block height after block processing in client.
            t.equalBig(postState.properties.blockHeight().get(), 
                opts.fraud ? 1 : 2, "post block height");

            // Get logs.
            const logsDetected = await t.getProvider().getLogs({
                address: contract.address,
                fromBlock: 0,
                toBlock: 'latest',
            });

            // Feaud logs are detected.
            let fraudLogDetected = false;

            // Detect fraud logs.
            for (const log of logsDetected) {
                const decoded = contract.interface.parseLog(log);

                // Skip null.
                if (!decoded) continue;

                // Handle Fraud.
                if (opts.fraud && decoded.name === 'FraudCommitted') {
                    fraudLogDetected = true;
                    t.equalBig(
                        Fuel.errors[opts.fraud],
                        decoded.values.fraudCode,
                        'fraud code check: ' + opts.fraud,
                    );
                }
            }

            if (opts.fraud) {
                t.ok(fraudLogDetected, 'fraud logs detected');
            }
        }

        // Try the normal block production / fraud prover.
        await substate();

        // Try transacting with the lambda.
        if (!opts.metadataFraud) {
            await substate({ transact: true });
        }
    }

    // Produce valid state.
    await state();

    await state({
        signatureFee: '0x00',
        metadata: [
            protocol.metadata.Metadata({
                blockHeight: 0,
            }),
        ],
        inputs: [
            protocol.inputs.Input(),
        ],
        metadataFraud: true,
        fraud: 'metadata-height-underflow',
    });

    await state({
        outputs: [
            protocol.outputs.OutputTransfer({
                amount: utils.parseEther('10000.0'),
                owner: utils.emptyAddress,
                token: '0x01',
            }),
        ],
        fraud: 'sum',
    });

    await state({
        witnesses: [
            userBWallet,
            { _caller: true },
            { _producer: true },
        ],
        fraud: "deposit-witness",
    });

    await state({
        signatureFee: '0x00',
        metadata: [
            protocol.metadata.Metadata({
                blockHeight: 1,
                rootIndex: 1,
            }),
        ],
        inputs: [
            protocol.inputs.Input(),
        ],
        data: [
            utils.emptyBytes32,
        ],
        metadataFraud: true,
        fraud: 'input-root-index-overflow',
    });

    await state({
        signatureFee: '0x00',
        metadata: [
            protocol.metadata.Metadata({
                blockHeight: 2,
                rootIndex: 0,
                transactionIndex: 1,
            }),
        ],
        inputs: [
            protocol.inputs.Input(),
        ],
        data: [
            utils.emptyBytes32,
        ],
        metadataFraud: true,
        fraud: 'metadata-index-overflow',
    });

    await state({
        signatureFee: '0x00',
        metadata: [
            protocol.metadata.Metadata({
                blockHeight: 2,
                rootIndex: 0,
                transactionIndex: 0,
            }),
        ],
        inputs: [
            protocol.inputs.Input(),
        ],
        data: [
            utils.emptyBytes32,
        ],
        metadataFraud: true,
        fraud: 'metadata-index-overflow',
    });

    await state({
        doubleSpendDepositSameTx: true,
        fraud: "double-spend",
    });

    await state({
        spendTransferWhenHTLC: true,
        metadataFraud: true,
        fraud: "input-htlc-type",
    });

    await state({
        spendWithdraw: true,
        fraud: "input-withdraw",
    });

    await state({
        spendReturn: true,
        fraud: "input-return",
    });

    await state({
        emptyTransaction: true,
        fraud: "empty-transaction",
    });

    await state({
        depositValueUnderflow: true,
        metadataFraud: true,
        fraud: "input-deposit-value-underflow",
    });

    // Transaciton index overflow in metadata.
    await state({
        doubleSpendDeposit: true,
        metadataFraud: true,
        fraud: "double-spend",
    });

    await state({
        doubleSpendTransfer: true,
        fraud: "double-spend",
    });

    await state({
        doubleSpendHTLC: true,
        metadataFraud: true,
        fraud: "double-spend",
    });

    // Transaciton index overflow in metadata.
    await state({
        transactionIndexOverflow: true,
        metadataFraud: true,
        fraud: "input-transaction-index-overflow",
    });

    await state({
        rootMetadataIndexOverflow: true,
        metadataFraud: true,
        fraud: "root-transaction-index",
    });

    await state({
        rootMetadataOutputOverflow: true,
        metadataFraud: true,
        fraud: "root-output-index",
    });

    // Root index reference overflow in metadata.
    await state({
        rootOverflow: true,
        metadataFraud: true,
        fraud: "input-root-index-overflow",
    });

    // Malformed block state.
    await state({
        txs: [
            new Leaf({
                data: chunk(utils.hexlify(utils.randomBytes(200))),
            }),
            new Leaf({
                data: chunk(utils.hexlify(utils.randomBytes(10))),
            }),
        ],
        metadataFraud: true,
        fraud: 'transaction-length-underflow',
    });

    await state({
        txs: [
            new Leaf({
                data: chunk(utils.hexlify(utils.randomBytes(1000))),
            }),
        ],
        metadataFraud: true,
        fraud: 'transaction-length-overflow',
    });

    await state({
        txs: [
            new protocol.transaction._Transaction({
                length: '0x0100',
                inputs: utils.hexZeroPad('0x00', 44),
            }),
        ],
        metadataFraud: true,
        fraud: 'net-length-overflow',
    });

    await state({
        metadata: [],
        metadataFraud: true,
        fraud: 'metadata-size-underflow',
    });
    
    // Invalid witness checks.
    await state({
        witnesses: [
            userAWallet,
            userBWallet,
            { _producer: true },
        ],
        fraud: "utxo-witness",
    });

    await state({
        witnesses: [
            { _producer: true },
            userBWallet,
            { _producer: true },
        ],
        fraud: "deposit-witness",
    });

    await state({
        witnesses: [
            userBWallet,
            { _caller: true },
            { _producer: true },
        ],
        fraud: "deposit-witness",
    });

    await state({
        expiredHtlcReference: 1,
        fraud: "htlc-owner-return",
    });

    await state({
        metadata: (new Array(9))
            .fill(0).map(v => protocol.metadata.Metadata({
                blockHeight: 1,
                rootIndex: 0,
            })),
        metadataFraud: true,
        fraud: 'metadata-size-overflow',
    });

    await state({
        witnesses: [],
        fraud: 'witnesses-size-underflow',
    });

    // Prepair an invalid witness for overflow.
    let witnesses = [tx.Caller({
        owner: producer,
        blockNumber: '0x00',
    })];
    witnesses[0].properties.type().set('0x00');

    await state({
        witnesses: witnesses,
        fraud: 'witnesses-size-overflow',
    });

    await state({
        inputs: [],
        fraud: 'inputs-size-underflow',
    });

    await state({
        inputs: (new Array(9))
        .fill(0).map(v => protocol.inputs.Input({
        })),
        fraud: 'inputs-index-overflow',
    });

    await state({
        inputs: struct.chunk(
            '0x0400',
        ),
        fraud: 'inputs-type-overflow',
    });

    await state({
        inputs: [
            protocol.inputs.Input({
                witnessReference: 3,
            }),
        ],
        fraud: 'inputs-witness-reference-overflow',
    });

    await state({
        outputs: [
            protocol.outputs.OutputTransfer({
                owner: utils.emptyAddress,
                token: struct.chunk(
                    utils.hexZeroPad('0x0a', 21),
                ),
                amount: utils.parseEther('1.0'),
            }),
        ],
        fraud: 'outputs-token-length-overflow',
    });

    await state({
        outputs: [
            protocol.outputs.OutputTransfer({
                owner: utils.emptyAddress,
                token: '0x02',
                amount: utils.parseEther('1.0'),
            }),
        ],
        fraud: 'outputs-token-id-overflow',
    });

    const amountOverflowOutput = protocol.outputs.OutputTransfer({
        token: '0x01',
        amount: 0,
        owner: producer,
    });
    amountOverflowOutput.properties.amount().set([]);

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: 0,
            owner: producer,
        }), amountOverflowOutput],
        fraud: 'outputs-amount-underflow',
    });

    const amountOverflowOutput2 = protocol.outputs.OutputTransfer({
        token: '0x01',
        amount: 0,
        owner: producer,
    });
    amountOverflowOutput2.properties.amount()
        .set(utils.hexZeroPad('0xaa', 33));

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: 0,
            owner: producer,
        }), amountOverflowOutput2],
        fraud: 'outputs-amount-overflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: [],
        })],
        fraud: 'outputs-owner-underflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.hexZeroPad('0xaa', 21),
        })],
        fraud: 'outputs-owner-overflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.hexZeroPad('0x3', 4),
        })],
        fraud: 'outputs-owner-id-overflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.hexZeroPad('0x3', 4),
        })],
        fraud: 'outputs-owner-id-overflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),protocol.outputs.OutputReturn({
            data: [],
        })],
        fraud: 'outputs-data-underflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),protocol.outputs.OutputReturn({
            data: utils.hexZeroPad('0xaa', 513),
        })],
        fraud: 'outputs-data-overflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),protocol.outputs.OutputHTLC({
            digest: utils.sha256('0xdeadbeaf'),
            expiry: 10000,
            returnOwner: [],
            token: '0x01',
            owner: utils.emptyAddress,
            amount: utils.parseEther('1.0'),
        })],
        fraud: 'outputs-return-owner-underflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),protocol.outputs.OutputHTLC({
            digest: utils.sha256('0xdeadbeaf'),
            expiry: 10000,
            returnOwner: utils.hexZeroPad('0x01', 21),
            token: '0x01',
            owner: utils.emptyAddress,
            amount: utils.parseEther('1.0'),
        })],
        fraud: 'outputs-return-owner-overflow',
    });

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),protocol.outputs.OutputHTLC({
            digest: utils.sha256('0xdeadbeaf'),
            expiry: 10000,
            returnOwner: utils.hexZeroPad('0x03', 4),
            token: '0x01',
            owner: utils.emptyAddress,
            amount: utils.parseEther('1.0'),
        })],
        fraud: 'outputs-return-owner-id-overflow',
    });

    const badOutputType = protocol.outputs.OutputTransfer({
        token: '0x01',
        amount: utils.parseEther('1.0'),
        owner: utils.emptyAddress,
    });
    badOutputType.properties.type().set(4);

    await state({
        signatureFee: '0x00',
        outputs: [protocol.outputs.OutputTransfer({
            token: '0x01',
            amount: utils.parseEther('1.0'),
            owner: utils.emptyAddress,
        }),badOutputType],
        fraud: 'outputs-type',
    });

    await state({
        signatureFee: '0x00',
        witnesses: [
            protocol.witness.Caller({
                owner: producer,
                blockNumber: '0x00',
            }),
        ],
        fraud: 'witness-caller-empty',
    });

    const invalidWitnessType = protocol.witness.Caller({
        owner: producer,
        blockNumber: '0x00',
    });
    invalidWitnessType.properties.type().set(
        4,
    );

    await state({
        signatureFee: '0x00',
        witnesses: [
            invalidWitnessType,
        ],
        fraud: 'witness-type',
    });

    await state({
        signatureFee: '0x00',
        witnesses: [
            protocol.witness._Signature(),
            protocol.witness._Signature(),
            protocol.witness._Signature(),
            protocol.witness._Signature(),
            protocol.witness.Producer(),
            protocol.witness.Producer(),
            protocol.witness.Producer(),
            protocol.witness.Producer(),
            protocol.witness.Producer(),
        ],
        fraud: 'witnesses-index-overflow',
    });

    await state({
        signatureFee: '0x00',
        metadata: [
            protocol.metadata.MetadataDeposit({
                blockNumber: 0,
            }),
            protocol.metadata.MetadataDeposit({
                blockNumber: 0,
            }),
            protocol.metadata.Metadata({
                blockNumber: 0,
            }),
            protocol.metadata.MetadataDeposit({
                blockNumber: 0,
            }),
            protocol.metadata.Metadata({
                blockNumber: 0,
            }),
            protocol.metadata.Metadata({
                blockNumber: 0,
            }),
        ],
        metadataFraud: true,
        fraud: 'metadata-deposit-height-underflow',
    });

    await state({
        signatureFee: '0x00',
        metadata: [
            protocol.metadata.MetadataDeposit({
                blockNumber: 10000,
            }),
            protocol.metadata.MetadataDeposit({
                blockNumber: 10000,
            }),
            protocol.metadata.Metadata({
                blockNumber: 10000,
            }),
            protocol.metadata.MetadataDeposit({
                blockNumber: 10000,
            }),
            protocol.metadata.Metadata({
                blockNumber: 0,
            }),
            protocol.metadata.Metadata({
                blockNumber: 0,
            }),
        ],
        metadataFraud: true,
        fraud: 'metadata-deposit-height-overflow',
    });

    await state({
        signatureFee: '0x00',
        metadata: [
            protocol.metadata.MetadataDeposit({
                blockNumber: 2,
                token: 2,
            }),
            protocol.metadata.MetadataDeposit({
                blockNumber: 2,
            }),
            protocol.metadata.Metadata({
                blockNumber: 10000,
            }),
            protocol.metadata.MetadataDeposit({
                blockNumber: 2,
            }),
            protocol.metadata.Metadata({
                blockNumber: 0,
            }),
            protocol.metadata.Metadata({
                blockNumber: 0,
            }),
        ],
        metadataFraud: true,
        fraud: 'metadata-deposit-token-overflow',
    });
});