const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol');
const _interface = require('@fuel-js/interface');
const abi = require('./abi.json');
const memdown = require('memdown');
const ethers = require('ethers');
const database = require('@fuel-js/database');
const streamToArray = require('stream-to-array');
const struct = require('@fuel-js/struct');
const PubNub = require('pubnub');
const deployments = require('@fuel-js/deployments');

// resolve the provider object down to an, Returns: Ethers provider
function resolveProvider(provider = {}) {
  return (provider !== null && provider.sendAsync)
    ? new ethers.providers.Web3Provider(provider)
    : provider;
}

// if provider && options.key && options.address are all null, create a key
function createKey(provider = null, options = {}) {
  if (!options.key && !options.privateKey && !options.address && !provider) {
    return new utils.SigningKey(utils.randomBytes(32));
  }

  return options.privateKey || null;
}

// resolve a keyish input, SigningKey, Wallet, Uint8Array or Hex, Returns: SingingKey
function resolveKey(key = '0x') {
  if (!key || key === '0x') return null;

  if (typeof key === 'string' || Array.isArray(key)) {
    return new utils.SigningKey(key);
  }

  // is Wallet
  if (key.signingKey) {
    return key.signingKey;
  }

  // is SigningKey
  if (key.signDigest) {
    return key;
  }

  throw new Error('invalid `privateKey`, must be SigningKey, Wallet, Hex or Uint8Array');
}

// constants
const constants = {
  ether: 0,
  faucetToken: 1,
};

// Token, A Token ERC20 Object, Returns ethers.Contract
function Token(address = '0x', provider = {}) {
  return new ethers.Contract(address, abi, provider);
}

function TransactionSubmission(opts = {}) {
  if (!(this instanceof TransactionSubmission)) return new TransactionSubmission(opts);
  const self = this;
  const options = {
    transactionId: null,
    receipts: [],
    ...opts,
  };
  self.transactionId = options.transactionId;
  self.receipts = options.receipts;
}

// Wallet, provider object and options, Constructor
function Wallet(provider = {}, opts = {}) {
  if (!(this instanceof Wallet)) return new Wallet(provider, opts);
  const self = this;
  self.provider = resolveProvider(provider);
  self.network = null;
  self.options = opts;
  self.contract = null;
  self._setupPromise = null;
  self.key = createKey(provider, opts);
  self.db = database(self.options.db || memdown());
  self.listeners = [];
  self._lastSynced = 0;

  // attempt to resolve address if key is present
  if (self.key) {
    self.address = resolveKey(self.key).address;
  }
}

// getNetwork, get the current ethereum network object { name, chainId }
Wallet.prototype.getNetwork = async function (opts = {}) {
  const self = this;
  await self._setup(opts);
  return self.network;
};

