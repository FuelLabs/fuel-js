const { test, utils, overrides } = require('@fuel-js/environment');
const { ERC20, OwnedProxy, Fuel } = require('@fuel-js/contracts');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol');
const struct = require('@fuel-js/struct');
const Api = require('@fuel-js/api');
const fuel = require('@fuel-js/wallet');
const ethers = require('ethers');

module.exports = test('fraud', async t => {
    const network = 'unspecified';
    const path = 'http://localhost:3000';
    const jsonProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

    // Setup Addresses
    const producer = t.wallets[0].connect(jsonProvider);
    const cold = t.wallets[1].connect(jsonProvider);
    const userA = t.wallets[2].connect(jsonProvider);
    const userB = t.wallets[3].connect(jsonProvider);

    // Special API key.
    const apiKey = utils.hexDataSlice(
        utils.keccak256('0xbebebe'),
        12,
        32,
    );

    const api = new Api('unspecified', {
        url: 'http://localhost:3000',
    });

    let walletB = new fuel.Wallet(jsonProvider, {
        privateKey: utils.hexlify(utils.randomBytes(32)),
        network,
        path,
    });

    let walletC = new fuel.Wallet(jsonProvider, {
        privateKey: utils.hexlify(utils.randomBytes(32)),
        network,
        path,
    });

    let walletD = new fuel.Wallet(jsonProvider, {
        privateKey: utils.hexlify(utils.randomBytes(32)),
        network,
        path,
    });

    // Sync and load this wallet.
    await walletB.sync();

    // User A is the attack account on this contract.
    let contract = walletB.contract;
    contract = contract.connect(userA);

    // Commit wallet C.
    let commitAddrTx = await contract.commitAddress(
        walletC.address,
        t.getOverrides(),
    );

    // Commit addr.
    commitAddrTx = await commitAddrTx.wait();

    // Wallet c ID.
    const walletCId = commitAddrTx.events[0].args.id;

    // Invalid root.
    async function invalidRoot(opts = {}) {
        console.log('testing invalid root');

        // Setup the root.
        const inputTxs = opts.inputTxs || [protocol.root.Leaf({
            data: utils.hexlify(utils.randomBytes(100)),
        })];
        const inputRootToken = 0;
        const inputRootFee = utils.parseEther('0.000003');
        const inputRoot = new protocol.root.RootHeader({
            rootProducer: userA.address,
            merkleTreeRoot: protocol.root.merkleTreeRoot(inputTxs, opts.merkleEncode),
            commitmentHash: utils.keccak256(struct.combine(inputTxs)),
            rootLength: utils.hexDataLength(struct.combine(inputTxs)),
            fee: inputRootFee,
            feeToken: inputRootToken,
            ...(opts.root || {}),
        });

        // Commit this root and wait on it.
        let tx = await t.wait(contract.commitRoot(
            inputRoot.properties.merkleTreeRoot().get(),
            inputRootToken,
            inputRootFee,
            struct.combine(inputTxs),
            overrides),
            'valid submit', Fuel.errors);

        let producedRoot = new protocol.root.RootHeader({
            ...tx.events[0].args,
        });

        // The current state of Fuel.
        let state = await api.getState();

        // Commitment block number.
        const commitmentBlockNumber = tx.blockNumber;

        // Finalization delay.x
        const submissionDelay = await contract.SUBMISSION_DELAY();

        // Waiting
        console.log(`waiting for submission delay ${
            submissionDelay.add(commitmentBlockNumber).toNumber()
        }`);

        // Wait for the correct amount of commitment blocks.
        while (state.properties.blockNumber().get()
            .lte(submissionDelay.add(commitmentBlockNumber))) {

            // Wait 2 seconds.
            await utils.wait(2000);

            // Get state.
            state = await api.getState();
        }

        // Commitment attemt;
        let commitmentAttempt = true;

        // Start a commitment attempt, keep trying until we get one in.
        while(commitmentAttempt) {
            // Get state.
            state = await api.getState();

            // The fuel block tip.
            let height = state.properties.blockHeight().get().add(1);

            // Number of tokens.
            let numTokens = state.properties.numTokens().get();

            // Number of tokens.
            let numAddresses = state.properties.numAddresses().get();

            // Root exists.
            const exists = await contract.rootBlockNumberAt(
                producedRoot.keccak256Packed(),
            );

            t.ok(exists.gt(0), 'root exists');

            // The roots.
            const roots = [
                producedRoot.keccak256Packed(),
            ];

            // Produce a block with this transaction.
            const currentBlock = await jsonProvider.getBlockNumber();
            const currentBlockHash = (await jsonProvider.getBlock(currentBlock)).hash;

            // Produce a block header with this transaction.
            /*
            const block = (new protocol.block.BlockHeader({
                producer: userA.address,
                height,
                numTokens,
                numAddresses,
                roots,
                blockNumber: currentBlock,
            }));
            */

            // Commit block.
            try {
                tx = await contract.commitBlock(
                    currentBlock,
                    currentBlockHash,
                    height,
                    roots,
                    {
                        gasLimit: 4000000,
                        value: await contract.BOND_SIZE(),
                    },
                );

                // Wait for block commitment.
                tx = await tx.wait();

                // Fraud committed. 
                console.log(`Fraud committed at block number: ${currentBlock}`);

                // Get block commitment event.
                const blockEventHeight = tx.events[0].args.height;

                // Fraud block committed.
                t.equalBig(height, blockEventHeight, 'fraud block committed');

                // Stop the while loop.
                commitmentAttempt = false;

                // 3 Blocks after the block commitment.
                const bufferBlocks = 30;

                // Wait for the correct amount of commitment blocks.
                while (state.properties.blockNumber().get()
                    .lte(currentBlock + bufferBlocks)) {
                    // Get state.
                    state = await api.getState();

                    // Wait 2 seconds.
                    await utils.wait(2000);
                }

                // Get logs.
                const logsDetected = await jsonProvider.getLogs({
                    address: contract.address,
                    fromBlock: currentBlock,
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
                    if (opts.fraud
                        && decoded.name === 'FraudCommitted'
                        && log.blockNumber > currentBlock) {
                        // Set fraud log to true.
                        fraudLogDetected = true;

                        // Fraud code check.
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

                return;
            } catch (error) {
                // Wait 2 seconds.
                await utils.wait(2000);
            }
        }
    }

    // Wait for a valid tx to be mined.
    // Than produce a very complex tx.
    // Inputs: 1 root, 1 deposit, 1 transfer, 1 htlc
    // Outputs: 1 withdraw, 1 transfer, 1 htlc, 1 return
    // Multi-token.
    // Multi-input / output.
    // Multi-witness.
    // Registered Addresses.
    async function complex(opts = {}) {
        walletB = new fuel.Wallet(jsonProvider, {
            privateKey: utils.hexlify(utils.randomBytes(32)),
            network,
            path,
        });

        walletC = new fuel.Wallet(jsonProvider, {
            privateKey: utils.hexlify(utils.randomBytes(32)),
            network,
            path,
        });

        walletD = new fuel.Wallet(jsonProvider, {
            privateKey: utils.hexlify(utils.randomBytes(32)),
            network,
            path,
        });

        // Faucet some funds.
        await walletB.faucet();

        // These are inputs that will be spent later. Used for double spend checks.
        let spendInputs = await walletB._inputs(1);

        // Transfer to wallet.
        await walletB.transfer(1, walletC.address, utils.parseEther('500'));

        // Make an ether deposit also.
        const etherDepositAmount = utils.parseEther('12.2');
        const etherDepositValue = utils.parseEther('12');
        await t.wait(userA.sendTransaction({
            ...t.getOverrides(),
            value: etherDepositAmount,
            to: walletB.address,
        }), 'ether to account');

        // Make an ether Deposit.
        await walletB.deposit(utils.emptyAddress, etherDepositValue);

        // HTLC.
        let htlcPreImage = utils.keccak256('0xbebebe');

        // Transfer to wallet using HTLC.
        await walletB.transfer(1,
            walletC.address,
            utils.parseEther('10'),
            {
                htlc: true,
                preImage: htlcPreImage,
                expiry: 500000,
                returnOwner: walletB.address,
            },
        );

        // Mined.
        let mined = false;
        let walletInputs = {};
        let walletInputs2 = {};
        let otherWalletInputs = {};

        // While not mined.
        while(!mined) {
            // Sync wallet
            await walletB.sync();
            await walletC.sync();

            // Wallet inputs
            walletInputs2 = await walletB._inputs(0);
            walletInputs = await walletB._inputs(1);
            otherWalletInputs = await walletC._inputs(1, {
                preimages: [htlcPreImage],
            });

            // Is the inputs mined.
            let isMined = true;

            // Metadata.
            for (const metadata of walletInputs.metadata
                .concat(otherWalletInputs.metadata)
                .concat(walletInputs2.metadata)) {
                // Check if inputs are mined.
                if (metadata.properties.blockHeight) {
                    if (metadata.properties.blockHeight().get().lte(0)) {
                        isMined = false;
                    }
                }
            }

            // Check if all inputs are mined.
            if (isMined) {
                mined = true;
                break;
            }

            // Wait if not mined.
            await utils.wait(2000);
        }

        t.ok(1, 'txs mined');

        // Let's also add the block producer root in there.
        // const root = protocol.root.RootHeader({});
        const signatureFeeToken = 0;
        const signatureFee = 0;

        // If double spend, change UTXO inputs.
        if (opts.fraud === 'double-spend') {
            // Change the walletB inputs to ones already spent.
            walletInputs = walletInputs2;
        }

        // metadata-height-underflow

        // Deposit owner.
        let depositOwner = walletB.address;

        // If deposit is not corrent.
        if (opts.fraud === 'input-deposit-value-underflow') {
            depositOwner = walletC.address;
        }

        // This is the metadata for the second input.
        let secondInputMetadata = walletInputs.metadata[0];

        // If index overflow.
        if (opts.fraud === 'input-transaction-index-overflow') {
            secondInputMetadata.properties
                .transactionIndex().set(200);
        }

        // Now let's build a complex tx.
        let txs = [
            await protocol.transaction.Transaction({
                override: true,
                chainId: 0,
                witnesses: opts.witnesses || [
                    new ethers.Wallet(walletB.key),
                    new ethers.Wallet(
                        // Switch witnesses for utxo witness invalidity.
                        opts.fraud === 'utxo-witness'
                            ? walletB.key
                            : walletC.key), // C
                ],
                metadata: opts.metadata || [
                    walletInputs2.metadata[0], // B Deposit
                    secondInputMetadata, // B
                    otherWalletInputs.metadata[0], // C
                    otherWalletInputs.metadata[1], // C
                ],
                data: opts.data || [
                    walletInputs2.data[0], // B Deposit
                    walletInputs.data[0], // B
                    otherWalletInputs.data[0], // C
                    otherWalletInputs.data[1], // C
                ],
                inputs: opts.inputs || [
                    protocol.inputs.InputDeposit({
                        owner: depositOwner, // B
                    }),
                    // Attempt to double spend deposit. 
                    (opts.fraud === 'double-spend'
                        ? protocol.inputs.InputDeposit({
                            owner: depositOwner, // B
                        })
                        : protocol.inputs.InputTransfer({ // B
                        })),
                    protocol.inputs.InputTransfer({
                        witnessReference: 1, // C
                    }),
                    protocol.inputs.InputHTLC({
                        witnessReference: 1, // C
                        preImage: htlcPreImage, // C
                    }),
                ],
                signatureFeeToken,
                signatureFee,
                signatureFeeOutputIndex: (opts.outputs || []).length ? 0 : null,
                outputs: opts.outputs || [
                    protocol.outputs.OutputTransfer({
                        noshift: true,
                        token: '0x00',
                        owner: walletD.address,
                        amount: walletInputs2.proofs[0]
                            .properties.value().get(),
                    }),
                    protocol.outputs.OutputTransfer({
                        noshift: true,
                        token: '0x01',
                        owner: walletD.address,
                        amount: 
                        // Switch around for double spend.
                        (opts.fraud === 'double-spend'
                            ? walletInputs.proofs[0]
                            .properties.value().get()
                            : walletInputs.proofs[0]
                            .properties.amount().get()),
                    }),
                    protocol.outputs.OutputTransfer({
                        token: '0x01',
                        owner: walletD.address,
                        amount: otherWalletInputs.proofs[0]
                            .properties.amount().get(), // C
                    }),
                    protocol.outputs.OutputHTLC({
                        token: '0x01',
                        owner: walletD.address,
                        amount: otherWalletInputs.proofs[1]
                            .properties.amount().get(), // C
                        expiry: 500000,
                        digest: utils.keccak256(htlcPreImage),
                        returnOwner: walletD.address,
                    }),
                    protocol.outputs.OutputReturn({
                        data: '0xaa',
                    }),
                ],
                contract,
            }),
        ];

        t.ok(txs, 'transactions available');
    
        // Commit this root and wait on it.
        let tx = await t.wait(contract.commitRoot(
            protocol.root.merkleTreeRoot(txs, true),
            signatureFeeToken,
            signatureFee,
            struct.combine(txs),
            t.getOverrides()),
            'valid submit',
            Fuel.errors);

        // Initial walletD sync.
        await walletD.sync();

        // Get intiial balances.
        let walletDBalanceEther = await walletD.balance(0);
        let walletDBalanceToken = await walletD.balance(1);

        // If the tx is meant to be valid, look for the results.
        if (opts.valid) {
            // Check ether balance.
            while (walletDBalanceEther.lte(0)) {
                // Sync.
                await walletD.sync();
        
                // Get balance.
                walletDBalanceEther = await walletD.balance(0);
                walletDBalanceToken = await walletD.balance(1);

                // Wait 2 seconds.
                await utils.wait(2000);
            }

            t.ok(1, 'valid check passed balances correct');

            // top process here.
            return;
        }

        // If the tx is not valid.
        let producedRoot = new protocol.root.RootHeader({
            ...tx.events[0].args,
        });

        // The current state of Fuel.
        let state = await api.getState();

        // Commitment block number.
        const commitmentBlockNumber = tx.blockNumber;

        // Finalization delay.x
        const submissionDelay = await contract.SUBMISSION_DELAY();

        // Waiting
        console.log(`waiting for submission delay ${
            submissionDelay.add(commitmentBlockNumber).toNumber()
        }`);

        // Wait for the correct amount of commitment blocks.
        while (state.properties.blockNumber().get()
            .lte(submissionDelay.add(commitmentBlockNumber))) {

            // Wait 2 seconds.
            await utils.wait(2000);

            // Get state.
            state = await api.getState();
        }

        // Commitment attemt;
        let commitmentAttempt = true;

        t.ok(1, 'starting fraud comitment attempt.');

        // Start a commitment attempt, keep trying until we get one in.
        while(commitmentAttempt) {
            // Get state.
            state = await api.getState();

            // The fuel block tip.
            let height = state.properties.blockHeight().get().add(1);

            // Number of tokens.
            let numTokens = state.properties.numTokens().get();

            // Number of tokens.
            let numAddresses = state.properties.numAddresses().get();

            // Root exists.
            const exists = await contract.rootBlockNumberAt(
                producedRoot.keccak256Packed(),
            );

            t.ok(exists.gt(0), 'root exists');

            // The roots.
            const roots = [
                producedRoot.keccak256Packed(),
            ];

            // Produce a block with this transaction.
            const currentBlock = await jsonProvider.getBlockNumber();
            const currentBlockHash = (await jsonProvider.getBlock(currentBlock)).hash;

            // Produce a block header with this transaction.
            /*
            const block = (new protocol.block.BlockHeader({
                producer: userA.address,
                height,
                numTokens,
                numAddresses,
                roots,
                blockNumber: currentBlock,
            }));
            */

            // Commit block.
            try {
                tx = await contract.commitBlock(
                    currentBlock,
                    currentBlockHash,
                    height,
                    roots,
                    {
                        gasLimit: 4000000,
                        value: await contract.BOND_SIZE(),
                    },
                );

                // Wait for block commitment.
                tx = await tx.wait();

                // Fraud committed. 
                console.log(`Fraud committed at block number: ${currentBlock}`);

                // Get block commitment event.
                const blockEventHeight = tx.events[0].args.height;

                // Fraud block committed.
                t.equalBig(height, blockEventHeight, 'fraud block committed');

                // Stop the while loop.
                commitmentAttempt = false;

                // 3 Blocks after the block commitment.
                const bufferBlocks = 30;

                // Wait for the correct amount of commitment blocks.
                while (state.properties.blockNumber().get()
                    .lte(currentBlock + bufferBlocks)) {
                    // Get state.
                    state = await api.getState();

                    // Wait 2 seconds.
                    await utils.wait(2000);
                }

                // Get logs.
                const logsDetected = await jsonProvider.getLogs({
                    address: contract.address,
                    fromBlock: currentBlock,
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
                    if (opts.fraud
                        && decoded.name === 'FraudCommitted'
                        && log.blockNumber > currentBlock) {
                        // Set fraud log to true.
                        fraudLogDetected = true;

                        // Fraud code check.
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

                return;
            } catch (error) {
                // Wait 2 seconds.
                await utils.wait(2000);
            }
        }
    }

    try {
        // Check valid case.
        await complex({
            valid: true,
        });

        // Test complex valid tx.
        await complex({
            fraud: 'witnesses-size-underflow',
            witnesses: [], // no witnesses
        });

        // We stop this here, as it can take up to an hour to do all fraud cases.
        return;

        // Check invalid utxo witness.
        await complex({
            valid: false,
            fraud: 'utxo-witness',
        });

        // Check invalid witness.
        await complex({
            valid: false,
            fraud: 'deposit-witness',
            data: [
                utils.keccak256('0xaa'), // Invalid data.
                utils.keccak256('0xaa'),
                utils.keccak256('0xaa'),
            ],
        });

        // Check invalid deposit.
        await complex({
            valid: false,
            fraud: 'deposit-witness',
            witnesses: [
                // These are both new wallets.
                new ethers.Wallet(walletC.key), // Invalid Witnesses
                new ethers.Wallet(walletC.key), // Invalid Witnesses
            ], // no witnesses
        });

        // Check inputs size.
        await complex({
            valid: false,
            fraud: 'inputs-size-underflow',
            inputs: [], // no inputs
        });

        // Check outputs size.
        await complex({
            valid: false,
            fraud: 'outputs-size-underflow',
            outputs: [], // no inputs
        });

        // Check invalid metadata size.
        await complex({
            valid: false,
            fraud: 'metadata-size-underflow',
            metadata: [], // no inputs
        });

        // Check invalid summing.
        await complex({
            valid: false,
            fraud: 'sum',
            outputs: [
                protocol.outputs.OutputTransfer({
                    noshift: true,
                    token: '0x00',
                    owner: walletD.address,
                    // This is the bad value.
                    amount: utils.parseEther('1.0'),
                }),
            ], // no inputs
        });

        // Check double spend case.
        await complex({
            valid: false,
            fraud: 'double-spend',
        });

        // Check deposit.
        await complex({
            valid: false,
            fraud: 'input-deposit-value-underflow',
        });

        // Check overflowed index.
        await complex({
            valid: false,
            fraud: 'input-transaction-index-overflow',
        });

        // Test malformedBlockProof
        await invalidRoot({
            fraud: 'merkle-root',
            root: {
                merkleTreeRoot: utils.hexlify(utils.randomBytes(32)),
            },
        });

        // Produce a fake leaf structure.
        const FakeLeaf = struct.struct(`
            uint16 length,
            bytes data
        `);

        // Test Invalid Tx
        await invalidRoot({
            fraud: 'net-length-overflow',
            inputTxs: [
                FakeLeaf({
                    length: '0xaa',
                    data: utils.hexlify(utils.randomBytes(100)),
                }),
            ],
        });

    } catch (error) {
        console.log(error);
        t.ok(0, error.message);
    }
});