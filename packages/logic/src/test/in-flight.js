// this will test in-flight fraud detection and handling
// and reset from multiple fraud blocks
// and proper production post fraud

const { test, utils, overrides } = require('@fuel-js/environment');
const { ERC20, OwnedProxy, Fuel } = require('@fuel-js/contracts');
const tx = require('@fuel-js/protocol/src/transaction');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol');
const struct = require('@fuel-js/struct');
const config = require('./config.local');
const sync = require('../sync');
const transact = require('../transact');
const outputFromMetadata = require('./outputFromMetadata');

module.exports = test('in-flight', async t => {
  // Setup Addresses
  const producer = t.wallets[0].address;
  const cold = t.wallets[1].address;
  const coldWallet = t.wallets[1];
  const userA = t.wallets[2].address;
  const userAWallet = t.wallets[2];
  const userB = t.wallets[3].address;
  const userBWallet = t.wallets[3];

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
          "1.0.0",
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
          console: console,
          contract,
          continue: () => false,
          increaseBlock: t.increaseBlock,
          proxy,
          produce: false,
          feeEnforcement: true,
          stopForOverflow: true, // for testing.
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

      // This will set the fee in the db.
      async function setFee(token = 0, fee = 0) {
        return await settings.db.put([
          interface.db.fee,
          token,
        ], fee);
      }

      // This will get the fee.
      async function getFee(token = 0) {
        return utils.bigNumberify(
          await settings.db.get([
            interface.db.fee,
            token,
          ]),
        );
      }

      // Make a tx.
      async function makeTx(txOpts = {}) {
        // Trander for User A Deposit Funnel.
        await t.wait(erc20.transfer(userAFunnel, userAAmount, overrides), 'erc20 transfer');
        await t.wait(t.wallets[0].sendTransaction({
            ...overrides,
            value: userAAmount,
            to: userAFunnel,
        }), 'ether to funnel');

        // User A Deposit Ether.
        const userADepositEther = new protocol.deposit.Deposit({
            token: 0,
            owner: userA,
            blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
            value: userAAmount,
        });
        await t.wait(contract.deposit(userA, utils.emptyAddress, overrides),
            'ether deposit', Fuel.errors);

        // User A Deposit Token.
        const userADepositToken = new protocol.deposit.Deposit({
            token: 1,
            owner: userA,
            blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
            value: userAAmount,
        });
        await t.wait(contract.deposit(userA, erc20.address, overrides),
            'ether deposit', Fuel.errors);

        // Fee token.
        const signatureFeeToken = txOpts.feeToken || 0;

        // This is the additional stuff if an input tx is used.
        let additionalInput = {
          witnesses: [],
          data: [],
          inputs: [],
          outputs: [],
        };

        // If an input tx is around.
        if (txOpts.inputTx) {
          additionalInput.data = [
            txOpts.inputTx.outputs[0].keccak256(),
          ];
          additionalInput.inputs = [
            tx.InputTransfer({}),
          ];
          additionalInput.outputs = [
            tx.OutputTransfer({
              noshift: true,
              token: '0x00',
              owner: userA,
              amount: utils.parseEther('500.00'),
            }),
          ];
        }

        let tx0 = await tx.Transaction({
            override: true,
            chainId: 0,
            witnesses: [
                userAWallet,
                ...additionalInput.witnesses,
            ],
            metadata: [],
            data: [
              userADepositEther.keccak256(),
              userADepositToken.keccak256(),
              ...additionalInput.data,
            ],
            inputs: [
                tx.InputDeposit({
                    owner: userADepositEther.properties
                      .owner().get(),
                }),
                tx.InputDeposit({
                    owner: userADepositToken.properties
                      .owner().get(),
                }),
                ...additionalInput.inputs,
            ],
            signatureFeeToken,
            signatureFee: await getFee(signatureFeeToken),
            signatureFeeOutputIndex: 
              signatureFeeToken ? 1 : 0,
            outputs: [
              tx.OutputTransfer({
                noshift: true,
                token: '0x00',
                owner: userA,
                amount: utils.parseEther('500.00'),
              }),
              tx.OutputTransfer({
                noshift: true,
                token: '0x01',
                owner: userA,
                amount: utils.parseEther('500.00'),
              }),
              tx.OutputTransfer({
                token: '0x00',
                owner: userA,
                amount: utils.parseEther('500.00'),
              }),
              tx.OutputTransfer({
                token: '0x01',
                owner: userA,
                amount: utils.parseEther('500.00'),
              }),
              tx.OutputReturn({
                data: txOpts.data,
              }),
              ...additionalInput.outputs,
            ],
            contract,
        });

        // Sync with deposits.
        for (var i = 0; i < 6; i++) {
          await sync(settings);
        }

        // Add the transaction to the mempool.
        await transact(
          tx0.unsigned().encodeRLP(),
          struct.chunkJoin(
            tx0.properties.witnesses().get(),
          ),
          0,
          settings,
        );

        return {
          transaction: tx0,
          outputs: [
            protocol.outputs.UTXO({
              transactionHashId: tx0.transactionHashId(),
              outputIndex: 2,
              outputType: 0,
              amount: utils.parseEther('500.00'),
              token: 0,
              owner: userA,
            }),
            protocol.outputs.UTXO({
              transactionHashId: tx0.transactionHashId(),
              outputIndex: 3,
              outputType: 0,
              amount: utils.parseEther('500.00'),
              token: 1,
              owner: userA,
            }),
            protocol.outputs.UTXO({
              transactionHashId: tx0.transactionHashId(),
              outputIndex: 1,
              outputType: 0,
              amount: utils.parseEther('500.00'),
              token: 1,
              owner: userA,
            }),
          ],
        };
      }

      // Set the ether and token Fees.
      await setFee(0, utils.parseEther('0.00000012'));
      await setFee(1, utils.parseEther('0.00001'));

      // Make a set of dependant tx's with different fees.
      const txa = await makeTx({
        inputTx: null,
        feeToken: 0,
        data: '0xaa',
      });

      const txb = await makeTx({
        inputTx: null,
        feeToken: 0,
        data: '0xbb',
      });

      // Get the pre-state before the block in question is processed.
      let postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          0, "post block height 0");
    
      await t.increaseBlock(5);

      // Now produce this block.
      for (var i = 0; i < 10; i++) {
        await sync({
          ...settings,
          produce: true,
        });
      }

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      await t.increaseBlock(20);

      // Now produce this block.
      for (var i = 0; i < 10; i++) {
        await sync({
          ...settings,
          produce: true,
        });
      }

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          1, "post block height 1");

      // Increase block for production purposes.
      await t.increaseBlock(20);

      // Now produce this block.
      for (var i = 0; i < 10; i++) {
        await sync({
          ...settings,
          produce: true,
        });
      }

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          1, "post block height 1");

        const txc = await makeTx({
            inputTx: null,
            feeToken: 0,
            data: '0xcc',
        });

        const txd = await makeTx({
            inputTx: null,
            feeToken: 1,
            data: '0xdd',
        });

        const txe = await makeTx({
            inputTx: null,
            feeToken: 0,
            data: '0xee',
        });

        const txf = await makeTx({
            inputTx: null,
            feeToken: 1,
            data: '0xff',
        });

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          1, "post block height 1");

      // Increase block for production purposes.
      await t.increaseBlock(5);

      // Now produce this block.
      // BUILD THE ROOTS.
      for (var i = 0; i < 10; i++) {
        await sync({
          ...settings,
          produce: true,
        });
      }

      // Increase block for production purposes.
      await t.increaseBlock(20);

      // Now produce this block.
      // PRODUCE THE BLOCK #2.
      for (var i = 0; i < 10; i++) {
        await sync({
          ...settings,
          produce: true,
        });
      }

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          2, "post block height 2");

      async function produceInvalidBlock() {
        // Produce a seperate root with this transaction.
        const txsMain = [new protocol.root.Leaf({
                data: struct.chunk(utils.hexlify(utils.randomBytes(200))),
            }),
            new protocol.root.Leaf({
                data: struct.chunk(utils.hexlify(utils.randomBytes(10))),
            }),
        ];

        const feeToken = 0;
        const fee = 0;

        const rootMain = (new protocol.root.RootHeader({
            rootProducer: producer,
            merkleTreeRoot: protocol.root.merkleTreeRoot(txsMain),
            commitmentHash: utils.keccak256(struct.combine(txsMain)),
            rootLength: utils.hexDataLength(struct.combine(txsMain)),
            feeToken: feeToken,
            fee: fee,
        }));
        await t.wait(contract.commitRoot(
            rootMain.properties.merkleTreeRoot().get(),
            feeToken,
            fee,
            struct.combine(txsMain),
            overrides),
            'valid submit', Fuel.errors);

        // The fuel block tip.
        let blockTip = (await contract.blockTip()).add(1);

        // Produce a block header with this transaction.
        const headerMain = (new protocol.block.BlockHeader({
            producer,
            height: blockTip,
            numTokens,
            numAddresses: numAddresses,
            roots: [rootMain.keccak256Packed()],
        }));

        // Specify the main root index.
        const mainRootIndex = 0;

        // Produce a block with this transaction.
        let currentBlock = await t.provider.getBlockNumber();
        let currentBlockHash = (await t.provider.getBlock(currentBlock)).hash;

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
      }

      async function makeEtherDeposit(txOpts = {}) {
        // Make a Deposit for User A.
        const userAFunnel = await contract.funnel(txOpts.user);
        const userAAmount = utils.parseEther(txOpts.amount);

        // Trander for User A Deposit Funnel.
        await t.wait(
            erc20.transfer(userAFunnel, userAAmount, overrides),
            "erc20 transfer"
        );
        await t.wait(
            t.wallets[0].sendTransaction({
            ...overrides,
            value: userAAmount,
            to: userAFunnel,
            }),
            "ether to funnel"
        );

        // User A Deposit Ether.
        const userADepositEther = new protocol.deposit.Deposit({
            token: 0,
            owner: txOpts.user,
            blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
            value: userAAmount,
        });
        const tokenAddress = utils.emptyAddress;
        await t.wait(
            contract.deposit(txOpts.user, tokenAddress, overrides),
            "ether deposit",
            Fuel.errors
        );
    }

    async function makeDeposit(txOpts = {}) {
      // Trander for User A Deposit Funnel.
      await t.wait(
        erc20.transfer(userAFunnel, userAAmount, overrides),
        "erc20 transfer"
      );
      await t.wait(
        t.wallets[0].sendTransaction({
          ...overrides,
          value: userAAmount,
          to: userAFunnel,
        }),
        "ether to funnel"
      );

      // User A Deposit Ether.
      const userADepositEther = new protocol.deposit.Deposit({
        token: 0,
        owner: userA,
        blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
        value: userAAmount,
      });
      await t.wait(
        contract.deposit(userA, utils.emptyAddress, overrides),
        "ether deposit",
        Fuel.errors
      );

      // User A Deposit Token.
      const userADepositToken = new protocol.deposit.Deposit({
        token: 1,
        owner: userA,
        blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
        value: userAAmount,
      });
      await t.wait(
        contract.deposit(userA, erc20.address, overrides),
        "ether deposit",
        Fuel.errors
      );

      return {
        depositA: userADepositEther,
        depositB: userADepositToken,
      };
    }

    // Make a tx.
    async function makeTx2(txOpts = {}) {
      // Fee token.
      const signatureFeeToken = txOpts.feeToken || 0;

      // This is the additional stuff if an input tx is used.
      let additionalInput = {
        witnesses: [],
        data: [],
        inputs: [],
        outputs: [],
      };

      // If an input tx is around.
      if (txOpts.inputTx) {
        additionalInput.data = [txOpts.inputTx.outputs[0].keccak256()];
        additionalInput.inputs = [tx.InputTransfer({})];
        additionalInput.outputs = [
          tx.OutputTransfer({
            noshift: true,
            token: "0x00",
            owner: userA,
            amount: utils.parseEther("500.00"),
          }),
        ];
      }

      let tx0 = await tx.Transaction({
        override: true,
        chainId: 0,
        witnesses: [userAWallet, ...additionalInput.witnesses],
        metadata: [],
        data: [
          txOpts.depositA.keccak256(),
          txOpts.depositB.keccak256(),
          ...additionalInput.data,
        ],
        inputs: [
          tx.InputDeposit({
            owner: txOpts.depositA.properties.owner().get(),
          }),
          tx.InputDeposit({
            owner: txOpts.depositB.properties.owner().get(),
          }),
          ...additionalInput.inputs,
        ],
        signatureFeeToken,
        signatureFee: await getFee(signatureFeeToken),
        signatureFeeOutputIndex: signatureFeeToken ? 1 : 0,
        outputs: [
          tx.OutputTransfer({
            noshift: true,
            token: "0x00",
            owner: userA,
            amount: utils.parseEther("500.00"),
          }),
          tx.OutputTransfer({
            noshift: true,
            token: "0x01",
            owner: userA,
            amount: utils.parseEther("500.00"),
          }),
          tx.OutputTransfer({
            token: "0x00",
            owner: userB,
            amount: utils.parseEther("500.00"),
          }),
          tx.OutputTransfer({
            token: "0x01",
            owner: userA,
            amount: utils.parseEther("500.00"),
          }),
          tx.OutputReturn({
            data: txOpts.data,
          }),
          ...additionalInput.outputs,
        ],
        contract,
      });

      // Add the transaction to the mempool.
      await transact(
        tx0.unsigned().encodeRLP(),
        struct.chunkJoin(tx0.properties.witnesses().get()),
        0,
        settings
      );

      return {
        transaction: tx0,
        outputs: [
          protocol.outputs.UTXO({
            transactionHashId: tx0.transactionHashId(),
            outputIndex: 2,
            outputType: 0,
            amount: utils.parseEther("500.00"),
            token: 0,
            owner: userB,
          }),
          protocol.outputs.UTXO({
            transactionHashId: tx0.transactionHashId(),
            outputIndex: 3,
            outputType: 0,
            amount: utils.parseEther("500.00"),
            token: 1,
            owner: userA,
          }),
          protocol.outputs.UTXO({
            transactionHashId: tx0.transactionHashId(),
            outputIndex: 1,
            outputType: 0,
            amount: utils.parseEther("500.00"),
            token: 1,
            owner: userA,
          }),
        ],
      };
    }

    let deposits = [];
    for (var i = 0; i < 5; i++) {
        deposits.push(await makeDeposit({}));
    }

    // Sync the deposits.
    await sync({ ...settings, produce: false });

      await produceInvalidBlock();
      await produceInvalidBlock();

    // Make a bunch of mempool txs.
    for (const deposit of deposits) {
        await makeTx2({
            ...deposit,
            inputTx: null,
            feeToken: 0,
            data: "0xeeee",
        });
    }

      // do 2 internal sync cycles.
      let counter = {
          count: 0,
      };

      await sync({
        ...settings,
        continue: () => {
            counter.count += 1;

            if (counter.count < 10) {
                t.increaseBlock(1);
                return true;
            }

            return false;
        },
        stopForOverflow: false,
        block_time: 13 * 1000,
        produce: true,
      });

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          3, "post block height 3");

    /*
      const logs = await contract.provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: contract.address,
        topics: contract.filters.BlockCommitted(null, null, null, null, null).topics,
      });

      console.log(logs.map(v => {
          return {
              blockNumber: v.blockNumber,
              height: contract.interface.parseLog(v).values.height,
          };
      }));
      */

      /// @dev Get the return data for a specific metdata.
      async function getReturn(metdata) {
        const outputa = await outputFromMetadata({
          metadata: protocol.metadata.Metadata(metdata),
          config: settings,
        });

        return outputa.properties.data().hex();
      }

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 0,
          transactionIndex: 0,
          outputIndex: 4,
        }),
        '0xaa',
        'txa',
      );

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 0,
          transactionIndex: 1,
          outputIndex: 4,
        }),
        '0xbb',
        'txb',
      );

      t.equal(
        await getReturn({
          blockHeight: 2,
          rootIndex: 0,
          transactionIndex: 0,
          outputIndex: 4,
        }),
        '0xcc',
        'txc',
      );

      t.equal(
        await getReturn({
          blockHeight: 2,
          rootIndex: 0,
          transactionIndex: 1,
          outputIndex: 4,
        }),
        '0xee',
        'txe',
      );

      t.equal(
        await getReturn({
          blockHeight: 2,
          rootIndex: 1,
          transactionIndex: 0,
          outputIndex: 4,
        }),
        '0xdd',
        'txd',
      );

      t.equal(
        await getReturn({
          blockHeight: 2,
          rootIndex: 1,
          transactionIndex: 1,
          outputIndex: 4,
        }),
        '0xff',
        'txf',
      );

      t.equal(
        await getReturn({
          blockHeight: 3,
          rootIndex: 0,
          transactionIndex: 0,
          outputIndex: 4,
        }),
        '0xeeee',
        'txe-after-fraud',
      );

      t.equal(
        await getReturn({
          blockHeight: 3,
          rootIndex: 0,
          transactionIndex: 1,
          outputIndex: 4,
        }),
        '0xeeee',
        'txf-after-fraud',
      );
    }

    await state();
});