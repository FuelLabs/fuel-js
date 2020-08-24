const { test, utils } = require('@fuel-js/environment');
const abi = require('@fuel-js/abi');
const interface = require('@fuel-js/interface');
const bytecode = require('@fuel-js/bytecode');
const protocol = require('@fuel-js/protocol');
const struct = require('@fuel-js/struct');
const errors = require('@fuel-js/errors');
const defaults = require('./defaults');
const config = require('./config.local');
const sync = require('../sync');
const balance = require('../balance');
const transact = require('../transact');
const streamToArray = require('stream-to-array');

module.exports = test('sync', async t => {
  try {

    // check if sync dbs the right values
    const producer = t.getWallets()[0].address;
    const contract = await t.deploy(abi.Fuel, bytecode.Fuel, defaults(producer));
    const settings = config({
      network: 'unspecified',
      provider: t.getProvider(),
      contract,
      continue: () => false,
      produce: true,
      operators: [
        t.getWallets()[0].privateKey
      ],
      minimumTransactionsPerRoot: 0, // min 1 tx
      rootLengthTarget: 250, // 200 bytes
    });

    const normalMempool = {
      minimumTransactionsPerRoot: 200, // min 1 tx
      rootLengthTarget: 31000, // 200 bytes
    };

    let tx = await contract.deployTransaction.wait();

    t.ok(1, '***testing genesis sync***');

    await sync(settings);

    t.equalBig(await settings.db.get([ interface.db.token, 0 ]), 0, 'ether addr');
    t.equalBig(await settings.db.get([ interface.db.tokenId, 0 ]), 0, 'ether id');
    t.equalBig(await settings.db.get([ interface.db.contract ]), contract.address, 'contract');

    let state = protocol.state.State(await settings.db.get([ interface.db.state ]));

    t.equalBig(state.properties.blockNumber().get(), tx.blockNumber + 2, 'state blockNumber');
    t.equalBig(state.properties.blockHeight().get(), 0, 'state blockHeight');
    t.equalBig(state.properties.numTokens().get(), 1, 'state numTokens');
    t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
    t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
    t.equalBig(state.properties.transactions().get(), 0, 'state transactions');
    t.equalBig(state.properties.trades().get(), 0, 'state trades');

    let block = protocol.block.BlockHeader(
      await settings.db.get([ interface.db.block, 0 ]),
      null,
      protocol.addons.BlockHeader);

    t.equalBig(block.properties.blockNumber().get(), tx.blockNumber, 'block 0 blockNumber');
    t.equalBig(block.properties.height().get(), 0, 'block 0 height');
    t.equalBig(block.properties.numTokens().get(), 1, 'block 0 numTokens');
    t.equalBig(block.properties.numAddresses().get(), 1, 'block 0 numAddresses');
    t.equalBig(block.properties.roots().get().length, 0, 'block 0 roots');

    let blockAddon = block.getAddon();

    t.ok(blockAddon.properties.timestamp().get().gt(0), 'blockAddon 0 timestamp');
    t.equalBig(
      blockAddon.properties.transactionHash().get(),
      contract.deployTransaction.hash,
      'blockAddon 0 transactionHash');

    t.ok(1, '***testing ether deposit***');

    // funnel producer
    let funnel = await contract.funnel(producer);
    let depositTokenId = 0;
    let depositToken = utils.emptyAddress;
    let depositOwner = producer;
    let depositAmount = utils.parseEther('1.3');
    let transferTx = await t.wait(t.getWallets()[0].sendTransaction({
      ...t.getOverrides(),
      value: depositAmount,
      to: funnel,
    }), 'ether to funnel deposit');
    let depositProof = new protocol.deposit.Deposit({
      token: depositTokenId,
      owner: depositOwner,
      blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
      value: depositAmount,
    });
    let depositTx = await t.wait(contract.deposit(depositOwner, depositToken, t.getOverrides()),
      'ether deposit', errors.Fuel);

    t.equalBig(await balance.get(depositOwner, depositTokenId, settings), 0, 'zero balance');

    await sync(settings);

    t.equalBig(await balance.get(depositOwner, depositTokenId, settings), depositAmount, 'deposit balance');

    let etherDeposit = deposit = protocol.deposit.Deposit(
      await settings.db.get([
        interface.db.deposit,
        depositProof.properties.blockNumber().get(),
        depositTokenId,
        depositOwner,
      ]),
      null,
      protocol.addons.Deposit);
    let depositAddon = deposit.getAddon();

    t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit proof');

    state = protocol.state.State(await settings.db.get([ interface.db.state ]));

    t.equalBig(state.properties.blockNumber().get(), depositTx.blockNumber + 2, 'state blockNumber');
    t.equalBig(state.properties.blockHeight().get(), 0, 'state blockHeight');
    t.equalBig(state.properties.numTokens().get(), 1, 'state numTokens');
    t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
    t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
    t.equalBig(state.properties.transactions().get(), 0, 'state transactions');
    t.equalBig(state.properties.trades().get(), 0, 'state trades');

    t.ok(1, '***testing ERC20 deposit***');

    const totalSupply = utils.bigNumberify('0xFFFFFFFFFFFFFFFFFFFFFF');
    const erc20 = await t.deploy(abi.ERC20, bytecode.ERC20, [producer, totalSupply]);

    depositToken = erc20.address;
    depositTokenId = 1;
    depositAmount = utils.parseEther('1.43312');
    transferTx = await t.wait(erc20.transfer(funnel, depositAmount, t.getOverrides()), 'erc20 transfer');
    depositProof = new protocol.deposit.Deposit({
      token: depositTokenId,
      owner: depositOwner,
      blockNumber: utils.bigNumberify(await t.getBlockNumber()).add(1),
      value: depositAmount,
    });
    depositTx = await t.wait(contract.deposit(depositOwner, depositToken, t.getOverrides()),
      'erc20 deposit', errors.Fuel);

    t.equalBig(await balance.get(depositOwner, depositTokenId, settings), 0, 'deposit erc20 balance zero');

    await sync(settings);

    t.equalBig(await balance.get(depositOwner, depositTokenId, settings), depositAmount, 'deposit erc20 blance filled');

    let erc20Deposit = deposit = protocol.deposit.Deposit(
      await settings.db.get([
        interface.db.deposit,
        depositProof.properties.blockNumber().get(),
        depositTokenId,
        depositOwner,
      ]),
      null,
      protocol.addons.Deposit);
    depositAddon = deposit.getAddon();

    t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit proof');

    state = protocol.state.State(await settings.db.get([ interface.db.state ]));

    t.equalBig(state.properties.blockNumber().get(), depositTx.blockNumber + 1, 'state blockNumber');
    t.equalBig(state.properties.blockHeight().get(), 0, 'state blockHeight');
    t.equalBig(state.properties.numTokens().get(), 2, 'state numTokens');
    t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
    t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
    t.equalBig(state.properties.transactions().get(), 0, 'state transactions');
    t.equalBig(state.properties.trades().get(), 0, 'state trades');

    const notWithdrawal = 0;

    let depositHash = deposit.keccak256();

    deposit = protocol.deposit.Deposit(await settings.db.get([
      interface.db.inputHash,
      protocol.inputs.InputTypes.Deposit,
      notWithdrawal,
      depositHash,
    ]), null, protocol.addons.Deposit);

    t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit input hash proof');

    deposit = protocol.deposit.Deposit(await settings.db.get([
      interface.db.owner,
      depositOwner,
      depositTokenId,
      depositAddon.properties.timestamp().get(),
      protocol.inputs.InputTypes.Deposit,
      notWithdrawal,
      depositHash,
    ]), null, protocol.addons.Deposit);

    t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit owner proof');

    let archiveTransactionHash = await settings.db.get([
      interface.db.archiveHash,
      protocol.inputs.InputTypes.Deposit,
      notWithdrawal,
      depositHash,
    ]);

    t.equalHex(archiveTransactionHash, depositTx.transactionHash, 'deposit owner archive hash');

    t.ok(1, '***testing single root, single transaction block production***');

    let unsigned = protocol.transaction.Unsigned({
      inputs: [
        protocol.inputs.InputDeposit({
        token: 0,
        owner: depositOwner,
      }) ],
      outputs: [ protocol.outputs.OutputTransfer({
        owner: utils.emptyAddress,
        amount: utils.parseEther('.5'), // 1.3
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('.8'),
        token: 0,
      }) ],
      data: [
        etherDeposit.keccak256(),
      ],
      signatureFeeToken: 0,
      fee: 0,
    });

    let witnesses = [ await protocol.witness.Signature(t.getWallets()[0], unsigned, contract, 0) ];

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      etherDeposit.properties.value().get(), 'deposit ether balance filled pre-tx');

    await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled post-tx');

    await t.increaseBlock(5);

    await sync(settings);

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled post-sync');

    t.ok(1, '***testing single root, single transaction block processing***');

    state = protocol.state.State(await settings.db.get([ interface.db.state ]));

    let blockNumber = await t.getProvider().getBlockNumber();

    t.equalBig(state.properties.blockNumber().get(), blockNumber - 4, 'state blockNumber');
    t.equalBig(state.properties.blockHeight().get(), 0, 'state blockHeight');
    t.equalBig(state.properties.numTokens().get(), 2, 'state numTokens');
    t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
    t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
    t.equalBig(state.properties.transactions().get(), 0, 'state transactions');
    t.equalBig(state.properties.trades().get(), 0, 'state trades');

    await t.increaseBlock(5);

    await sync(settings);
    await sync(settings);
    await sync(settings);

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled');

    state = protocol.state.State(await settings.db.get([ interface.db.state ]));

    t.equalBig(state.properties.blockNumber().get(), blockNumber + 2, 'state blockNumber');
    t.equalBig(state.properties.blockHeight().get(), 1, 'state blockHeight');
    t.equalBig(state.properties.numTokens().get(), 2, 'state numTokens');
    t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
    t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
    t.equalBig(state.properties.transactions().get(), 1, 'state transactions');
    t.equalBig(state.properties.trades().get(), 0, 'state trades');

    t.ok(1, '***testing two root, two transaction block production***');

    let outputs = [ protocol.outputs.UTXO({
      transactionHashId: protocol.witness.transactionHashId(unsigned, contract, 0),
      outputIndex: 1,
      outputType: protocol.inputs.InputTypes.Transfer,
      owner: depositOwner,
      amount: utils.parseEther('.8'), // 1.3
      token: 0,
    }) ];

    unsigned = protocol.transaction.Unsigned({
      inputs: [ protocol.inputs.InputTransfer({}) ],
      outputs: [ protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('.4'),
        token: 0,
      }),
      protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('.4'),
        token: 0,
      }) ],
      data: [
        outputs[0].keccak256(),
      ],
      signatureFeeToken: 0,
      fee: 0,
    });

    witnesses = [ await protocol.witness.Signature(t.getWallets()[0], unsigned, contract, 0) ];

    await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance post-tx 2');

    outputs = [ protocol.outputs.UTXO({
      transactionHashId: protocol.witness.transactionHashId(unsigned, contract, 0),
      outputIndex: 1,
      outputType: protocol.inputs.InputTypes.Transfer,
      owner: depositOwner,
      amount: utils.parseEther('.4'), // 1.3
      token: 0,
    }) ];

    unsigned = protocol.transaction.Unsigned({
      inputs: [ protocol.inputs.InputTransfer({}) ],
      outputs: [ protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('.2'),
        token: 0,
      }),
      protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('.2'),
        token: 0,
      }) ],
      data: [
        outputs[0].keccak256(),
      ],
      signatureFeeToken: 0,
      fee: 0,
    });

    witnesses = [ await protocol.witness.Signature(t.getWallets()[0], unsigned, contract, 0) ];

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled pre-transact');

    await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled pre-sync');

    await t.increaseBlock(5);

    await sync(settings);
    await sync(settings);
    await sync(settings);

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled post-sync');

    t.ok(1, '***testing multi root, 1000 transaction block production***');

    for (var i = 0; i < 1000; i++) {
      outputs = [ protocol.outputs.UTXO({
        transactionHashId: protocol.witness.transactionHashId(unsigned, contract, 0),
        outputIndex: i === 0 ? 1 : 0,
        outputType: protocol.inputs.InputTypes.Transfer,
        owner: depositOwner,
        amount: utils.parseEther('.2'),
        token: 0,
      }) ];

      unsigned = protocol.transaction.Unsigned({
        inputs: [ protocol.inputs.InputTransfer({}) ],
        outputs: [ protocol.outputs.OutputTransfer({
          owner: depositOwner,
          amount: utils.parseEther('.2'),
          token: 0,
        }) ],
        data: [
          outputs[0].keccak256(),
        ],
        signatureFeeToken: 0,
        fee: 0,
      });

      witnesses = [ await protocol.witness.Signature(t.getWallets()[0], unsigned, contract, 0) ];

      await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);
    }

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled');

    await t.increaseBlock(5);

    t.ok(1, '***testing multi root, 1000 transaction block processing***');

    for (var i = 0; i < 3; i++) { // 3
      await sync({ ...settings, ...normalMempool });

      t.equalBig(await balance.get(depositOwner,
        etherDeposit.properties.token().get(), settings),
        utils.parseEther('.8'), 'deposit ether balance filled');
    }

    for (var i = 0; i < 5; i++) {
      await sync({ ...settings, ...normalMempool });
    }

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled');

    t.ok(1, '***attempt multi-input output witness type tx**');

    outputs = [
      protocol.outputs.UTXO({
        transactionHashId: protocol.witness.transactionHashId(unsigned, contract, 0),
        outputIndex: i === 0 ? 1 : 0,
        outputType: protocol.inputs.InputTypes.Transfer,
        owner: depositOwner,
        amount: utils.parseEther('.2'),
        token: 0,
      }),
      erc20Deposit,
    ];

    unsigned = protocol.transaction.Unsigned({
      inputs: [
        protocol.inputs.InputTransfer({}),
        protocol.inputs.InputDeposit({
          owner: erc20Deposit.properties.owner().get(),
        }),
      ],
      outputs: [ protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.04'),
        token: 0,
      }), protocol.outputs.OutputWithdraw({
        owner: depositOwner,
        amount: utils.parseEther('0.04'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: utils.emptyAddress,
        amount: utils.parseEther('0.04'),
        token: 0,
      }), protocol.outputs.OutputHTLC({
        owner: depositOwner,
        amount: utils.parseEther('0.04'),
        token: 0,
        digest: utils.keccak256('0xdeadbeef'),
        expiry: (await t.getProvider().getBlockNumber() + 50),
        returnOwner: '0x00',
      }), protocol.outputs.OutputTransfer({
        owner: '0x00',
        amount: utils.parseEther('1.43312'),
        token: 1,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('.04'),
        token: 0,
      }), protocol.outputs.OutputReturn({
        data: '0xdeadbeef',
      }) ],
      data: [
        outputs[0].keccak256(),
        outputs[1].keccak256(),
      ],
      signatureFeeToken: 0,
      fee: 0,
    });

    witnesses = [ await protocol.witness.Signature(t.getWallets()[0], unsigned, contract, 0) ];

    t.equalBig(await balance.get(depositOwner,
      erc20Deposit.properties.token().get(), settings),
      utils.parseEther('1.43312'), 'deposit erc20 balance filled');

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8'), 'deposit ether balance filled');

    await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);

    t.equalBig(await balance.get(depositOwner,
      erc20Deposit.properties.token().get(), settings),
      utils.parseEther('0'), 'deposit erc20 balance filled');

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8').sub(utils.parseEther('.04')), 'deposit ether balance filled');

    await t.increaseBlock(10);

    for (var i = 0; i < 6; i++) {
      await sync({ ...settings, rootLengthTarget: 1000 });
    }

    t.equalBig(await balance.get(depositOwner,
      erc20Deposit.properties.token().get(), settings),
      utils.parseEther('0'), 'deposit erc20 balance filled');

    t.equalBig(await balance.get(depositOwner,
      etherDeposit.properties.token().get(), settings),
      utils.parseEther('.8').sub(utils.parseEther('.04')), 'deposit ether balance filled');

    await settings.db.close();

    /*
    t.ok(1, '***testing multi-input, multi-output processig***');

    outputs = [ protocol.outputs.UTXO({
      transactionHashId: protocol.witness.transactionHashId(unsigned, contract, 0),
      outputIndex: 0,
      outputType: protocol.inputs.InputTypes.Transfer,
      owner: depositOwner,
      amount: utils.parseEther('.2'),
      token: 0,
    }) ];

    unsigned = protocol.transaction.Unsigned({
      inputs: [ protocol.inputs.InputTransfer({}) ],
      outputs: [ protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }), protocol.outputs.OutputTransfer({
        owner: depositOwner,
        amount: utils.parseEther('0.025'),
        token: 0,
      }) ],
      data: [
        outputs[0].keccak256(),
      ],
      signatureFeeToken: 0,
      fee: 0,
    });

    witnesses = [ await protocol.witness.Signature(t.getWallets()[0], unsigned, contract, 0) ];

    await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);
    */
    // console.log(await streamT  oArray(settings.db.createReadStream()));

  } catch (testError) { console.error(testError); }
});
