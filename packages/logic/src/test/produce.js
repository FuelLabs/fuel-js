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

module.exports = test('produce', async t => {
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
        await sync(settings);

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
        inputTx: txa,
        feeToken: 0,
        data: '0xbb',
      });

      const tx0 = await makeTx({
        inputTx: null,
        feeToken: 1,
        data: '0x00',
      });

      // Set the fees to a different structure.
      await setFee(0, utils.parseEther('0.0000023'));
      await setFee(1, utils.parseEther('0.0002'));

      const tx0a = await makeTx({
        inputTx: null,
        feeToken: 1,
        data: '0x0a',
      });

      const txc = await makeTx({
        inputTx: txb,
        feeToken: 0,
        data: '0xcc',
      });

      const txd = await makeTx({
        inputTx: txc,
        feeToken: 0,
        data: '0xdd',
      });

      const tx0b = await makeTx({
        inputTx: tx0a,
        feeToken: 1,
        data: '0x0b',
      });

      const txad0 = await makeTx({
        inputTx: txd,
        feeToken: 0,
        data: '0xad',
      });

      // Set the ether and token Fees.
      await setFee(0, utils.parseEther('0.00000012'));
      await setFee(1, utils.parseEther('0.00001'));

      const tx1 = await makeTx({
        inputTx: tx0,
        feeToken: 1,
        data: '0x01',
      });

      // Increase block for production purposes.
      await t.increaseBlock(20);

      // Get the pre-state before the block in question is processed.
      let preState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(preState.properties.blockHeight().get(), 
          0, "pre block height");

      // Now produce this block.
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });

      // Get the pre-state before the block in question is processed.
      let postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          1, "post block height");

      // Set the ether and token Fees.
      await setFee(0, utils.parseEther('0.00000012'));
      await setFee(1, utils.parseEther('0.00001'));

      // Hacks.
      let lastTx = null;

      // Create 100 txs.
      for (let i = 0; i < 128; i++) {
        lastTx = await makeTx({
          inputTx: lastTx,
          feeToken: i % 2 == 0 ? 1 : 0,
          data: utils.hexlify(i),
        });
      }

      // Increase block for production purposes.
      await t.increaseBlock(10);

      // Get the pre-state before the block in question is processed.
      preState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(preState.properties.blockHeight().get(), 
          1, "pre block height 2");

      // Now produce this block.
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          2, "post block height 2");
      
      // Create 100 txs of one fee type.
      for (let i = 0; i < 100; i++) {
        lastTx = await makeTx({
          inputTx: lastTx,
          feeToken: 0,
          data: utils.hexlify(i),
        });
      }

      // Create 100 txs of another fee type.
      for (let i = 0; i < 100; i++) {
        lastTx = await makeTx({
          inputTx: lastTx,
          feeToken: 1,
          data: utils.hexlify(i),
        });
      }

      // Increase block for production purposes.
      await t.increaseBlock(10);

      // Get the pre-state before the block in question is processed.
      preState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));
      await sync({
        ...settings,
        produce: true,
      });

      // Check pre-state block height in client.
      t.equalBig(preState.properties.blockHeight().get(), 
          2, "pre block height 3");

      // Now produce this block.
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });

      // Get the pre-state before the block in question is processed.
      postState = protocol.state.State(await settings.db.get([
        interface.db.state,
      ]));

      // Check pre-state block height in client.
      t.equalBig(postState.properties.blockHeight().get(), 
          3, "post block height 3");

      // Get the third block header.
      const block3 = await protocol.block.BlockHeader.fromLogs(
        3,
        contract,
      );

      // Check the number of roots is right.
      t.equal(block3.properties.roots().get().length, 
        4, 'block 3 roots length');
      
      // Increase the blocks 100.
      await t.increaseBlock(100);

      // Check proxy retrieval of bonds.
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });
      await sync({
        ...settings,
        produce: true,
      });

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
          blockHeight: 1,
          rootIndex: 1,
          transactionIndex: 0,
          outputIndex: 4,
        }),
        '0x00',
        'tx0',
      );

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 1,
          transactionIndex: 1,
          outputIndex: 4,
        }),
        '0x01',
        'tx1',
      );

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 2,
          transactionIndex: 0,
          outputIndex: 4,
        }),
        '0x0a',
        'tx0a',
      );

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 2,
          transactionIndex: 1,
          outputIndex: 4,
        }),
        '0x0b',
        'tx0b',
      );

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 3,
          transactionIndex: 0,
          outputIndex: 4,
        }),
        '0xcc',
        'txcc',
      );

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 3,
          transactionIndex: 1,
          outputIndex: 4,
        }),
        '0xdd',
        'txdd',
      );

      t.equal(
        await getReturn({
          blockHeight: 1,
          rootIndex: 3,
          transactionIndex: 2,
          outputIndex: 4,
        }),
        '0xad',
        'txad',
      );
      


    }

    await state();
});

/*
Where d inputs c inputs b inputs a; 0a inputs 0; 1 inputs 0; 0b inputs 0a; ad0 inputs a, d, 0;

Scenario a:

Input:
Txa (fee y);
Txb (fee y);
Tx0 (fee k);
Tx0a (fee y);
Txc (fee z);
Txd (fee z);
Tx0b (fee y);
Txad0 (fee z);
Tx1 (fee k);

Output:
Block - root y (a, b), root k (0, 1), root y (0a, 0b), root z (c, d, ad0);

Scenario b:

Input:
Txa (fee z);
Txb (fee y);
Txc (fee z);
Txd (fee y);

Output:
Block - root zA, root yB, root zC, root dY

Sorting is based up (1) in block dependant ordering, (2) fee types
*/