// _defer, wait until setup is complete
Wallet.prototype._defer = async function (opts = {}) {
  try {
    const self = this;
    while (!self.address) {
      await utils.wait(10);
    }
    return;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// _setup, setup the wallet with the provider, Returns: Void
Wallet.prototype._setup = function (opts = {}) {
  if (!this._setupPromise) {
    this._setupPromise = this._internalSetup(opts);
  }

  return this._setupPromise;
};

Wallet.prototype._internalSetup = async function (opts = {}) {
  try {
    const self = this;
    // provider
    if (self.provider && !self.options.network) {
      self.network = await self.provider.getNetwork();
    } else {
      // if network override
      if (self.options.network) {
        self.network = utils.getNetwork(self.options.network);
      } else {
        self.network = { name: 'rinkeby', chainId: 4 };
      }

      if (!self.provider) {
        self.provider = ethers.getDefaultProvider('rinkeby');
      }
    }

    self.wallet = self.provider;

    if (self.network.name === 'unknown' || (self.wallet === null)) {
      self.network.name = 'unspecified';
      self.network.chainId = 0;
    }

    utils.assert(self.network.chainId === 4
      || self.network.chainId === 0, 'only-rinkeby-network-supported');

    let _contractAddress = deployments.v1[self.network.name] || self.options._contract;

    // fetch from the API, namely for testing purposes
    if (!_contractAddress) {
      _contractAddress = await self._fetch({ key: _interface.db.contract.encode([]) });
    }

    self.contract = new ethers.Contract(
      _contractAddress,
      abi,
      self.wallet,
    );

    // if listeners have been set, we will subscribe now that self.address is setup
    if (self.listeners.length) {
      self._subscribe();
    }

    // Read-only wallet
    if (self.options.address) {
      // Handle key
      self.address = self.options.address;
      return;
    }

    // handle if no key or address override
    if (!self.key && !self.options.address) {
      // handle if provider is meta provider and has enabled property
      if (self.provider.provider && self.provider.provider.enable) {
        await self.provider.provider.enable();
      }

      // list accounts 0
      self.address = (await self.provider.listAccounts())[0];
    }

    // If key override is specified
    if (self.key) {
      self.key = resolveKey(self.key);

      utils.assert(self.address || self.key,
          'no-signer, specify a provider that can sign or a `key`');

      // The wallet account
      self.wallet = new ethers.Wallet(self.key, self.provider);

      // connect key to contract
      self.contract = new ethers.Contract(
        _contractAddress,
        abi,
        self.wallet,
      );

      if (!self.address && self.key) {
        self.address = self.key.address;
      }
    }
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// _sendTransaction, send transaction as account, handle two key scenario
Wallet.prototype._sendTransaction = function (opts = {}) {
  const self = this;

  if (self.key) {
    return self.wallet.sendTransaction(opts);
  }

  return self.provider.sendTransaction(opts);
}

// _options, Formulate the options object
Wallet.prototype._options = function (opts = {}) {
  const self = this;
  return {
    gasLimit: 2000000,
    ...self.options,
    ...opts,
  };
}

// _emit, emit a typed data to available listeners
Wallet.prototype._emit = async function (type = '', data = {}) {
  const self = this;
  self.listeners
    .map(entry => type === entry.type ? entry.listener(data) : null);
}

async function fetchRetry(path = '', obj = {}, opts = {}) {
  try {
    const maximumRetries = opts.retries || 10;
    let output = null;
    let error = null;

    // manage 502 retries if they occur
    for (var retry = 0; retry < maximumRetries; retry++) {
      try {
        output = await utils.fetch(path, obj);
        break;
      } catch (retryError) {
        // error
        error = retryError;

        // the lambda needs to be woken up..
        if (retryError.statusCode !== 502) {
          throw new utils.ByPassError(retryError);
          break;
        }

        // wait 1 second than try again..
        await utils.wait(1000);
      }
    }

    // if no output after 10 tries, than result the error
    if (!output) {
      throw new utils.ByPassError(error);
    }

    return output;
  } catch (fetchError) {
    throw new utils.ByPassError(fetchError);
  }
}

// _fetch, fetch data from the api provider, Returns: Array, RLP Decoded
Wallet.prototype._fetch = async function (obj = {}, opts = {}) {
  try {
    const self = this;
    const path = opts.path || '/get';

    // Root api path
    const root = self.options.path || `https://${self.network.name}.api.fuel.sh/v1`;

    // fetch
    const {
      error,
      result,
    } = await fetchRetry(`${root}${path}`, obj, opts);

    // if any error
    if (error) throw new Error(error);

    // Decode RLP
    return utils.RLP.decode(result);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// _get, get data from the api provider, Returns: Array, RLP encoded
Wallet.prototype._get = async function (key = [], opts = {}) {
  try {
    const self = this;
    return await self._fetch({
      key: utils.RLP.encode(key[0].encode(key.slice(1))),
    });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// _inputHash, get input hash for a specified input, Returns: Hex, bytes32 hash
Wallet.prototype._inputHash = function (type = 0, input = {}) {
  const _type = utils.bigNumberify(type).toNumber();
  if (_type === protocol.inputs.InputTypes.Root) {
    return input.keccak256Packed();
  }

  return input.keccak256();
};

// _inputDecoder, decode RLP data based upon specified InputType, Returns: Object
Wallet.prototype._inputDecoder = function (type = 0, isWithdraw = 0, data = []) {
  const _type = utils.bigNumberify(type).toNumber();
  const _isWithdraw = utils.bigNumberify(isWithdraw).toNumber();
  let decoder = protocol.outputs.UTXO;
  let addonDecoder = protocol.addons.UTXO;

  if (_type === protocol.inputs.InputTypes.Root) {
    decoder = protocol.root.RootHeader;
    addonDecoder = protocol.addons.RootHeader;
  }

  if (!_isWithdraw && _type === protocol.inputs.InputTypes.Deposit) {
    decoder = protocol.deposit.Deposit;
    addonDecoder = protocol.addons.Deposit;
  }

  return decoder(data, null, addonDecoder);
}

// _getInputByHash, get an input by hash from API or wallet
Wallet.prototype._getInputByHash = async function (type = 0, isWithdraw = 0, hash = '0x', opts = {}) {
  try {
    const self = this;
    const options = {
      fetch: true,
      ...opts,
    };

    let entry = null;

    if (options.fetch) {
      entry = await self._get([
        _interface.db.inputHash,
        type,
        isWithdraw,
        hash,
      ]);
    }

    if (!options.fetch) {
      entry = await self.db._get([
        _interface.db.walletInput,
        type,
        isWithdraw,
        opts.token,
        hash,
      ]);
    }

    return self._inputDecoder(type, isWithdraw, entry);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// sync, sync the wallet object with the API provider
Wallet.prototype.sync = async function (opts = {}) {
  try {
    const self = this;
    await self._setup();
    await self._defer();

    // if no sync requested, stop
    if (opts.sync === false) return;

    // get spendable inputs for this account
    const inputs = await self._fetch({
      owner: self.address,
      proof: true,
    }, { path: '/account' });

    // parse and database spendable inputs
    for (const [key, entry] of inputs) {
      const _type = key[4];
      const _isWithdraw = key[5];
      const _timestamp = utils.bigNumberify(key[3]).toNumber();
      const _hash = key[6];
      let decoded = null;

      try {
        decoded = self._inputDecoder(_type, _isWithdraw, entry);

        // decoded = await self._getInputByHash(_type, _isWithdraw, _hash, value);
      } catch (noSpendableInput) {
        continue;
      }

      if (self.options.spendProtection) {
        try {
          await self._get([ _interface.db.spent, _type, _hash ]);
          continue;
        } catch (noSpendableInput) {
        }
      }

      // set last syneced time
      if (_timestamp > self._lastSynced) {
        self._lastSynced = _timestamp;
      }

      // put
      await self.db.put([
        _interface.db.walletInput,
        _type,
        _isWithdraw,
        (decoded.properties.token
          ? decoded.properties.token().hex() // utxo
          : decoded.properties.feeToken().hex()), // root
        _hash,
      ], decoded);
    }
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

function filterOptions({ gasPrice, gasLimit, from, value, nonce, data }) {
  return {
    ...(gasPrice ? { gasPrice } : {}),
    ...(gasLimit ? { gasLimit } : {}),
    ...(data ? { data } : {}),
    ...(from ? { from } : {}),
    ...(value ? { value } : {}),
    ...(nonce ? { nonce } : {}),
  };
}

// deposit, deposit tokens into Fuel, Returns: Object, TransactionResponse
Wallet.prototype.faucet = async function (opts = {}) {
  try {
    const self = this;
    const options = self._options(opts);
    await self._setup();
    const timeout = utils.timestamp().add(options.timeout || 100000); // 100 seconds

    // faucet
    const [ index, timestamp, nonce ] = await self._fetch({
      owner: self.address,
    }, {
      path: '/faucet',
    });

    // make 10 attempts
    for (;utils.timestamp().lt(timeout);) {
      try {
        try {
          await self._get([ _interface.db.faucet, timestamp, nonce ]);

          // wait two secods on the faucet
          await utils.wait(4000);
        } catch (error) {
          // away for some balance
          const balance = await self.balance(constants.faucetToken);

          // balance
          if (balance.gt(0)) {
            break;
          }
        }
      } catch (error) {
      }
    }
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// deposit, deposit tokens into Fuel, Returns: Object, TransactionResponse
Wallet.prototype.deposit = async function (token = '0x', amount = 0, opts = {}) {
  try {
    const self = this;
    const options = self._options({ timeout: 600, ...opts });
    await self._setup();
    const funnel = await self.contract.funnel(self.address);
    let transferTx = null;

    // handle Ether or Transfer
    if (utils.bigNumberify(token).eq(0)) {
      transferTx = await self._sendTransaction({
        to: funnel,
        value: amount,
        ...options,
      });
      transferTx = await transferTx.wait();
    } else {
      transferTx = await Token(token, self.wallet)
        .transfer(funnel, amount, filterOptions(options));
      transferTx = await transferTx.wait();
    }

    let depositTx = await self.contract.deposit(self.address, token, filterOptions(options));
    depositTx = await depositTx.wait();

    if (!options.timeout) return depositTx;
    const timeout = utils.timestamp() + (options.timeout * 1000);
    for (let i = utils.timestamp(); i < timeout;) {
      try {
        await self._get([
          _interface.db.deposit,
          depositTx.logs[0].blockNumber,
          self.address,
          await self._tokenId(token),
        ]);
        await self.sync();
        return new TransactionSubmission({
          receipts: [
            transferTx,
            depositTx,
          ],
        });
      } catch (error) {}

      // wait 10 seconds
      await utils.wait(10000);
    }

    // timeout
    throw new Error('deposit timed out');
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

function determinePreImage(preimages = [], digest = '0x') {
  for (const preimage of preimages) {
    if (utils.keccak256(preimage) === digest) {
      return preimage;
    }
  }

  utils.assert('no preimages provided, either specify htlc:false or preimages:[] in options');
}

// _inputs, get all inputs in the wallet, filtered by tokenId, Returns: Array, of inputs
Wallet.prototype._inputs = async function (tokenId = 0, opts = {}) {
  try {
    // Setup
    const self = this;
    const options = { htlc: false, ...opts };
    let balance = utils.bigNumberify(0);
    let data = [];
    let inputs = [];
    let metadata = [];
    let keys = [];
    const isWithdraw = options.withdraw ? 1 : 0;
    const tokenMin = options.anytoken ? 0 : tokenId;
    const tokenMax = options.anytoken ? '0xFFFFFFFF' : tokenId;

    // Handle Inputs Restriction
    if (options.inputs) {
      utils.assert(options.inputs.length <= 8, 'inputs-length-overflow');
    }

    // get the current block number for understanding HTLC's
    const _blockNumber = await self.provider.getBlockNumber();

    // If options.inputs, search all, otherwise if withdraw it's 1 or up to 8
    const limit = (options.inputs || !options.htlc ? null : (isWithdraw ? 1 : (options.limit || 8)));

    const proofs = (await streamToArray(self.db.createReadStream({
      gt: _interface.db.walletInput.encode([ 0, isWithdraw, tokenMin, utils.min_num ]),
      lt: _interface.db.walletInput.encode([ 4, isWithdraw, tokenMax, utils.max_num ]),
      ...(limit ? { limit } : {}),
    })));
    const _proofs = [];

    for (const entry of proofs) {
      // Decode Entry Key RLP: TODO, make a .key method for decoding..
      const [index, type, _isWithdraw, token, hash] = utils.RLP.decode(entry.key);
      const _type = utils.bigNumberify(type).toNumber();
      const _inputWithdrawable = utils.bigNumberify(_isWithdraw).toNumber();

      // Filter inputs
      if (options.inputs) {
        if (options.inputs.indexOf(hash) === -1) continue;
      }

      // Is withdraw selected, input not withdraw
      if (isWithdraw && !_inputWithdrawable
        || !isWithdraw && _inputWithdrawable) continue;

      // If no HTLC inputs, filter them out
      if (!options.htlc) {
        if (_type === protocol.inputs.InputTypes.HTLC) continue;
      }

      if (inputs.length >= 8 && !options.nolimit) {
        break;
      }

      // decode the entry into UTXO, Deposit or Root
      const decodedInput = self._inputDecoder(type, _isWithdraw, entry.value);
      const inputAddon = decodedInput.getAddon();

      // If Force inputs, only use inputs we have metadata for
      if (options.force && _type !== protocol.inputs.InputTypes.Deposit) {
        if (inputAddon.properties.blockHeight().lte(0)) continue;
      }

      // Add key
      keys.push(entry.key);

      // Handle Different Type Cases
      switch (_type) {
        case protocol.inputs.InputTypes.Transfer:
          inputs.push(protocol.inputs.InputTransfer({
            witnessReference: 0,
          }))
          metadata.push(protocol.metadata.Metadata({
            blockHeight: inputAddon.properties.blockHeight().get(),
            rootIndex: inputAddon.properties.rootIndex().get(),
            transactionIndex: inputAddon.properties.transactionIndex().get(),
            outputIndex: inputAddon.properties.outputIndex().get(),
          }));
          balance = balance.add(decodedInput.properties.amount().get());
          break;
        case protocol.inputs.InputTypes.Deposit:
          inputs.push(protocol.inputs.InputDeposit({
            witnessReference: 0,
            owner: decodedInput.properties.owner().hex(),
          }))
          metadata.push(protocol.metadata.MetadataDeposit({
            blockNumber: decodedInput.properties.blockNumber().get(),
            token: decodedInput.properties.token().get(),
          }));
          balance = balance.add(decodedInput.properties.value().get());
          break;
        case protocol.inputs.InputTypes.HTLC:
          if (decodedInput.properties.expiry().get().gt(_blockNumber)) {
            inputs.push(protocol.inputs.InputHTLC({
              witnessReference: 0,
              preImage: utils.emptyBytes32,
            }));
          } else {
            inputs.push(protocol.inputs.InputHTLC({
              witnessReference: 0,
              preImage: determinePreImage(options.preimages, decodedInput.properties.digest().hex()),
            }));
          }
          metadata.push(protocol.metadata.Metadata({
            blockHeight: inputAddon.properties.blockHeight().get(),
            rootIndex: inputAddon.properties.rootIndex().get(),
            transactionIndex: inputAddon.properties.transactionIndex().get(),
            outputIndex: inputAddon.properties.outputIndex().get(),
          }));
          balance = balance.add(decodedInput.properties.amount().get());
          break;
        case protocol.inputs.InputTypes.Root:
          inputs.push(protocol.inputs.InputRoot({
            witnessReference: 0,
          }));
          metadata.push(protocol.metadata.Metadata({
            blockHeight: inputAddon.properties.blockHeight().get(),
            rootIndex: inputAddon.properties.rootIndex().get(),
            transactionIndex: 0,
            outputIndex: 0,
          }));
          balance = balance.add(decodedInput.properties.fee().get());
          break;
      }

      // add data hash
      data.push(hash);

      // Return Decoded Input
      _proofs.push(decodedInput);
    }

    return {
      balance,
      metadata,
      inputs,
      proofs: _proofs,
      data,
      keys
    };
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// balance, get the balance of a particular token, Returns: Object, BigNumber balance
Wallet.prototype.balance = async function (token = '0x', opts = {}) {
  try {
    // Setup
    const self = this;
    await self._setup();
    const options = self._options(opts);

    // turn sync off
    await self.sync(options);

    // Get token ID
    const tokenId = await self._tokenId(token);

    // Get Spendable Inputs
    const { balance } = await self._inputs(tokenId, { ...opts, nolimit: true });

    // the final result
    const result = options.format
      ? utils.formatUnits(balance, options.format)
      : balance;

    // Return the balance
    return result;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// sign, use provider or key to sign unsigned payload, Returns: Object, Signature witness
Wallet.prototype._sign = async function (unsigned = {}, opts = {}) {
  try {
    const self = this;
    const options = self._options(opts);
    const key = resolveKey(self.key);
    utils.assert(!options.address, 'this wallet is read-only, remove `address` for a signable wallet');

    const {
      typedData,
      hash,
      message,
    } = protocol.eip712.hash({
      unsigned,
      contract: self.contract,
      chainId: self.network.chainId,
    });

    let signature = null;
    if (key) {
      signature = await key.signDigest(hash);
    }

    if (!key) {

      // we might need to go even more raw here, as there is an extra "from" field in the data
      // to the RPC
      signature = await self.provider.send('eth_signTypedData_v4', [
        self.address,
        JSON.stringify(typedData),
      ]);
    }

    return protocol.witness._Signature({
      ...utils.splitSignature(signature),
    });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// resolve an amount
function resolveAmount(amount = 0, opts = {}) {
  if (opts.units) {
    return utils.parseUnits(amount, opts.units);
  }

  return utils.bigNumberify(amount);
}

// transfer, simple transfer to another account, Returns: TransactionResponse
Wallet.prototype.transfer = async function (token = '0x', to = '0x', _amount = 0, opts = {}) {
  const self = this;

  try {
    // Setup
    await self._setup();
    await self.sync(opts);
    const options = self._options(opts);
    const amount = resolveAmount(_amount, options);

    // Get token ID
    const tokenId = await self._tokenId(token);

    // Get Spendable Inputs
    const { balance, inputs, metadata, data, keys } = await self._inputs(tokenId, opts);

    // Balance check
    utils.assert(amount.gt(0), 'amount-underflow');
    utils.assert(balance.gte(amount), 'not-enough-balance');

    // No inputs..
    utils.assert(inputs.length, 'spendable-inputs-underflow');

    // Calculate Change if Any
    const change = balance.sub(amount);
    utils.assert(!options.return
      || (utils.hexDataLength(options.return) > 0
      && utils.hexDataLength(options.return) < 512),
      'return-data-overflow');

    // Build Outputs
    const outputs = opts.outputs || [
      ...(!options.withdraw ? [protocol.outputs.OutputTransfer({
        owner: to,
        token: tokenId,
        amount: amount,
      })] :  [protocol.outputs.OutputWithdraw({
        owner: self.address,
        token: tokenId,
        amount: amount,
      })]),
      ...(change.gt(0) ? [protocol.outputs.OutputTransfer({
        owner: self.address,
        token: tokenId,
        amount: change,
      })] : []),
      ...(options.return ? [
        protocol.outputs.OutputReturn({
          data: struct.chunk(options.return),
        }),
      ] : []),
    ];

    // Build Unsigned Transaction
    const unsigned = protocol.transaction.Unsigned({
      inputs,
      outputs,
      data,
      signatureFeeToken: 0, // no fee for now
      feeToken: 0, // no fee for now
    });

    const {
      hash,
    } = protocol.eip712.hash({
      unsigned,
      contract: self.contract,
      chainId: self.network.chainId,
    });

    let addChange = () => {};
    let addSelfTransfer = () => {};

    // build change UTXO for the local database and future spends
    if (to.toLowerCase() === self.address.toLowerCase()) {
      // Build the UTXO proof
      const selfUTXO = protocol.outputs.UTXO({
        transactionHashId: hash,
        outputIndex: 0,
        outputType: options.withdraw ? 1 : 0,
        owner: self.address,
        token: tokenId,
        amount: amount,
      });

      addSelfTransfer = () => self.db.put([
        _interface.db.walletInput,
        options.withdraw ? 1 : 0,
        options.withdraw ? 1 : 0,
        tokenId,
        selfUTXO.keccak256(),
      ], selfUTXO);
    }

    // build change UTXO for the local database and future spends
    if (change.gt(0) && !opts.outputs) {
      // Build the UTXO proof
      const changeUTXO = protocol.outputs.UTXO({
        transactionHashId: hash,
        outputIndex: 1,
        outputType: 0,
        owner: self.address,
        token: tokenId,
        amount: change,
      });

      addChange = () => self.db.put([
        _interface.db.walletInput,
        0,
        0,
        tokenId,
        changeUTXO.keccak256(),
      ], changeUTXO);
    }

    // Construct Witness Data
    const witnesses = [await self._sign(unsigned, opts)];

    // this allows for a user to use the raw outputs
    if (opts.raw) {
      return {
        unsigned,
        witnesses,
      };
    }

    // force a transaction on-chain
    if (opts.force) {
      // Transaction
      const transactions = [protocol.transaction.Transaction({
        metadata,
        inputs,
        outputs,
        witnesses,
      })];
      let rootTx = await self.contract.commitRoot(
        protocol.root.merkleTreeRoot(transactions),
        0,
        0,
        struct.combine(transactions),
        filterOptions(options),
      );
      rootTx = await rootTx.wait();

      // Add change to DB
      await addChange();
      await addSelfTransfer();

      // Return Receipt
      return new TransactionSubmission({
        transactionId: hash,
        receipts: [rootTx],
      });
    }

    let result = null;
    if (self.options.transact) {
      // Send Transaction
      result = await self.options.transact(
        unsigned.encodeRLP(),
        struct.combine(witnesses),
      );
    } else {
      // Send Transaction
      result = await self._fetch({
        unsigned: unsigned.encodeRLP(),
        witnesses: struct.combine(witnesses),
      }, {
        path: '/transact',
      });
    }

    // remove input keys
    await self.db.batch(keys.map(v => ({
      type: 'del',
      key: v,
    })));

    // Add change to DB
    await addChange();
    await addSelfTransfer();

    // This should be a TransactionResponse
    return new TransactionSubmission({
      transactionId: hash,
      receipts: [],
    });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// _token, get a token address from id
Wallet.prototype._token = async function (id = '0x') {
  try {
    const self = this;
    await self._setup();
    return await self._get([ _interface.db.token, id ]);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// _tokenId, get the token ID for a given token address, Returns: Object, token id BigNumber
Wallet.prototype._tokenId = async function (tokenOrId = '0x') {
  try {
    const self = this;
    await self._setup();
    const isId = typeof tokenOrId === 'object' || typeof tokenOrId === 'number';
    let id = null;

    // if this is a token id
    if (isId) {
      id = tokenOrId;
    } else {
      if (self.network.name === 'unspecified' || self.network.name === 'unknown') {
        // Attempt to get locally first, than go to big db
        try {
          id = await self.db.get([ _interface.db.tokenId, tokenOrId ]);
        } catch (localGetError) {
          id = await self._get([ _interface.db.tokenId, tokenOrId ]);
        }
      } else {
        id = await self.contract.tokenId(tokenOrId);
      }
    }

    // check for invalid id
    if (utils.bigNumberify(id).eq(0)
      && utils.bigNumberify(tokenOrId).gt(0)
      && !isId) {
      utils.assert(0, 'token-not-registered');
    }

    // add tokenid to local database
    if (!isId) {
      await self.db.put([ _interface.db.tokenId, tokenOrId ], id);
    }

    // id
    return utils.bigNumberify(utils.bigNumberify(id).toNumber());
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// withdraw, make a withdraw transaction on Fuel, Returns: Object, TransactionResponse
Wallet.prototype.withdraw = async function (token = '0x', amount = 0, opts = {}) {
  try {
    const self = this;
    await self._setup();

    return await self.transfer(token, self.address, amount, {
      withdraw: true,
      ...opts,
    });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// retrieve, retrieve withdrawals from Fuel, Returns: TransactionResponse
Wallet.prototype.retrieve = async function (opts = {}) {
  try {
    const self = this;
    await self._setup();
    const inputs = await self._inputs(0, {
      ...opts,
      withdraw: true,
      anytoken: true,
    });

    return new TransactionSubmission({
      receipts: [],
    });
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

const noop = () => {};

Wallet.prototype._subscribe = function () {
  const self = this;

  if (!self._publisher && self.address) {
    const uuid = PubNub.generateUUID();
    self._publisher = new PubNub({
      subscribeKey: "sub-c-11502102-5035-11ea-814d-0ecb550e9de2",
      uuid: uuid
    });

    self._publisher.subscribe({
      channels: ["fuel_v1_" + self.network.name + '_' + self.address.toLowerCase()],
      withPresence: true,
    });

    self._publisher.addListener({
      message: function (response) {
        const [_type, _isWithdraw, _token, _input] = utils.RLP.decode(response.message.content);
        const _decoded = self._inputDecoder(_type, _isWithdraw, utils.RLP.decode(_input));
        self.db.put([
          _interface.db.walletInput,
          _type,
          _isWithdraw,
          _token,
          self._inputHash(_type, _decoded),
        ], _decoded)
        .then(() => {
          self._emit('input', _decoded);
        })
        .catch(error => {
          self._emit('error', error);
        });
      },
    });
  }
}

// on, add an event listener, Returns: Void
Wallet.prototype.on = function (type = 'input', listener = noop) {
  const self = this;
  self.listeners.push({ type, listener });

  // Ensure the wallet is setup, emit error if not
  self._setup()
  .then(() => self._subscribe())
  .catch(error => {
    self._emit('error', error);
  });
}

// on, add an event listener, Returns: Void
Wallet.prototype.off = function (type = 'input', listener = null) {
  const self = this;

  if (listener === null) {
    self.listeners = [];
  } else {
    self.listeners = self.listeners
      .filter(entry => entry.type !== type || entry.listener !== listener);
  }

  // Ensure the wallet is setup, emit error if not
  self._setup()
  .then(() => {
    try {
      if (self.listeners.length <= 0 && self._publisher) {
        self._publisher.unsubscribeAll();
        self._publisher = null;
      }
    } catch (punnubError) {}
  })
  .catch(error => {
    self._emit('error', error);
  });
}

// fee, get the fee for a given token, Returns: Void
Wallet.prototype.fee = async function (token = '0x') {
  try {
    const self = this;
    await self._setup();
    return utils.bigNumberify(0);
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = {
  utils,
  constants,
  Wallet,
};
