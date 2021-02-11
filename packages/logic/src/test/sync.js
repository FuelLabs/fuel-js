const { test, utils } = require('@fuel-js/environment');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol');
const { ERC20, Fuel } = require('@fuel-js/contracts');
const struct = require('@fuel-js/struct');
const defaults = require('./defaults');
const config = require('./config.local');
const sync = require('../sync');
const balance = require('../balance');
const transact = require('../transact');
const { withdrawProofFromMetadata } = require('../withdraw');

module.exports = test('sync', async t => {
  // check if sync dbs the right values
  const producer = t.getWallets()[0].address;
  const userB = t.wallets[3].address;
  const userBWallet = t.wallets[3];
  const userC = t.wallets[4].address;
  const userCWallet = t.wallets[4];
  const contract = await t.deploy(
    Fuel.abi, 
    Fuel.bytecode, defaults(producer));
  let settings = config({
    network: 'unspecified',
    provider: t.getProvider(),
    contract,
    continue: () => false,
    produce: true,
    operators: [
      t.getWallets()[0].privateKey,
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

  t.equalBig(state.properties.blockNumber().get(), tx.blockNumber, 'state blockNumber');
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
    'ether deposit', Fuel.errors);

  t.equalBig(await balance.get(depositOwner, 
      depositTokenId, settings), 0, 'zero balance');

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

  await sync(settings);

  /*
  console.log(await settings.db.get([
    interface.db.tokenMetadata,
    1,
  ]));
  */

  t.equalBig(await balance.get(depositOwner, 
    depositTokenId, settings), depositAmount, 'deposit balance');

  let etherDeposit = deposit = protocol.deposit.Deposit(
    await settings.db.get([
      interface.db.deposit2,
      depositOwner,
      depositTokenId,
      depositProof.properties.blockNumber().get(),
    ]),
    null,
    protocol.addons.Deposit);
  let depositAddon = deposit.getAddon();
  let etherDeposit2 = protocol.deposit.Deposit(
    await settings.db.get([
      interface.db.deposit2,
      depositOwner,
      depositTokenId,
      depositProof.properties.blockNumber().get(),
    ]),
    null,
    protocol.addons.Deposit);

  t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit proof');
  t.equalHex(etherDeposit2.encodePacked(), depositProof.encodePacked(), 'deposit2 proof');

  state = protocol.state.State(await settings.db.get([ interface.db.state ]));

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

  t.equalBig(state.properties.blockNumber().get(), depositTx.blockNumber, 'state blockNumber');
  t.equalBig(state.properties.blockHeight().get(), 0, 'state blockHeight');
  t.equalBig(state.properties.numTokens().get(), 1, 'state numTokens');
  t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
  t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
  t.equalBig(state.properties.transactions().get(), 0, 'state transactions');
  t.equalBig(state.properties.trades().get(), 0, 'state trades');

  t.ok(1, '***testing ERC20 deposit***');

  const totalSupply = utils.bigNumberify('0xFFFFFFFFFFFFFFFFFFFFFF');
  const erc20 = await t.deploy(ERC20.abi, ERC20.bytecode, [producer, totalSupply]);

  // Setup the settings for token metadata colleciton.
  const generalErc20 = erc20.attach(utils.emptyAddress);
  settings = {
    ...settings,
    erc20: generalErc20,
  };
    
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
    'erc20 deposit', Fuel.errors);

    t.equalBig(await balance.get(utils.emptyAddress, 
      depositTokenId, settings), 0, 'zero account balance 0');
  
  t.equalBig(await balance.get(depositOwner, depositTokenId, settings), 0, 'deposit erc20 balance zero');

  await sync(settings);

  const erc20Metadata = protocol.token.Token(
    await settings.db.get([
      interface.db.tokenMetadata, 
      1,
    ]),
  );

  t.equalBig(erc20Metadata.properties.decimals().get(), 18);
  t.equalBig(erc20Metadata.properties.addr().get(), erc20.address);

  t.equalBig(await balance.get(depositOwner, depositTokenId, settings), depositAmount, 'deposit erc20 blance filled');

  let erc20Deposit = deposit = protocol.deposit.Deposit(
    await settings.db.get([
      interface.db.deposit2,
      depositOwner,
      depositTokenId,
      depositProof.properties.blockNumber().get(),
    ]),
    null,
    protocol.addons.Deposit);
  depositAddon = deposit.getAddon();

  t.equalHex(deposit.encodePacked(), depositProof.encodePacked(), 'deposit proof');

  state = protocol.state.State(await settings.db.get([ interface.db.state ]));

  t.equalBig(state.properties.blockNumber().get(), depositTx.blockNumber, 'state blockNumber');
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

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

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
    outputs: [ protocol.outputs.OutputWithdraw({
      owner: userB,
      amount: utils.parseEther('.3'), // 1.3
      token: 0,
    }), protocol.outputs.OutputTransfer({
      owner: userB,
      amount: utils.parseEther('.2'), // 1.3
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

  await sync({ ...settings, produce: false });
  await sync({ ...settings, produce: false });
  await sync({ ...settings, produce: false });

  t.equalBig(await balance.get(userB,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.2'), 'user B check');

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8'), 'deposit ether balance filled post-tx');

  await sync({ ...settings, produce: false });

  await t.increaseBlock(5);

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

  await sync(settings);
  await sync(settings);
  await sync(settings);

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8'), 'deposit ether balance filled post-sync');

  t.ok(1, '***testing single root, single transaction block processing***');

  state = protocol.state.State(await settings.db.get([ interface.db.state ]));

  let blockNumber = await t.getProvider().getBlockNumber();

  t.equalBig(state.properties.blockNumber().get(), blockNumber, 'state blockNumber');
  t.equalBig(state.properties.blockHeight().get(), 1, 'state blockHeight');
  t.equalBig(state.properties.numTokens().get(), 2, 'state numTokens');
  t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
  t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
  t.equalBig(state.properties.transactions().get(), 1, 'state transactions');
  t.equalBig(state.properties.trades().get(), 0, 'state trades');

  await t.increaseBlock(20);

  await sync(settings);
  await sync(settings);
  await sync(settings);

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8'), 'deposit ether balance filled');

  state = protocol.state.State(await settings.db.get([ interface.db.state ]));

  t.equalBig(state.properties.blockNumber().get(), blockNumber + 20, 'state blockNumber');
  t.equalBig(state.properties.blockHeight().get(), 1, 'state blockHeight');
  t.equalBig(state.properties.numTokens().get(), 2, 'state numTokens');
  t.equalBig(state.properties.numAddresses().get(), 1, 'state numAddresses');
  t.equalBig(state.properties.penalty().get(), 0, 'state penalty');
  t.equalBig(state.properties.transactions().get(), 1, 'state transactions');
  t.equalBig(state.properties.trades().get(), 0, 'state trades');

  t.ok(1, '***testing two root, two transaction block production***');

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

  let outputs = [ protocol.outputs.UTXO({
    transactionHashId: protocol.witness.transactionHashId(unsigned, contract, 0),
    outputIndex: 2,
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
 
    t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');
  
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

  await sync({ ...settings, ...normalMempool });
  await sync({ ...settings, ...normalMempool });
  await sync({ ...settings, ...normalMempool });
  
  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8'), 'deposit ether balance filled pre-transact');

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');
  
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

  await sync(settings);

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8'), 'deposit ether balance filled');

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

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
      owner: userC,
      amount: utils.parseEther('0.04'),
      token: 0,
    }), protocol.outputs.OutputHTLC({
      owner: depositOwner,
      amount: utils.parseEther('0.04'),
      token: 0,
      digest: utils.sha256('0xdeadbeef'),
      expiry: (await t.getProvider().getBlockNumber() + 50),
      returnOwner: userC,
    }), protocol.outputs.OutputTransfer({
      owner: userC,
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

  t.equalBig(await balance.get(balance.withdrawAccount(depositOwner),
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('0'), 'deposit owner withdraw account');

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

  await transact(unsigned.encodeRLP(), struct.combine(witnesses), 0, settings);

  await sync({ ...settings, produce: false });

  t.equalBig(await balance.get(balance.withdrawAccount(depositOwner),
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('0.04'), 'deposit owner withdraw account after sync');

  t.equalBig(await balance.get(depositOwner,
    erc20Deposit.properties.token().get(), settings),
    utils.parseEther('0'), 'deposit erc20 balance filled');

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8').sub(utils.parseEther('.12')), 'deposit ether balance filled');

  t.equalBig(await balance.get(utils.emptyAddress, 
    depositTokenId, settings), 0, 'zero account balance 0');

  await t.increaseBlock(10);

  for (var i = 0; i < 6; i++) {
    await sync({ ...settings, rootLengthTarget: 1000 });
  }

  t.equalBig(await balance.get(depositOwner,
    erc20Deposit.properties.token().get(), settings),
    utils.parseEther('0'), 'deposit erc20 balance filled');

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8').sub(utils.parseEther('.12')), 'deposit ether balance filled');

  // Attempt some withdrawals.
  await t.increaseBlock(100);

  t.equalBig(await balance.get(userB,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.2'), 'user B check');

  let withdrawTx = null;

  try {
    withdrawTx = await settings.contract.withdraw((await withdrawProofFromMetadata({
      metadata: protocol.metadata.Metadata({
        blockHeight: 1,
        transactionIndex: 0,
        rootIndex: 0,
        outputIndex: 0,
      }),
      config: settings,
    })).encodePacked(), t.getOverrides());
    withdrawTx = await withdrawTx.wait();
  } catch (err) {
    console.log(err);
    return;
  }

  for (var i = 0; i < 6; i++) {
    await sync({ ...settings, rootLengthTarget: 1000 });
  }

  t.equalBig(await balance.get(userB,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.2'), 'user B check post withdrawal');

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8').sub(utils.parseEther('.12')), 'deposit ether balance filled');
  
    t.equalBig(await balance.get(utils.emptyAddress, 
      depositTokenId, settings), 0, 'zero account balance 0');
  
  withdrawTx = await settings.contract.withdraw((await withdrawProofFromMetadata({
    metadata: protocol.metadata.Metadata({
      blockHeight: 4,
      transactionIndex: 0,
      rootIndex: 0,
      outputIndex: 1,
    }),
    config: settings,
  })).encodePacked(), t.getOverrides());
  withdrawTx = await withdrawTx.wait();

  for (var i = 0; i < 6; i++) {
    await sync({ ...settings, rootLengthTarget: 1000 });
  }

  t.equalBig(await balance.get(depositOwner,
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('.8').sub(utils.parseEther('.12')), 'post withdrawal deposit owner');

  t.equalBig(await balance.get(balance.withdrawAccount(depositOwner),
    etherDeposit.properties.token().get(), settings),
    utils.parseEther('0'), 'deposit owner withdraw account after sync');

  t.equalBig(await balance.get(utils.emptyAddress, 
      depositTokenId, settings), 0, 'zero account balance 0');
  
  await settings.db.close();
});