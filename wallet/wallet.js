const structs = require('../structs/structs');
const types = require('../types/types');
const _utils = require('../utils/utils');
const { FuelDBKeys, FuelInterface, ERC20Interface, FuelRPC } = require('../interfaces/interfaces');
const interfaces = require('../interfaces/interfaces');
const { addresses, networks, ids } = require('../config/config');
const errors = require('../errors/errors');
const ethers = require('ethers');
const { parseTransactions } = require('../blocks/parseTransactions');
const { transactionsFromReceipt } = require('../blocks/processBlock');
const dbs = require('../dbs');
const axios = require('axios');
const jsEnv = require('browser-or-node');
const PubNub = require('pubnub');

// Wraps Axios or a Post method, does the RLP decoding..
const postDecoder = method => (url, args) => method(url, args)
  .then(result => !result
    ? Promise.reject('No result')
    : (result.error
      ? Promise.reject(error)
      : Promise.resolve(result.data.result ? _utils.RLP.decode(result.data.result) : null)))
  .catch(error => Promise.reject(error));

// Fuel Wallet..
function Wallet({
    signer,
    provider,
    db,
    gasLimit,
    chainId,
    api,
    rpc,
    network,
    _addresses,
    _ids,
    _post,
    _receiptTimeout,
    _ignoreFrom,
  }) {
  structs.assertNew(this, Wallet);

  // Type paper
  types.TypeObject(signer);
  if (typeof db !== "undefined") { types.TypeDB(db); }
  if (typeof provider !== "undefined") { types.TypeObject(provider); }
  if (typeof _addresses !== "undefined") { types.TypeObject(_addresses); }
  if (typeof _ids !== "undefined") { types.TypeObject(_ids); }
  if (typeof _post !== "undefined") { types.TypeFunction(_post); }
  if (typeof rpc !== "undefined") { types.TypeFunction(rpc); }
  if (typeof gasLimit !== "undefined") { types.TypeBigNumber(gasLimit); }

  // DB for Wallet
  const _provider = this.provider = provider;
  const _rpc = null; /* this.rpc = rpc
    || (_provider ? FuelRPC({ web3Provider: _provider }) : null);*/

  let __fuel = this.__fuel = null;
  let __wallet = null;

  const _getReceipt = () => {};

  /*_provider ? (async txhash => {
    try {
      // Timeout
      const timeout = _receiptTimeout || 100000; // 100 seconds
      types.TypeHex(txhash, 32);

      // Receipt
      let receipt = null;
      let clock = 0;

      // Timeout
      while (!receipt || clock > timeout) {
        // Attempt to get receipt
        receipt = await _rpc('eth_getTransactionReceipt', txhash);

        // Receipt !== null
        if (receipt === null) {
          await _utils.wait(1000);
          clock += 1000;
        }
      }

      if (clock > timeout) {
        throw new Error(`Timeout while getting transaction receipt ${txhash}`);
      }

      return receipt;
    } catch (error) {
      throw new Error(error);
    }
  }) : null; // should be setup based on provider..
  */

  // Chain ID, chainId overrides network
  const ___chain_id = network === 'ropsten'
    ? '3'
    : (network === 'goerli' ? '5' : (network === 'rinkeby' ? '4' : '3')); // default to ropsten..
  const __chainId = this.chainId = String(chainId || ___chain_id); // ropsten is default

  // Check chain id..
  if (this.chainId !== '3' && this.chainId !== '4' && this.chainId !== '5') {
    throw new Error(`The chainId must be either 3, 4 or 5 (ropsten, rinkeby or goerli) got ${this.chainId}.`);
  }

  // Create a defualt DB based upon the environment of exeuction
  const _defaultDB = jsEnv.isBrowser
    ? dbs.Index
    : dbs.Memory;

  // More dbs
  const _db = this.db = !db ? (new _defaultDB()) : db;
  this.address = signer.address;
  const __network = this.network = networks[this.chainId];

  const _gasLimit = this.gasLimit = gasLimit || _utils.big('4000000'); // 4 million
  const _api = api || `https://${__network}.api.fuel.sh/`;
  const __post = postDecoder(_post || axios.post);

  // API endpoint check
  if (_api[_api.length - 1] !== '/') {
    throw new Error('API endpoint must end in a "/"');
  }

  // Post
  this.post = __post;

  // get addresses
  const __addresses = (_addresses || addresses)[this.network];
  const __ids = (_ids || ids)[this.network];

  // if provider is given, than continue
  if (provider) {
    __wallet = new ethers.Wallet(signer, provider);
    __fuel = new ethers.Contract(__addresses['fuel'], FuelInterface, __wallet);
  }

  // Token addresses
  this.tokens = __addresses; // get tokens, given chain id

  // Check network chain id ropsten
  types.TypeNetwork(this.chainId);

  // uuid
  const uuid = PubNub.generateUUID();

  // CB, empty callback method
  let __cb = () => {};

  // Listen
  const listen = this.listen = async cb => {
    try {
      if (typeof cb !== 'undefined') {
        types.TypeFunction(cb);
      }

      // Set global cb
      __cb = cb;

      const pubnub = new PubNub({
        subscribeKey: "sub-c-11502102-5035-11ea-814d-0ecb550e9de2",
        uuid,
        // ssl: true, // option to turn that off?
      });

      pubnub.addListener({
        message: async msg => {
          try {
            const result = {
              key: msg.message.title,
              value: msg.message.description,
              _transfer: true,
            };

            // If the key has not been spend already, add it to the db.
            await _db.put(result.key, result.value);

            if (cb) {
              __cb(null, result);
            }
          } catch (error) {
            __cb(error, null);
          }
        },
        error: msg => {
          __cb(msg, null);
        },
      });

      return pubnub.subscribe({
        channels: [
          String('0x' + __chainId + signer.address.slice(2)).toLowerCase(),
        ],
      });
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // Get all available inputs in the wallet
  const inputs = this.inputs = token => new Promise(async (resolve, reject) => {
    // Try
    try {
      let result = {
        rows: [],
        spendableInputs: [],
        withdrawals: [],
        balance: _utils.big(0),
      };

      types.TypeAddress(token);

      // Token ID
      let _tokenID = __ids[String(token).toLowerCase()];

      // Otherwise get the token id
      if (!_tokenID && _tokenID !== 0) {
        if (!provider) {
          throw new Error('You must have a web3 provider `provider` specified in order to sync');
        }

        // token id
        _tokenID = (await __fuel.tokens(token)).toNumber();
      }

      if (!_tokenID) {
        throw new Error('Invalid token does not exist in Fuel.');
      }

      _db
      .createReadStream()
      .on('data', row => {
        if (row.key.indexOf(interfaces.FuelDBKeys.UTXO) === 0
          || row.key.indexOf(FuelDBKeys.mempool + interfaces.FuelDBKeys.UTXO.slice(2)) === 0) {
          const decoded = structs.decodeUTXORLP(row.value);

          if (String(decoded.proof.tokenID.toNumber()).toLowerCase() === String(_tokenID).toLowerCase()) {
            // Decode Amount and increase baance..
            result.balance = result.balance.add(decoded.proof.amount);

            // Create UTXO
            const utxoProof = new structs.UTXOProof(decoded.proof);

            // Input
            let input = null;

            if (utxoProof.type === interfaces.FuelInputTypes.UTXO) {
              input = new structs.TransactionInputUTXO({
                utxoID: utxoProof.hash,
                witnessReference: 0,
              });
            }

            if (utxoProof.type === interfaces.FuelInputTypes.Change) {
              input = new structs.TransactionInputChange({
                utxoID: utxoProof.hash,
                witnessReference: 0,
              });
            }

            // Push Decoded Row.
            result.spendableInputs.push({ input,
                amount: decoded.proof.amount, key: row.key });
            result.rows.push({ key: row.key, value: row.value, decoded,
              amount: decoded.proof.amount, input, utxoProof });
          }
        }

        if (row.key.indexOf(interfaces.FuelDBKeys.Deposit) === 0) {
          const decoded = structs.decodeDepositRLP(row.value);

          if (String(decoded.proof.token).toLowerCase() === String(token).toLowerCase()) {
            // Decode Amount and increase baance..
            result.balance = result.balance.add(decoded.proof.amount);

            // Input
            const input = new structs.TransactionInputDeposit({
              depositHashID: structs.constructDepositHashID(decoded.proof),
              witnessReference: 0,
            });

            // Push Decoded Row
            result.spendableInputs.push({ input, amount: decoded.proof.amount, key: row.key });
            result.rows.push({ key: row.key, value: row.value, amount: decoded.proof.amount, decoded, input });
          }
        }

        // Withdrawals
        if (row.key.indexOf(interfaces.FuelDBKeys.withdrawal) === 0
          || row.key.indexOf(interfaces.FuelDBKeys.mempool
              + interfaces.FuelDBKeys.withdrawal.slice(2)) === 0) {
          const decoded = structs.decodeUTXORLP(row.value);
          const utxoProof = new structs.UTXOProof(decoded.proof);

          // Decode Amount and increase baance..
          result.balance = result.balance.sub(decoded.proof.amount);

          if (String(decoded.proof.tokenID.toNumber()).toLowerCase() === String(_tokenID).toLowerCase()) {
            result.withdrawals.push({
              key: row.key, value: row.value, decoded, utxoProof,
            });
          }
        }
      })
      .on('end', () => resolve(result))
      .on('error', reject)
      .on('close', reject);
    } catch (error) {
      reject(new errors.ByPassError(error));
    }
  });

  // This will get the wallet balance of a specific token
  this.balance = async token => {
    types.TypeAddress(token);

    // will calculate balance of all tokens held in the wallet
    const { balance } = await inputs(String(token).toLowerCase());

    // big 0
    return balance;
  };

  // withdrawalss
  this.withdrawals = async (token, index = 0) => {
    try {
      types.TypeAddress(token);
      if (typeof index !== 'undefined') { types.TypeNumber(index); }

      return (await inputs(token)).withdrawals[index] || null;
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // this will get all account information for the provided signer key
  const sync = this.sync = async (opts = {}) => {
    try {
      types.TypeObject(opts);

      // Clear DB
      await _db.clear();

      // API Accounts
      const results = await __post(`${_api}account`, {
        address: String(signer.address).toLowerCase(),
      });

      // if no results / stop routine.
      if (!results) { return; }

      // keys
      const keys = results[0];
      const values = results[1];

      // Load synced DB into wallet..
      for (let resultIndex = 0; resultIndex < keys.length; resultIndex++) {
        if (keys[resultIndex].indexOf(interfaces.FuelDBKeys.mempool) === 0) {
          await _db.put('0x' + keys[resultIndex].slice(4), values[resultIndex]);
        } else {
          await _db.put(keys[resultIndex], values[resultIndex]);
        }
      }

      // Account for spends during sync..
      for (let resultIndex = 0; resultIndex < keys.length; resultIndex++) {
        if (keys[resultIndex].indexOf(interfaces.FuelDBKeys.mempoolSpend) === 0) {
          await _db.del(interfaces.FuelDBKeys.UTXO + keys[resultIndex].slice(4));
          await _db.del(interfaces.FuelDBKeys.Deposit + keys[resultIndex].slice(4));
        }
      }

      return keys;
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // Make a conractual deposit
  this.faucet = async (opts = {}) => {
    try {
      types.TypeObject(opts);

      // Init keys
      const _initKeys = await this.sync();

      // this will faucet the initial amount
      const result = await __post(`${_api}faucet`, {
        address: signer.address,
      });

      // Process
      let ping = true;
      let clock = 0;
      const timeout = _receiptTimeout || 100000; // 100 seconds

      // Ping
      while (ping) {
        const keys = await sync();

        // Key length change, this should be changed to detect faucet tx
        if (_initKeys.length !== keys.length) {
          ping = false;
        } else {
          await _utils.wait(opts.wait || 2000);
          clock += 4000;
        }

        if (clock > timeout) {
          ping = false;
          throw new Error('Timeout while waiting for faucet, try again!');
        }
      }
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // block number
  this.blockNumber = async() => {
    try {
      // Get block number from API
      const result = await __post(`${_api}get`, {
        key: interfaces.FuelDBKeys.blockTip,
      });

      // Block Number from API
      return _utils.big(result);
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // block number
  this.tokenID = async token => {
    try {
      types.TypeAddress(token);

      // Get block number from API
      const result = await __post(`${_api}get`, {
        key: interfaces.FuelDBKeys.tokenID + String(token).toLowerCase().slice(2),
      });

      // Block Number from API
      return _utils.big(result);
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // Resolve From address
  const resolveFrom = opts => opts.from ? Promise.resolve(opts.from)
    : (new Promise((resolve, reject) => _provider.getAddress()
    .then(accounts => resolve(accounts[opts.accountIndex || 0]))
    .catch(reject)));

  // Make a deposit from a Metamask or Injected provider like environment..
  this.deposit = async (amount, token, opts = {}) => {
    try {
      // AM
      const am = _utils.big(amount);
      types.TypeAddress(token);
      types.TypeObject(opts);

      // RPC
      if (!provider) {
        throw new Error('You must specify a provider for the wallet');
      }

      // Get from account
      // const _from = await resolveFrom(opts);
      let approvalReceipt = null;

      // token ethers.
      const __token = new ethers.Contract(token, ERC20Interface, __wallet);

      // Handle ERC20
      if (String(token).toLowerCase() !== _utils.emptyAddress) {
        const approveTxHash = await __token.approve(__addresses.fuel, am, {
          gasLimit: _gasLimit.toHexString(),
        });
        approvalReceipt = await approveTxHash.wait(opts.confirmations || 5);

        /*()
        const approveTxHash = await _rpc('eth_sendTransaction', Object.assign({
          to: token,
          value: _utils.big(0).toHexString(),
          gasLimit: _gasLimit.toHexString(),
          data: ERC20Interface.functions.approve.encode([__addresses.fuel, am]),
        }, _ignoreFrom ? {} : { from: _from }));
        approvalReceipt = await _getReceipt(approveTxHash);
        if (_utils.big(approvalReceipt.status).eq(0)) {
          throw new Error(`While approving ERC20 Fuel transfer of token ${token} with amount ${amount} there was an error, receipt 0 status.`);
        }*/
      }

      const depositTxHash = await __fuel.deposit(signer.address, token, am, {
        value: String(token).toLowerCase() === _utils.emptyAddress ? am.toHexString() : _utils.big(0).toHexString(),
        gasLimit: _gasLimit.toHexString(),
      });
      const depositReceipt = await depositTxHash.wait(opts.confirmations || 5);

      /*
      // Handle Send Transaction
      const depositTxHash = await _rpc('eth_sendTransaction', Object.assign({
        to: __addresses.fuel,
        value: String(token).toLowerCase() === _utils.emptyAddress ? am.toHexString() : _utils.big(0).toHexString(),
        gasLimit: _gasLimit.toHexString(),
        data: FuelInterface.functions.deposit.encode([signer.address, token, am]),
      }, _ignoreFrom ? {} : { from: _from }));
      const depositReceipt = await _getReceipt(depositTxHash);
      if (_utils.big(depositReceipt.status).eq(0)) {
        throw new Error(`While depositing token ${token} into Fuel with amount ${am.toHexString()} there was an error, receipt 0 status.`);
      }
      */

      const tokenID = await __fuel.tokens(token);

      // Get token ID
      /*
      const tokenID = _utils.big(await _rpc('eth_call', {
        to: __addresses.fuel,
        data: FuelInterface.functions.tokens.encode([token]),
      }));
      */

      // Construct Deposit Hash
      const depositHashID = structs.constructDepositHashID({
        account: signer.address,
        token: token,
        ethereumBlockNumber: _utils.big(depositReceipt.blockNumber),
      });

      const _key = interfaces.FuelDBKeys.Deposit + depositHashID.slice(2);
      const _value = _utils.RLP.encode([
        signer.address,
        token,
        _utils.big(depositReceipt.blockNumber).toHexString(),
        _utils.big(tokenID.toNumber()).toHexString(),
        am.toHexString(),
      ]);

      // add deposit to db
      await _db.put(_key, _value);

      // wait for deposit has to come in
      let depositUTXOSynced = null;
      const timeout = _utils.unixtime() + (opts.timeout || _utils.minutes(5));
      while (!depositUTXOSynced) {
        depositUTXOSynced = ((await __post(`${_api}get`, {
          key: interfaces.FuelDBKeys.deposit + depositHashID.toLowerCase().slice(2),
        })) || [])[1]; // the actual utxo, null if not available

        if (_utils.unixtime() > timeout) {
          throw new Error('Timeout while waiting for deposit, please sync again');
        }

        await _utils.wait(100);
      }

      // Make callback for the tx
      __cb(null, {
        key: _key,
        value: _value,
        _deposit: true,
      });

      // Return positive result..
      return {
        depositHashID,
        key: interfaces.FuelDBKeys.Deposit + depositHashID.slice(2),
        account: signer.address,
        token,
        ethereumBlockNumber: _utils.big(depositReceipt.blockNumber),
        depositReceipt: depositReceipt,
        approvalReceipt: approvalReceipt,
      };
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  const tokenA = _utils.big(2);
  const tokenB = _utils.big(3);

  const rate = this.rate = async (amount, tokenAAddress, tokenBAddress) => {
    try {
      const am = _utils.big(amount);
      types.TypeAddress(tokenAAddress);
      types.TypeAddress(tokenBAddress);

      let [
        reserveAAmount,
        reserveBAmount,
        reserveAUTXO,
        reserveBUTXO,
        poolOwner,
      ] = await __post(`${_api}get`, { key: interfaces.FuelDBKeys.swap });

      reserveAAmount = _utils.big(reserveAAmount);
      reserveBAmount = _utils.big(reserveBAmount);

      // Get token ID
      const tokenAID = await this.tokenID(tokenAAddress);
      const tokenBID = await this.tokenID(tokenBAddress);

      const inputReserve = tokenAID.eq(tokenA) ? reserveAAmount : reserveBAmount;
      const outputReserve = tokenAID.eq(tokenA) ? reserveBAmount : reserveAAmount;

      // if we were swapping moon to brick (brick is output)
      const inputAmount = am;
      const inputAmountWithFee = inputAmount.mul(997); // input * 997;
      const numerator = inputAmountWithFee.mul(outputReserve);
      const denominator = (inputReserve.mul(1000)).add(inputAmountWithFee);
      const amountToSend = numerator.div(denominator);

      return amountToSend;
    } catch (error) {
      throw new Error(error);
    }
  };

  const swap = this.swap = async (amount, tokenAAddress, tokenBAddress, opts = {}) => {
    const am = _utils.big(amount);
    types.TypeAddress(tokenAAddress);
    types.TypeAddress(tokenBAddress);
    types.TypeObject(opts);
    const { spendableInputs, balance } = await this.inputs(tokenAAddress);

    // get the pool/reserve details
    let [
      reserveAAmount,
      reserveBAmount,
      reserveAUTXO,
      reserveBUTXO,
      poolOwner,
    ] = await __post(`${_api}get`, { key: interfaces.FuelDBKeys.swap });

    // Grab the first 8
    const inputBatch = spendableInputs
      .filter(v => v.input.utxoID !== reserveAUTXO && v.input.utxoID !== reserveBUTXO)
      .slice(0, 6);
    let batchBalance = _utils.big(0);

    // Calc batch balsance
    for (let i = 0; i < inputBatch.length; i++) {
      batchBalance = batchBalance.add(inputBatch[i].amount);
    }

    // If Amount is greater than the balance.. throw!
    if (am.gt(balance)) {
      throw new Error('Swap amount greater than total account balance.');
    }

    // If Amount is greater than the balance.. throw!
    if (am.gt(batchBalance)) {
      throw new Error('Invalid swap, amount greater than total batch balance. Do a small transfer to yourself first to compress inputs.');
    }

    // Does the tx have change!
    const changeAmount = batchBalance.sub(amount);

    // Get token ID
    const tokenAID = await this.tokenID(tokenAAddress);
    const tokenBID = await this.tokenID(tokenBAddress);

    if (!tokenAID.eq(tokenA) && !tokenAID.eq(tokenB)) {
      throw new Error('Invalid token A, can only be ID 2 or 3');
    }

    if (!tokenBID.eq(tokenA) && !tokenBID.eq(tokenB)) {
      throw new Error('Invalid token B, can only be ID 2 or 3');
    }

    reserveAAmount = _utils.big(reserveAAmount);
    reserveBAmount = _utils.big(reserveBAmount);

    const inputReserve = tokenAID.eq(tokenA) ? reserveAAmount : reserveBAmount;
    const outputReserve = tokenAID.eq(tokenA) ? reserveBAmount : reserveAAmount;

    // if we were swapping moon to brick (brick is output)
    const inputAmount = am;
    const inputAmountWithFee = inputAmount.mul(997); // input * 997;
    const numerator = inputAmountWithFee.mul(outputReserve);
    const denominator = (inputReserve.mul(1000)).add(inputAmountWithFee);
    const amountToSend = numerator.div(denominator);

    const _inputs = [
      new structs.TransactionInputUTXO({
        utxoID: reserveAUTXO,
        witnessReference: 1,
      }),
      new structs.TransactionInputUTXO({
        utxoID: reserveBUTXO,
        witnessReference: 1,
      }),
      ...inputBatch.map(v => v.input)
    ];

    const outputs = [
      new structs.TransactionOutputUTXO({
        amount: amountToSend,
        owner: this.address,
        tokenID: tokenBID,
      }),
      new structs.TransactionOutputUTXO({
        amount: changeAmount,
        owner: this.address,
        tokenID: tokenAID,
      }),
      new structs.TransactionOutputUTXO({
        amount: reserveAAmount.add(am),
        owner: poolOwner,
        tokenID: tokenAID,
      }),
      new structs.TransactionOutputUTXO({
        amount: reserveBAmount.sub(amountToSend),
        owner: poolOwner,
        tokenID: tokenBID,
      }),
    ];

    // Create unsigned tx..structs
    const unsignedTransaction = new structs.TransactionUnsigned({
      inputs: _inputs,
      outputs,
    });

    // Change UTXO
    const output0 = new structs.UTXOProof({
      transactionHashId: unsignedTransaction.hash,
      outputIndex: 0,
      type: interfaces.FuelOutputTypes.UTXO,
      owner: this.address,
      amount: amountToSend,
      tokenID: tokenBID,
    });
    await _db.put(interfaces.FuelDBKeys.mempool + interfaces.FuelDBKeys.UTXO.slice(2)
        + output0.hash.slice(2), output0.rlp());

    const output1 = new structs.UTXOProof({
      transactionHashId: unsignedTransaction.hash,
      outputIndex: 1,
      type: interfaces.FuelOutputTypes.UTXO,
      owner: this.address,
      amount: changeAmount,
      tokenID: tokenAID,
    });
    await _db.put(interfaces.FuelDBKeys.mempool + interfaces.FuelDBKeys.UTXO.slice(2)
        + output1.hash.slice(2), output1.rlp());

    // delete the inputs from the db
    await _db.batch(inputBatch.map(v => ({
      type: 'del',
      key: v.key,
    })));

    try {
      // Return Transfer..
      const result = await __post(`${_api}swap`, {
        transaction: unsignedTransaction.rlp([
          new structs.TransactionWitness(structs.constructWitness(unsignedTransaction, signer))
        ]),
      });

      if (!result) {
        throw new Error('Problem while transacting with API.');
      }

      // Make callback for the tx
      __cb(null, {
        _transfer: true,
        _swap: true,
      });

      return true;
    } catch (txError) {
      // remove swap utxos
      await _db.del(interfaces.FuelDBKeys.mempool + interfaces.FuelDBKeys.UTXO.slice(2)
          + output0.hash.slice(2));
      await _db.del(interfaces.FuelDBKeys.mempool + interfaces.FuelDBKeys.UTXO.slice(2)
          + output1.hash.slice(2));

      // add back inputs into db
      await _db.batch(inputBatch.map(v => ({
        type: 'put',
        key: v.key,
        value: v.value,
      })));

      throw new ByPassError(txError);
    }
  };

  // Transfer
  const transfer = this.transfer = async (amount, token, recipient, opts = {}) => {
    try {
      const am = _utils.big(amount);
      types.TypeAddress(token);
      types.TypeObject(opts);
      const { spendableInputs, balance } = await inputs(token);

      // Grab the first 8
      const inputBatch = spendableInputs.slice(0, 8);
      let batchBalance = _utils.big(0);

      // Calc batch balsance
      for (let i = 0; i < inputBatch.length; i++) {
        batchBalance = batchBalance.add(inputBatch[i].amount);
      }

      // If Amount is greater than the balance.. throw!
      if (am.gt(balance)) {
        throw new Error('Transfer amount greater than total account balance.');
      }

      // If Amount is greater than the balance.. throw!
      if (am.gt(batchBalance)) {
        throw new Error('Invalid transfer, amount greater than total batch balance. Do two or more smaller transfers.');
      }

      // Does the tx have change!
      const hasChange = batchBalance.sub(amount).gt(0);

      // output
      let primaryOutput = null;
      let primaryOutputProof = null;

      // Get token ID
      const tokenID = await this.tokenID(token);

      // Withdraw
      if (opts.withdraw) {
        primaryOutput = new structs.TransactionOutputWithdrawal({
          owner: recipient,
          amount: am,
          tokenID,
        });
      } else if (opts.htlc) {
        primaryOutput = new structs.TransactionOutputHTLC({
          owner: recipient,
          amount: am,
          tokenID,
          digest: opts.digest,
          expiry: opts.expiry,
          returnWitnessIndex: opts.returnWitnessIndex || 0,
        });
      } else {
        primaryOutput = new structs.TransactionOutputUTXO({
          owner: recipient,
          amount: am,
          tokenID,
        });
      }

      // Create unsigned tx..structs
      const unsignedTransaction = new structs.TransactionUnsigned({
        inputs: inputBatch.map(v => v.input),
        outputs: (hasChange ? [
          new structs.TransactionOutputChange({
            ownerAsWitnessIndex: 0,
            amount: batchBalance.sub(am),
            tokenID,
          }),
        ] : []).concat([ primaryOutput ]),
      });

      // delete the inputs from the db
      await _db.batch(inputBatch.map(v => ({
        type: 'del',
        key: v.key,
      })));

      try {
        // Return Transfer..
        const result = await __post(`${_api}transact`, {
          transaction: unsignedTransaction.rlp([
            new structs.TransactionWitness(structs.constructWitness(unsignedTransaction, signer))
          ]),
        });

        if (!result) {
          throw new Error('Problem while transacting with API.');
        }
      } catch (txError) {
        // add back inputs into db
        await _db.batch(inputBatch.map(v => ({
          type: 'put',
          key: v.key,
          value: v.value,
        })));

        throw new ByPassError(txError);
      }

      // Record withdrawl locally
      if (opts.withdraw) {
        // Change UTXO
        primaryOutputProof = new structs.UTXOProof({
          transactionHashId: unsignedTransaction.hash,
          outputIndex: hasChange ? 1 : 0,
          type: interfaces.FuelOutputTypes.Withdrawal,
          amount: _utils.big(primaryOutput.amount),
          tokenID,
          owner: recipient,
        });

        await _db.put(FuelDBKeys.mempool + interfaces.FuelDBKeys.withdrawal.slice(2)
            + primaryOutputProof.hash.slice(2), primaryOutputProof.rlp());
      }

      // If we send to ourselves.
      if (String(primaryOutput.owner)
        .toLowerCase() === String(signer.address).toLowerCase()) {
        if (opts.withdraw) {
          // Change UTXO
          const entry = new structs.UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: hasChange ? 1 : 0,
            type: interfaces.FuelOutputTypes.Withdrawal,
            amount: batchBalance.sub(am),
            tokenID,
            owner: 0,
          });

          await _db.put(FuelDBKeys.mempool + interfaces.FuelDBKeys.withdrawal.slice(2)
              + entry.hash.slice(2), entry.rlp());
        } else if (opts.htlc) {
          entry = new structs.UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: hasChange ? 1 : 0,
            type: interfaces.FuelOutputTypes.HTLC,
            owner: recipient,
            amount: am,
            tokenID,
            digest: opts.digest,
            expiry: opts.expiry,
            returnWitnessIndex: opts.returnWitnessIndex || 0,
          });

          await _db.put(FuelDBKeys.mempool + interfaces.FuelDBKeys.HTLC.slice(2)
              + entry.hash.slice(2), entry.rlp());
        } else {
          // Change UTXO
          const entry = new structs.UTXOProof({
            transactionHashId: unsignedTransaction.hash,
            outputIndex: hasChange ? 1 : 0,
            type: interfaces.FuelOutputTypes.UTXO,
            owner: recipient,
            amount: am,
            tokenID,
          });

          await _db.put(FuelDBKeys.mempool + interfaces.FuelDBKeys.UTXO.slice(2)
              + entry.hash.slice(2), entry.rlp());
        }
      }

      // Put DB
      if (hasChange) {
        // Change UTXO
        const changeUTXO = new structs.UTXOProof({
          transactionHashId: unsignedTransaction.hash,
          outputIndex: 0,
          type: interfaces.FuelInputTypes.Change,
          amount: batchBalance.sub(am),
          tokenID,
          owner: 0,
        });

        await _db.put(FuelDBKeys.mempool
            + interfaces.FuelDBKeys.UTXO.slice(2)
            + changeUTXO.hash.slice(2), changeUTXO.rlp());

        // Event
        __cb(null, {
          key: FuelDBKeys.mempool
              + interfaces.FuelDBKeys.UTXO.slice(2)
              + changeUTXO.hash.slice(2),
          value: changeUTXO.rlp(),
          _transfer: true,
          _change: true,
        });
      }

      // Make callback for the tx
      __cb(null, {
        _transfer: true,
      });

      // Return
      return {
        unsignedTransaction,
        primaryOutput,
        output: primaryOutput,
        proof: primaryOutputProof,
      };
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // Withdraw
  this.withdraw = async (amount, token, opts = {}) => {
    try {
      const am = _utils.big(amount);
      types.TypeAddress(token);
      types.TypeObject(opts);

      // Withdrawal..
      return await transfer(amount, token, opts.recipient || signer.address, Object.assign(opts, {
        withdraw: true,
      }));
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // Retrive
  this.retrieve = async (token, withdrawalIndex = 0, opts = {}) => {
    try {
      types.TypeHex(token, 20);
      types.TypeNumber(withdrawalIndex);
      types.TypeObject(opts);

      // Check RPC
      if (!_rpc) {
        throw new Error('You must specify a web3 provider to retrieve funds.');
      }

      // Get withdrawal
      const withdrawal = await this.withdrawals(token, withdrawalIndex);

      // If withdrawl doesnt exist
      if (!withdrawal) {
        throw new Error('Withdrawal does not exist! "sync()" wallet or check details.');
      }

      // Withdrawal
      let utxo = await __post(`${_api}get`, {
        key: interfaces.FuelDBKeys.withdrawal + withdrawal.utxoProof.hash.slice(2),
      });

      // Wait for utxo
      while (opts.wait && !(utxo || [])[1]) {
        utxo = await __post(`${_api}get`, {
          key: interfaces.FuelDBKeys.withdrawal + withdrawal.utxoProof.hash.slice(2),
        });
        await _utils.wait(1000);
      }

      // No block
      if (!(utxo || [])[1]) {
        throw new Error('Withdrawal UTXO has not been published to a block and is likely not finalized yet.');
      }

      // Withdraw
      const blockNumber = _utils.big(utxo[1]);
      const transactionRootIndex = _utils.big(utxo[3]).toNumber();
      const transactionIndex = _utils.big(utxo[4]).toNumber(); // 4 is Tx index

      // Get Data for the retrieval..
      const block = await __post(`${_api}get`, {
        key: interfaces.FuelDBKeys.block + _utils.big(blockNumber.toNumber()).toHexString().slice(2),
      });
      const blockTransactionRootHashes = block[4];

      // Root Hash
      const transactionRootHash = blockTransactionRootHashes[transactionRootIndex];
      const transactionRoot = await __post(`${_api}get`, {
        key: interfaces.FuelDBKeys.transactionRoot + transactionRootHash.slice(2),
      });

      // Root Ethereum Tx hash
      const transactionRootTransactionHash = transactionRoot[3];

      // Proof TX / Leafs
      const transactionsData = await transactionsFromReceipt(_rpc,
        transactionRootTransactionHash);
      const transactionLeafs = parseTransactions(transactionsData)
        .map(leafHex => new structs.FillProof(leafHex));

      // Withdrawal Proof
      const proof = new structs.UserWithdrawalProof(new structs.TransactionProof({
        block: new structs.BlockHeader({
          producer: block[0],
          previousBlockHash: block[1],
          ethereumBlockNumber: _utils.big(block[2]),
          blockHeight: _utils.big(block[3]),
          transactionRoots: blockTransactionRootHashes,
        }),
        root: new structs.TransactionRootHeader({
          producer: transactionRoot[0],
          merkleTreeRoot: transactionRoot[1],
          commitmentHash: transactionRoot[2],
          index: _utils.big(transactionRootIndex),
        }),
        merkle: new structs.TransactionMerkleProof({
          transactionLeafs,
          transactionIndex,
        }),
        transaction: new structs.TransactionData({
          inputIndex: 0,
          outputIndex: _utils.big(utxo[0][1]).toNumber(),
          witnessIndex: 0,
          transactionIndex,
          transactionLeaf: transactionLeafs[transactionIndex],
        }),
        proofs: new structs.TransactionProofs([ new structs
            .WithdrawalProof(token) ]),
      }));

      // Proof Submission
      const submitProofTxHash = await _rpc('eth_sendTransaction', Object.assign({
        to: __addresses.fuel,
        value: _utils.big(0).toHexString(), // no ETH required.
        gasLimit: _gasLimit.toHexString(),
        data: FuelInterface.functions.submitProof.encode([proof.encoded]),
      }, _ignoreFrom ? {} : { from: await resolveFrom(opts) }));

      // Get receipt
      const proofReceipt = await _getReceipt(submitProofTxHash);
      if (!proofReceipt.status || _utils.big(proofReceipt.status).eq(0)) {
        throw new Error(`While submitting withdrawal proof to Fuel contract, there was an error, receipt 0 status, hash ${proofReceipt.transactionHash}.`);
      }

      // Remove if success
      await _db.del(withdrawal.key);

      // Make callback for the tx
      __cb(null, {
        _retrieve: true,
      });

      // This will get the funds back to the user..
      return proofReceipt;
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  // Create an HTLC
  this.HTLC = async (amount, token, owner, digest, expiry) => {
    try {
      return;

      const _amount = _utils.big(amount);
      const _expiry = _utils.big(expiry);
      types.TypeAddress(token);
      types.TypeAddress(owner);
      types.TypeHex(digest, 32);
      types.TypeObject(opts);

      // Setup HTLC output
      return await transfer(_amount, token, owner, {
        htlc: true,
        digest,
        expiry: _expiry,
      });
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };

  this.spendHTLC = async (amount, token, owner, utxoId, preImage) => {
    try {
      return;

      const _amount = _utils.big(amount);
      types.TypeAddress(token);
      types.TypeAddress(owner);
      types.TypeHex(utxoId, 32);
      types.TypeHex(preImage, 32);

      // Withdrawal..
      return await transfer(_amount, token, owner, {
        spendHTLC: true,
        utxoID,
        preImage,
      });
    } catch (error) {
      throw new errors.ByPassError(error);
    }
  };
}

module.exports = Wallet;
