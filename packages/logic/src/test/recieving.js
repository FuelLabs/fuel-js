// this will test a single account getting a bunch of recieving
// inputs, we will see if the balance reconsiling is correct.
const { test, utils, overrides } = require("@fuel-js/environment");
const { ERC20, OwnedProxy, Fuel } = require("@fuel-js/contracts");
const tx = require("@fuel-js/protocol/src/transaction");
const interface = require("@fuel-js/interface");
const protocol = require("@fuel-js/protocol");
const struct = require("@fuel-js/struct");
const config = require("./config.local");
const sync = require("../sync");
const transact = require("../transact");
const balance = require('../balance');
const outputFromMetadata = require("./outputFromMetadata");

module.exports = test("receiving", async (t) => {
  // Setup Addresses
  const producer = t.wallets[0].address;
  const cold = t.wallets[1].address;
  const coldWallet = t.wallets[1];
  const userA = t.wallets[2].address;
  const userAWallet = t.wallets[2];
  const userB = t.wallets[3].address;
  const userBWallet = t.wallets[3];

  // Before method.
  async function state(opts = {}) {
    // Produce the Block Producer Proxy.
    const proxy = await t.deploy(OwnedProxy.abi, OwnedProxy.bytecode, [
      producer,
      cold,
    ]);

    // Produce Fuel and the Genesis Hash.
    const genesisHash = utils.keccak256("0xdeadbeaf");
    const contract = await t.deploy(Fuel.abi, Fuel.bytecode, [
      proxy.address,
      20,
      20,
      20,
      utils.parseEther("1.0"),
      "Fuel",
      "1.1.0",
      0,
      genesisHash,
    ]);

    // Set proxy target to Fuel.
    const coldProxy = proxy.connect(coldWallet);
    await t.wait(
      coldProxy.setTarget(contract.address, overrides),
      "set target",
      OwnedProxy.errors
    );

    // Commit addresses.
    await t.wait(
      contract.commitAddress(producer, overrides),
      "commit addresses",
      Fuel.errors
    );
    await t.wait(
      contract.commitAddress(t.wallets[1].address, overrides),
      "commit addresses",
      Fuel.errors
    );

    // State the number of addresses.
    let numAddresses = 3;

    // Specify the owners in question here.
    const owners = {
      0: utils.emptyAddress,
      1: producer,
      2: t.wallets[1].address,
    };

    // Resolve data to the owner address.
    function resolveOwner(data = 0) {
      let ownerId = data.toHexString ? data.toNumber() : data;

      // If it's an address, return it.
      if (typeof ownerId === "string" && utils.hexDataLength(ownerId) == 20) {
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
      network: "unspecified",
      provider: t.getProvider(),
      console: console,
      contract,
      continue: () => false,
      proxy,
      produce: false,
      feeEnforcement: false,
      stopForOverflow: true, // for testing.
      operators: [t.getWallets()[0].privateKey],
    });

    // Sync.
    await sync(settings);

    // Produce the token.
    const totalSupply = utils.parseEther("100000000000000.00");
    const erc20 = await t.deploy(ERC20.abi, ERC20.bytecode, [
      producer,
      totalSupply,
    ]);

    // Make a Deposit for User A.
    const userAFunnel = await contract.funnel(userA);
    const userAAmount = utils.parseEther("1000");

    // Two tokens, ether and token.
    let numTokens = 2;

    // This will set the fee in the db.
    async function setFee(token = 0, fee = 0) {
      return await settings.db.put([interface.db.fee, token], fee);
    }

    // This will get the fee.
    async function getFee(token = 0) {
      try {
        return utils.bigNumberify(
          await settings.db.get([interface.db.fee, token])
        );
      } catch (err) {
        return utils.bigNumberify(0);
      }
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

    let deposits = [];
    for (var i = 0; i < 10; i++) {
      deposits.push(await makeDeposit({}));
    }

    // Make a tx.
    async function makeTx(txOpts = {}) {
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

    // Sync
    await sync({ ...settings, produce: false });
    await sync({ ...settings, produce: false });
    await sync({ ...settings, produce: false });
    await sync({ ...settings, produce: false });
    await sync({ ...settings, produce: false });

    for (const deposit of deposits) {
      await makeTx({
        ...deposit,
        inputTx: null,
        feeToken: 0,
        data: "0xaa",
      });
    }

    t.equalBig(
      await balance.get(userB, 0, settings),
      utils.parseEther("0"),
      "userB balance before sync",
    );

    await sync({ ...settings, produce: false });

    t.equalBig(
      await balance.get(userB, 0, settings),
      utils.parseEther("500").mul(deposits.length),
      "userB balance before after sync",
    );

    await t.increaseBlock(10);

    await sync({ ...settings, produce: true });
    await sync({ ...settings, produce: false });

    t.equalBig(
        await balance.get(userB, 0, settings),
        utils.parseEther("500").mul(deposits.length),
        "userB balance before after produce and sync",
      );
    
    await makeEtherDeposit({
        user: userB,
        amount: '123.210',
    });

    t.equalBig(
        await balance.get(userB, 0, settings),
        utils.parseEther("500").mul(deposits.length),
        "userB balance before after produce and sync",
      );

    await sync({ ...settings, produce: false });

    t.equalBig(
        await balance.get(userB, 0, settings),
        utils.parseEther("500")
            .mul(deposits.length)
            .add(utils.parseEther('123.210')),
        "userB balance before after deposit using sync balance",
      );

    // Now we switch to the mempool balance checking.

    deposits = [];
    for (var i = 0; i < 5; i++) {
        deposits.push(await makeDeposit({}));
    }

    // Sync the deposits.
    await sync({ ...settings, produce: false });

    // Make a bunch of mempool txs.
    for (const deposit of deposits) {
        await makeTx({
            ...deposit,
            inputTx: null,
            feeToken: 0,
            data: "0xaa",
        });
    }
    
    // Sync mempool txs.
    await sync({ ...settings, produce: false });

    // Make a deposit
    await makeEtherDeposit({
        user: userB,
        amount: '239',
    });

    // Sync the ether deposit.
    await sync({ ...settings, produce: false });

    // Check balance.
    t.equalBig(
        await balance.get(userB, 0, settings),
        utils.parseEther("500")
            .mul(deposits.length + 10)
            .add(utils.parseEther('123.210'))
            .add(utils.parseEther('239')),
        "userB balance after 5 mempool txs and deposit (increase sync and mempool balance)",
      );

    // increase blocks by 10
    await t.increaseBlock(10);

    // Sync the ether deposit, produce the block.
    await sync({ ...settings, produce: true });
    await sync({ ...settings, produce: false });

    // Check balance.
    t.equalBig(
        await balance.get(userB, 0, settings),
        utils.parseEther("500")
            .mul(deposits.length + 10)
            .add(utils.parseEther('123.210'))
            .add(utils.parseEther('239')),
        "userB balance after 5 mempool txs and deposit after block production (increase sync and mempool balance)",
      );

    await settings.db.close();
  }

  await state();
});
