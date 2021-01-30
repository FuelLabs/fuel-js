const { test, utils, overrides } = require('@fuel-js/environment');
const { chunk, combine } = require('@fuel-js/struct');
// const { bytecode, abi, errors } = require('./builds/Fuel.json');
// const OwnedProxy = require('./builds/OwnedProxy.json');

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

// Here we build a complex transaction scenario, valid and invalid across multiple blocks and transactions.
// This should give us more evidence the processing and transacting works correctly.
module.exports = test('correctness', async t => {
    // Setup Addresses
    const producer = t.wallets[0].address;
    const cold = t.wallets[1].address;
    const coldWallet = t.wallets[1];
    const userA = t.wallets[2].address;
    const userAWallet = t.wallets[2];
    const userB = t.wallets[3].address;
    const userBWallet = t.wallets[3];

    // Produce additional roots for testing, slower.
    const noExtraRoots = false;

    // Produce additional txs, slower.
    const noExtraTransactions = false;

    // Before method.
    async function state (opts = {}) {
        // Produce the Block Producer Proxy.
        const proxy = await t.deploy(OwnedProxy.abi, OwnedProxy.bytecode, [
            producer,
            cold,
        ]);

        // Produce Fuel and the Genesis Hash.
        const genesisHash = utils.keccak256('0xdeadbeaf');
        const contract = await t.deploy(Fuel.abi, Fuel.bytecode, [
            proxy.address,
            20,
            20,
            20,
            utils.parseEther('1.0'),
            "Fuel",
            "1.1.0",
            0,
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
            if (typeof ownerId === 'string' && utils.hexDataLength(ownerId) == 20) {
                return ownerId;
            }

            // If it's a 20 byte address, than pack and return.
            if (Array.isArray(ownerId) && ownerId.length === 20) {
                return struct.chunkJoin(ownerId);
            }

            // If it's a 4 byte identifier.
            if (Array.isArray(ownerId) && ownerId.length <= 8) {
                ownerId = utils.bigNumberify(struct.chunkJoin(ownerId)).toNumber();
            }

            // Return resolved owner address.
            return owners[ownerId];
        }

        // Settings.
        const settings = config({
            network: 'unspecified',
            provider: t.getProvider(),
            console: console,
            contract,
            continue: () => false,
            produce: true,
            operators: [
                t.getWallets()[0].privateKey
            ],
        });

        // Normal mempool settings.
        const normalMempool = {
            minimumTransactionsPerRoot: 200, // min 1 tx
            rootLengthTarget: 31000, // 200 bytes
        };

        // Sync.
        await sync({
            ...settings,
        });

        // Produce the token.
        const totalSupply = utils.parseEther('100000000000000.00');
        const erc20 = await t.deploy(ERC20.abi, ERC20.bytecode, [producer, totalSupply]);

        // Make a Deposit for User A.
        const userAFunnel = await contract.funnel(userA);
        const userAAmount = utils.parseEther('1000');

        // Two tokens, ether and token.
        let numTokens = 2;

        // Produce a simple filler tx.
        // Will return a transaction proof.
        async function makeSimpleTx() {
            await t.wait(erc20.transfer(userAFunnel, userAAmount, overrides),
                'erc20 transfer');

            // User A Deposit Token.
            const userADepositToken = new Deposit({
                token: 1,
                owner: userA,
                blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
                value: userAAmount,
            });
            const userADepositTokenTx = await t.wait(contract.deposit(userA, erc20.address, overrides),
                'token deposit', Fuel.errors);

            // Set fee stipulations.
            let feeToken = 1;
            let fee = opts.signatureFee || utils.parseEther('.000012');
            let noFee = utils.bigNumberify(fee).lte(0);

            // Build the transaction in question.
            return await tx.Transaction({
                override: true,
                chainId: 0,
                witnesses: [
                    userAWallet,
                ],
                metadata: [
                    tx.MetadataDeposit({
                        blockNumber: userADepositToken.properties.blockNumber().get(),
                        token: userADepositToken.properties.token().get(),
                    }),
                ],
                data: [
                    userADepositToken.keccak256(),
                ],
                inputs: [
                    tx.InputDeposit({
                        owner: userADepositToken.properties
                            .owner().get(),
                    }),
                ],
                signatureFeeToken: feeToken,
                signatureFee: fee,
                signatureFeeOutputIndex: noFee ? null : 0,
                outputs: [
                    tx.OutputTransfer({
                        noshift: true,
                        token: '0x01',
                        owner: producer,
                        amount: utils.parseEther('1000.00'),
                    }),
                ],
                contract,
            });
        }

        // Produce a transaction in a block.
        async function makeTx(txOpts = {}) {
            // Trander for User A Deposit Funnel.
            await t.wait(erc20.transfer(userAFunnel, userAAmount, overrides), 'erc20 transfer');
            await t.wait(t.wallets[0].sendTransaction({
                ...overrides,
                value: userAAmount,
                to: userAFunnel,
            }), 'ether to funnel');

            // Transaction index.
            const transactionIndex = noExtraTransactions
                ? 0 
                : txOpts.transactionIndex;

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

            // Sync.
            await sync({
                ...settings,
                stopForOverflow: true,
            });

            // Set fee stipulations.
            let feeToken = 1;
            let fee = opts.signatureFee || utils.parseEther('.000012');
            let noFee = utils.bigNumberify(fee).lte(0);

            const specialOutput = txOpts.output
                || tx.OutputTransfer({
                    token: '0x01',
                    owner: userA,
                    amount: utils.parseEther('100.00'),
                });

            // Main outputs;
            let mainOutputs = opts.outputs || [
                tx.OutputTransfer({
                    noshift: true,
                    token: '0x01',
                    owner: producer,
                    amount: utils.parseEther('100.00'),
                }),
                tx.OutputTransfer({
                    token: '0x00',
                    owner: producer,
                    amount: utils.parseEther('1000.00'),
                }),
                tx.OutputHTLC({
                    token: '0x01',
                    owner: '0x00',
                    amount: utils.parseEther('100.00'),
                    expiry: 70000,
                    digest: utils.sha256('0xdeadbeaf'),
                    returnOwner: utils.emptyAddress,
                }),
                specialOutput,
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
                tx.OutputTransfer({
                    token: '0x01',
                    owner: '0x02',
                    amount: utils.parseEther('100.00'),
                }),
                tx.OutputTransfer({
                    token: '0x01',
                    owner: producer,
                    amount: utils.parseEther('400.00'),
                }),
            ];

            // Build the transaction in question.
            let transactionMain = await tx.Transaction({
                override: true,
                chainId: 0,
                witnesses: opts.witnesses || [
                    userAWallet,
                ],
                metadata: opts.metadata || [
                    tx.MetadataDeposit({
                        blockNumber: userADepositEther.properties.blockNumber().get(),
                        token: userADepositEther.properties.token().get(),
                    }),
                    tx.MetadataDeposit({
                        blockNumber: userADepositToken.properties.blockNumber().get(),
                        token: userADepositToken.properties.token().get(),
                    }),
                ],
                data: opts.data || [
                    userADepositEther.keccak256(),
                    userADepositToken.keccak256(),
                ],
                inputs: opts.inputs || [
                    tx.InputDeposit({
                        owner: userADepositEther.properties.owner().get(),
                    }),
                    tx.InputDeposit({
                        owner: userADepositToken.properties.owner().get(),
                    }),
                ],
                signatureFeeToken: feeToken,
                signatureFee: fee,
                signatureFeeOutputIndex: noFee ? null : 0,
                outputs: mainOutputs,
                contract,
            });

            // Fill transactions.
            const fill = [];
            for (var i = 0; i < transactionIndex; i++) {
                fill.push(await makeSimpleTx());
            }

            function rand(base = 0) {
                return Math.floor(Math.random() * 10) + base;
            }

            // Root index fill 1 = 10.
            const mainRootIndex = noExtraRoots
                ? 0 : rand();

            // Produce a fill root.
            async function fillRoot() {
                const fill = [];
                for (var i = 0; i < rand(1); i++) {
                    fill.push(await makeSimpleTx());
                }

                // Produce a seperate root with this transaction.
                const filltxs = [...fill];
                const fillroot = (new RootHeader({
                    rootProducer: producer,
                    merkleTreeRoot: merkleTreeRoot(filltxs),
                    commitmentHash: utils.keccak256(combine(filltxs)),
                    rootLength: utils.hexDataLength(combine(filltxs)),
                    feeToken: feeToken,
                    fee: fee,
                }));
                await t.wait(contract.commitRoot(
                    fillroot.properties.merkleTreeRoot().get(),
                    feeToken,
                    fee,
                    combine(filltxs),
                    overrides),
                    'valid submit', Fuel.errors);

                return fillroot;
            }

            // Produce a seperate root with this transaction.
            const txsMain = opts.txs
                || [...fill, transactionMain];
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

            // Sync.
            await sync({
                ...settings,
                stopForOverflow: true,
            });

            // The fuel block tip.
            let blockTip = (await contract.blockTip()).add(1);

            // Root fill.
            const rootfill = [];
            for (var i = 0; i < mainRootIndex; i++) {
                rootfill.push(await fillRoot());
            }

            // Block roots.
            const roots = [
                ...rootfill,
                rootMain,
            ];

            // Produce a block header with this transaction.
            const headerMain = (new BlockHeader({
                producer,
                height: blockTip,
                numTokens,
                numAddresses: numAddresses,
                roots: roots.map(v => v.keccak256Packed()),
            }));

            // Produce a block with this transaction.
            const currentBlock = await t.provider.getBlockNumber();
            const currentBlockHash = (await t.provider.getBlock(currentBlock)).hash;
            
            // Commit transaction encoded data.
            const commitTx = contract.interface.functions.commitBlock.encode([
                currentBlock,
                currentBlockHash,
                blockTip,
                roots.map(v => v.keccak256Packed()),
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

            // Sync up to the blockTip.
            let blockHeight = null;
            while(blockHeight != blockTip.toNumber()) {
                // Sync.
                await sync({
                    ...settings,
                    stopForOverflow: true,
                });
                const _postState = protocol.state.State(await settings.db.get([
                    interface.db.state,
                ]));
                blockHeight = _postState.properties
                    .blockHeight().get().toNumber();
                await utils.wait(100);
            }

            // Get the post-state before the block in question is processed.
            const postState = protocol.state.State(await settings.db.get([
                interface.db.state,
            ]));

            // Check block height after block processing in client.
            t.equalBig(postState.properties.blockHeight().get(), 
                blockTip, "post block height");

            const outputIndex = 3;

            // Select the otput in question.
            // let output = outputs[outputIndex];

            // Is HTLC.
            const isHTLC = specialOutput.properties.type()
                .get().eq(tx.OutputTypes.HTLC);

            // Decode the amount form the output.
            const amount = tx.decodeAmount(specialOutput);

            // UTXO Proof.
            let utxo = tx.UTXO({
                transactionHashId: transactionMain.transactionHashId(),
                outputIndex,
                outputType: specialOutput.properties.type()
                    .get().toNumber(),
                amount,
                token: specialOutput.properties.token().get(),
                owner: resolveOwner(specialOutput.properties.owner().get()),
                digest: isHTLC
                    ? specialOutput.properties.digest().get()
                    : utils.hexZeroPad('0x00', 32),
                expiry: isHTLC
                    ? specialOutput.properties.expiry().get()
                    : 0,
                returnOwner: isHTLC 
                    ? resolveOwner(specialOutput.properties.returnOwner().get())
                    : utils.emptyAddress,
            });

            return {
                txs: txsMain,
                block: headerMain,
                root: rootMain,
                rootIndex: mainRootIndex,
                transactionIndex,
                outputIndex,
                utxo,
                data: utxo.keccak256(),
                token: 1,
                amount,
                metadata: protocol.metadata.Metadata({
                    blockHeight: headerMain.properties.height().get(),
                    transactionIndex,
                    rootIndex: mainRootIndex,
                    outputIndex,
                }),
            };
        }

        const txa = await makeTx({
            transactionIndex: 0,
        });
        const txb = await makeTx({
            transactionIndex: 10,
            output: tx.OutputTransfer({
                token: '0x01',
                owner: producer,
                amount: utils.parseEther('100.00'),
            }),
        });
        const txc = await makeTx({
            transactionIndex: 3,
            output: tx.OutputTransfer({
                token: '0x01',
                owner: proxy.address,
                amount: utils.parseEther('100.00'),
            }),
        });
        const txd = await makeTx({
            transactionIndex: 20,
            output: tx.OutputHTLC({
                token: '0x01',
                owner: '0x02',
                amount: utils.parseEther('100.00'),
                expiry: 70000,
                digest: utils.sha256(
                    utils.hexZeroPad('0xdeadbeaf', 32),
                ),
                returnOwner: utils.emptyAddress,
            }),
        });
        const txe = await makeTx({
            transactionIndex: 25,
            output: tx.OutputTransfer({
                token: '0x01',
                owner: producer,
                amount: utils.parseEther('100.00'),
            }),
        });

        // Set fee stipulations.
        let feeToken = 1;
        let fee = opts.signatureFee
            || utils.parseEther('.000012');
        let noFee = utils.bigNumberify(fee).lte(0);

        /// @notice This will produce the main tx, and either revert for fraud
        /// .. or pass through for success.
        async function produceMainTx(txOpts = {}) {
            // Build the transaction in question.
            let transactionMain = await tx.Transaction({
                override: true,
                chainId: 0,
                witnesses: [
                    userAWallet,
                    coldWallet,
                    { _caller: true },
                    { _producer: true },
                    { _caller: true },
                ],
                metadata: [
                    txa.metadata,
                    txb.metadata,
                    txc.metadata,
                    txd.metadata,
                    txe.metadata,
                ],
                data: [
                    txa.data,
                    txb.data,
                    txc.data,
                    txd.data,
                    txe.data,
                ],
                inputs: [
                    tx.InputTransfer(),
                    tx.InputTransfer({
                        witnessReference: 2,
                    }),
                    tx.InputTransfer({
                        witnessReference: 3,
                    }),
                    tx.InputHTLC({
                        witnessReference: 1,
                        preImage: utils.hexZeroPad('0xdeadbeaf', 32),
                    }),
                    tx.InputTransfer({
                        witnessReference: 4,
                    }),
                ],
                signatureFeeToken: feeToken,
                signatureFee: fee,
                signatureFeeOutputIndex: noFee ? null : 0,
                outputs: txOpts.outputs || [
                    tx.OutputTransfer({
                        noshift: true,
                        token: '0x01',
                        owner: producer,
                        amount: utils.parseEther('100.00'),
                    }),
                    tx.OutputReturn({
                        data: '0xaa',
                    }),
                    tx.OutputTransfer({
                        token: '0x01',
                        owner: producer,
                        amount: utils.parseEther('0'),
                    }),
                    tx.OutputWithdraw({
                        token: '0x01',
                        owner: producer,
                        amount: utils.parseEther('300.00'),
                    }),
                    tx.OutputTransfer({
                        token: '0x01',
                        owner: producer,
                        amount: utils.parseEther('100.00'),
                    }),
                ],
                contract,
            });

            function rand(base = 0) {
                return Math.floor(Math.random() * 10) + base;
            }

            // Produce a fill root.
            async function fillRoot() {
                const fill = [];
                for (var i = 0; i < rand(1); i++) {
                    fill.push(await makeSimpleTx());
                }

                // Produce a seperate root with this transaction.
                const filltxs = fill; // [await makeSimpleTx()];
                const fillroot = (new RootHeader({
                    rootProducer: producer,
                    merkleTreeRoot: merkleTreeRoot(filltxs),
                    commitmentHash: utils.keccak256(combine(filltxs)),
                    rootLength: utils.hexDataLength(combine(filltxs)),
                    feeToken: feeToken,
                    fee: fee,
                }));
                await t.wait(contract.commitRoot(
                    fillroot.properties.merkleTreeRoot().get(),
                    feeToken,
                    fee,
                    combine(filltxs),
                    overrides),
                    'valid submit', Fuel.errors);

                return fillroot;
            }

            // Produce a seperate root with this transaction.
            const txsMain = [transactionMain];
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
            let blockTip = (await contract.blockTip()).add(1);

            const mainRoots = [
                rootMain,
                await fillRoot(),
                await fillRoot(),
            ];

            // Produce a block header with this transaction.
            const headerMain = (new BlockHeader({
                producer,
                height: blockTip,
                numTokens,
                numAddresses: numAddresses,
                roots: mainRoots.map(v => v.keccak256Packed()),
            }));

            // Specify the main root index.
            const mainRootIndex = 0;

            // Produce a block with this transaction.
            const currentBlock = await t.provider.getBlockNumber();
            const currentBlockHash = (await t.provider.getBlock(currentBlock)).hash;
            
            // Commit transaction encoded data.
            const commitTx = contract.interface.functions.commitBlock.encode([
                currentBlock,
                currentBlockHash,
                blockTip,
                mainRoots.map(v => v.keccak256Packed()),
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

            let blockHeight = null;
            while(blockHeight != blockTip.toNumber()) {
                // Sync.
                await sync({
                    ...settings,
                    stopForOverflow: true,
                });
                const _postState = protocol.state.State(await settings.db.get([
                    interface.db.state,
                ]));
                blockHeight = _postState.properties
                    .blockHeight().get().toNumber();
                await utils.wait(10);
            }

            // Get the post-state before the block in question is processed.
            const postState = protocol.state.State(await settings.db.get([
                interface.db.state,
            ]));

            // Check block height after block processing in client.
            t.equalBig(postState.properties.blockHeight().get(), 
                blockTip, "post block height");
        }

        await produceMainTx();
    }

    await state();
});