const utils = require('@fuel-js/utils');
const protocol = require('@fuel-js/protocol2');
const _interface = require('@fuel-js/interface');
const memdown = require('memdown');
const ethers = require('ethers');
const database = require('@fuel-js/database');
const streamToArray = require('stream-to-array');
const struct = require('@fuel-js/struct');
const PubNub = require('pubnub');
const { deployments } = require('@fuel-js/contracts');
const abi = require('./abi.json');

// resolve the provider object down to an, Returns: Ethers provider
function resolveProvider(provider = {}) {
  if (typeof provider === 'string') {
    return new ethers.providers.JsonRpcProvider(provider);
  }

  return (provider !== null && provider.send && provider.sendAsync)
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
        // Default to rinkeby
        self.network = { name: 'rinkeby', chainId: 4 };
      }

      // If no provider use the default provider and rinkeby.
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
      || self.network.chainId === 1
      || self.network.chainId === 0, 'only-rinkeby-mainnet-network-supported');

    if (!self.contract) {
      let _contractAddress = deployments.v1[self.network.name]
        || self.options._contract;

      // fetch from the API, namely for testing purposes or the Chain is local / unspecified.
      if (!_contractAddress || self.network.chainId === 0) {
        _contractAddress = await self._fetch({
          key: _interface.db.contract.encode([]),
        });
      }

      let _signer = null;

      try {
        _signer = self.provider.getSigner();

        self.contract = new ethers.Contract(
          _contractAddress,
          abi,
          _signer,
        );
      } catch (err) {
        self.contract = new ethers.Contract(
          _contractAddress,
          abi,
          self.wallet,
        );
      }
    }

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

    // Setup fee enforcement for unspecified and mainnet (rinkeby doesn't have fees).
    if (self.network.chainId === 0 || self.network.chainId === 1) {
      self.feeEnforcement = true;
    }

    // override homestead
    if (self.network.name === 'homestead') {
      self.network.name = 'mainnet';
    }

    // If key override is specified
    if (self.key) {
      self.key = resolveKey(self.key);

      utils.assert(self.address || self.key,
          'no-signer, specify a provider that can sign or a `key`');

      // The wallet account
      self.wallet = new ethers.Wallet(self.key, self.provider);

      // connect key to contract
      self.contract = self.contract.connect(self.wallet);

      if (!self.address && self.key) {
        self.address = self.key.address;
      }
    }
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// _sendTransaction, send transaction as account, handle two key scenario
Wallet.prototype._sendTransaction = async function (opts = {}) {
  const self = this;

  if (self.key) {
    return await self.wallet.sendTransaction(opts);
  }

  if (self.provider._web3Provider) {
    // Get the signer from the provider.
    const _signer = self.provider.getSigner();
  
    // Return send tx result.
    return await _signer.sendTransaction(opts);
  } else {
    // Return send tx result.
    return await self.provider.sendTransaction(opts);
  }
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

function fixNetworkName(name = '') {
  return name === 'homestead' ? 'mainnet' : name;
}

// _fetch, fetch data from the api provider, Returns: Array, RLP Decoded
Wallet.prototype._fetch = async function (obj = {}, opts = {}) {
  try {
    const self = this;
    const path = opts.path || '/get';

    // Root api path
    const root = self.options.path || `https://${fixNetworkName(self.network.name)}.api.fuel.sh/v1`;

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
  const self = this;

  try {
    const options = self._options({ timeout: 600, ...opts });
    await self._setup();

    const funnel = await self.contract.funnel(self.address);
    let transferTx = null;

    if (!opts.skipTransfer) {
      // handle Ether or Transfer
      if (utils.bigNumberify(token).eq(0)) {
        // Sending transaction.
        transferTx = await self._sendTransaction({
          to: funnel,
          value: amount,
          ...filterOptions(options),
        });

        // Wait on this transfer.
        transferTx = await transferTx.wait();
      } else {
        let _signer = self.wallet;

        if (self.provider._web3Provider) {
          // Get the signer from the provider.
          _signer = self.provider.getSigner();
        }

        // Transfering token.
        transferTx = await Token(token, _signer)
          .transfer(funnel, amount, filterOptions(options));

        // Transfer.
        transferTx = await transferTx.wait();
      }

      // Emit a deposit tx.
      self._emit('deposit-funnel-receipt', transferTx);
    }

    let depositTx = await self.contract.deposit(
      self.address,
      token,
      filterOptions(options),
    );
    depositTx = await depositTx.wait();

    // Deposit commitmen 
    self._emit('deposit-commmitment-receipt', depositTx);

    if (!options.timeout) return depositTx;

    const timeout = utils.timestamp().toNumber() + ((options.timeout || 600) * 1000);

    let i = utils.timestamp().toNumber();

    while (i < timeout) {
      try {
        const depositForm = protocol.deposit.Deposit(await self._get([
          _interface.db.deposit2,
          self.address,
          await self._tokenId(token),
          depositTx.logs[0].blockNumber,
        ]));

        await self.sync();
        self._emit('deposit', depositForm.object());

        return new TransactionSubmission({
          receipts: [
            transferTx,
            depositTx,
          ],
        });
      } catch (error) {}

      // wait 5 seconds
      await utils.wait(5000);

      // Set timestamp.
      i = utils.timestamp().toNumber();
    }

    // timeout
    throw new Error('deposit timed out');
  } catch (error) {
    self._emit('error', error);
    throw new utils.ByPassError(error);
  }
}

function determinePreImage(preimages = [], digest = '0x') {
  for (const preimage of preimages) {
    if (utils.sha256(preimage) === digest) {
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
    const isWithdraw = options.retrieve ? 1 : 0;
    const tokenMin = options.anytoken ? 0 : tokenId;
    const tokenMax = options.anytoken ? '0xFFFFFFFF' : tokenId;

    // Handle Inputs Restriction
    if (options.inputs) {
      utils.assert(options.inputs.length <= 8, 'inputs-length-overflow');
    }

    // get the current block number for understanding HTLC's
    const _state = await self._state();
    const _blockNumber = _state.properties.blockNumber().get(); // await self.provider.getBlockNumber();

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
      if (!options.preimages) {
        if (_type === protocol.inputs.InputTypes.HTLC) continue;
      }

      if (inputs.length >= 8 && !options.nolimit) {
        break;
      }

      // decode the entry into UTXO, Deposit or Root
      const decodedInput = self._inputDecoder(type, _isWithdraw, entry.value);
      const inputAddon = decodedInput.getAddon();

      // If the token id is not correct, skip.
      if (!decodedInput.properties.token().get().eq(tokenId)) {
        continue;
      }

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
          }));
          metadata.push(protocol.metadata.Metadata({
            blockHeight: inputAddon.properties.blockHeight().get(),
            rootIndex: inputAddon.properties.rootIndex().get(),
            transactionIndex: inputAddon.properties.transactionIndex().get(),
            outputIndex: inputAddon.properties.outputIndex().get(),
          }));
          balance = balance.add(decodedInput.properties.amount().get());
          break;
        case protocol.inputs.InputTypes.Deposit:
          // Is a deposit.
          if (!isWithdraw) {
            inputs.push(protocol.inputs.InputDeposit({
              witnessReference: 0,
              owner: decodedInput.properties.owner().hex(),
            }));
            metadata.push(protocol.metadata.MetadataDeposit({
              blockNumber: decodedInput.properties.blockNumber().get(),
              token: decodedInput.properties.token().get(),
            }));
            balance = balance.add(decodedInput.properties.value().get());
          } else {
            inputs.push(protocol.inputs.InputTransfer({
              witnessReference: 0,
            }));
            metadata.push(protocol.metadata.Metadata({
              blockHeight: inputAddon.properties.blockHeight().get(),
              rootIndex: inputAddon.properties.rootIndex().get(),
              transactionIndex: inputAddon.properties.transactionIndex().get(),
              outputIndex: inputAddon.properties.outputIndex().get(),
            }));
            balance = balance.add(decodedInput.properties.amount().get());
          }
          break;
        case protocol.inputs.InputTypes.HTLC:
          if (_blockNumber.gt(decodedInput.properties.expiry().get())) {
            inputs.push(protocol.inputs.InputHTLC({
              witnessReference: 0,
              preImage: utils.emptyBytes32,
            }));
            balance = balance.add(decodedInput.properties.amount().get());
          } else {
            if (options.preimages) {
              inputs.push(protocol.inputs.InputHTLC({
                witnessReference: 0,
                preImage: determinePreImage(options.preimages, decodedInput.properties.digest().hex()),
              }));
              balance = balance.add(decodedInput.properties.amount().get());
            }
          }
          if (options.preimages) {
            metadata.push(protocol.metadata.Metadata({
              blockHeight: inputAddon.properties.blockHeight().get(),
              rootIndex: inputAddon.properties.rootIndex().get(),
              transactionIndex: inputAddon.properties.transactionIndex().get(),
              outputIndex: inputAddon.properties.outputIndex().get(),
            }));
          }
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
Wallet.prototype.estimateGasCost = async function (token = '0x', to = '0x', _amount = 0, opts = {}) {
  const self = this;

  return self.transfer(token, to, _amount, {
    ...opts,
    estimateGasCost: true,
  });
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
    utils.assert(utils.hexDataLength(utils.hexlify(token)) > 0, 'token-id-or-address-empty');
    utils.assert(utils.hexDataLength(utils.hexlify(to)) > 0, 'to-address-empty');

    // Use caller witness.
    let useCallerWitness = opts.caller || null;

    // No inputs..
    utils.assert(inputs.length, 'spendable-inputs-underflow');

    // Calculate Change if Any
    let change = balance.sub(amount);

    // The output index of the change.
    let changeOutputIndex = 1;

    // Check return data for invalidity.
    utils.assert(!options.return
      || (utils.hexDataLength(options.return) > 0
      && utils.hexDataLength(options.return) < 512),
      'return-data-overflow');

    // Is HTLC.
    const isHTLC = options.htlc;

    // Main output type.
    let mainOutputType = options.withdraw
      ? 1
      : (isHTLC ? 2 : 0);

    let returnOwner = utils.emptyAddress;
    let expiry = 0;
    let digest = utils.emptyBytes32;

    // HTLC checks.
    if (isHTLC) {
      utils.assert(options.preImage, 'htlc used but no pre-image specified');
      utils.assert(options.expiry, 'htlc used but no expiry specified');

      returnOwner = options.returnOwner || self.address;
      expiry = options.expiry || 0;
      digest = utils.sha256(options.preImage);
    }

    // Build Outputs
    const outputs = opts.outputs || [
      ...(options.withdraw ? [protocol.outputs.OutputWithdraw({
        owner: self.address,
        token: tokenId,
        amount: amount,
      })] : [
          isHTLC
          ? protocol.outputs.OutputHTLC({
            owner: to,
            token: tokenId,
            amount: amount,
            digest,
            expiry,
            returnOwner,
          })
          : protocol.outputs.OutputTransfer({
            owner: to,
            token: tokenId,
            amount: amount,
          })
      ]),
      ...(change.gt(0) ? [protocol.outputs.OutputTransfer({
        noshift: true,
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
    let unsigned = protocol.transaction.Unsigned({
      inputs,
      outputs,
      data,
      signatureFeeToken: 0, // no fee for now
      feeToken: 0, // no fee for now
    });

    // Construct Witness Data
    let witnesses = [];

    // If fee enforcement is turned on, we have to check fees.
    // Than charge the change output appropriately.
    if ((self.feeEnforcement
      && !opts.force
      && !opts.apiKey
      && !self.options.apiKey || opts.estimateGasCost)) {
      let fee = utils.bigNumberify(0);

      // Get the fee for this token type.
      try {
        fee = await self.fee(tokenId);
      } catch (feeError) {
        utils.assert(0, `fee-token-error-${JSON.stringify(feeError)}`);
      }

      // This is just for setting the correct byte length.
      const fakeWitness = useCallerWitness
        ? 25
        : utils.hexlify(utils.randomBytes(66));

      // This is the pretend leaf we use for size calculation.
      const _leaf = protocol.transaction._Transaction({
        metadata: (new Array(inputs.length)).fill('0xFFFFFFFFFFFFFFFF'),
        witnesses: struct.pack(fakeWitness),
        ...unsigned.object(),
      });
      const _leafLength = utils.bigNumberify(
        utils.hexDataLength(_leaf.encodePacked()),
      );
      const feeOwed = _leafLength.mul(fee);

      // Return fee owed, i.e. the estimated gas cost.
      if (opts.estimateGasCost) {
        return feeOwed;
      }

      // Check is there room for change or a fee.
      utils.assert(change.gt(0) || fee.eq(0), 'insufficient-balance-for-fee');

      // If change is available, than we use that to reduce the fee from.
      const changeAmount = protocol.outputs.decodeAmount(
        outputs[changeOutputIndex],
      );
      const changeAmountLength = utils.hexDataLength(changeAmount);

      // Inssuficient change for fee error.
      utils.assert(changeAmount.gte(feeOwed), 'insufficient-change-for-fee');

      // Change amount.
      const adjustedAmount = changeAmount.sub(feeOwed);
      const packed = protocol.outputs.packAmount(
        {
          noshift: true,
          amount: adjustedAmount,
        },
      );

      // Set that outputs amount.
      outputs[changeOutputIndex].properties
        .shift().set(0);
      outputs[changeOutputIndex].properties
        .amount().set(utils.hexZeroPad(adjustedAmount.toHexString(), changeAmountLength));

      // Adjust the change amount.
      change = adjustedAmount;

      // Build a new unsigned tx with the adjusted change amount for the fee.
      unsigned = protocol.transaction.Unsigned({
        inputs,
        outputs,
        data,
        signatureFeeToken: tokenId, // no fee for now
        signatureFee: fee, // no fee for now
      });
    }

    const {
      hash,
    } = protocol.eip712.hash({
      unsigned,
      contract: self.contract,
      chainId: self.network.chainId,
    });

    // This will return the proposed tx id.
    if (opts.transactionId) {
      return hash;
    }

    // Resign this tx.
    if (useCallerWitness) {
      witnesses = [
        protocol.witness.Caller({
          ...opts.caller,
          /*
          ...await opts.caller({
            transactionId: hash,
            unsigned,
            network: self.network,
            address: self.address,
            contract: self.contract,
            chainId: self.network.chainId,
          }),
          */
        }),
      ];
    } else {
      witnesses = [
        await self._sign(unsigned, opts),
      ];
    }

    let addChange = () => {};
    let addSelfTransfer = () => {};

    // build change UTXO for the local database and future spends
    if (to.toLowerCase() === self.address.toLowerCase()) {
      // Build the UTXO proof
      const selfUTXO = protocol.outputs.UTXO({
        transactionHashId: hash,
        outputIndex: 0,
        outputType: mainOutputType,
        owner: self.address,
        token: tokenId,
        amount: amount,
        expiry,
        returnOwner,
        digest,
      });

      addSelfTransfer = () => self.db.put([
        _interface.db.walletInput,
        mainOutputType,
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
        opts.apiKey || self.options.apiKey,
      );
    } else {
      // Send Transaction
      result = await self._fetch({
        unsigned: unsigned.encodeRLP(),
        witnesses: struct.combine(witnesses),
        account: opts.apiKey || self.options.apiKey,
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
Wallet.prototype._state = async function () {
  try {
    const self = this;
    await self._setup();
    return protocol.state.State(await self._get([ _interface.db.state ]));
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

/// @notice Proof from Metadata and Input.
Wallet.prototype.withdrawProofFromMetadata = async function ({ metadata, config }) {
  const self = this;

  const block = await protocol.block.BlockHeader.fromLogs(
      metadata.properties.blockHeight().get().toNumber(),
      config.contract,
  );

  utils.assert(block.properties, 'block-not-found');
  const rootIndex = metadata.properties.rootIndex().get().toNumber();
  const roots = block.properties.roots().get();

  // Check the root index isn't invalid.
  utils.assert(roots[rootIndex], 'roots-index-overflow');

  // Get the root from logs.
  const rootHash = roots[rootIndex];
  const logs = await config.contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      address: config.contract.address,
      topics: config.contract.filters.RootCommitted(rootHash).topics,
  });

  // Check root is real.
  utils.assert(logs.length > 0, 'no-root-available');

  // Parse log and build root struct.
  const log = config.contract.interface.parseLog(logs[0]);
  const root = new protocol.root.RootHeader({ ...log.values });

  // Get the root transaction data.
  const transactionData = await config.contract.provider
      .getTransaction(logs[0].transactionHash);
  const calldata = config.contract.interface.parseTransaction(transactionData)
      .args[3];

  // attempt to decode the root from data.
  const transactions = protocol.root.decodePacked(calldata);

  // Selected transaction index.
  const transactionIndex = metadata.properties.transactionIndex().get();

  // Check index overflow.
  utils.assert(transactions[transactionIndex], 'transaction-index');

  // Check transaction output overflow.
  const transaction = protocol.transaction
      .decodePacked(transactions[transactionIndex]);

  // Check output index overflow.
  const outputIndex = metadata.properties.outputIndex().get();

  // Output index overflow check.
  utils.assert(transaction.outputs[outputIndex], 'output-index-overflow');

  // The output owner.
  let outputOwner = transaction.outputs[outputIndex]
      .properties.owner().hex();

  // If the owner is a ID resolve, otherwise use it.
  if (utils.hexDataLength(outputOwner) !== 20) {
      try {
          outputOwner = await self._get([
              _interface.db.address,
              outputOwner,
          ]);
      } catch (error) {
          utils.assert(0, 'invalid-owner-id');
      }
  }
  
  // Token id.
  let tokenId = transaction.outputs[outputIndex]
      .properties.token().hex();
  let tokenAddress = await self._get([
      _interface.db.token,
      tokenId,
  ]);

  // Return transaction proof.
  return protocol.transaction.TransactionProof({
      block,
      root,
      transactions: transactions
          .map(txHex => protocol.root.Leaf({
              // Trim the length and 0x prefix.
              data: struct.chunk(
              '0x' + txHex.slice(6),
              ),
          })),
      data: [],
      rootIndex,
      transactionIndex,
      inputOutputIndex: outputIndex,
      token: tokenAddress,
      selector: outputOwner,
  });
}

// retrieve, retrieve withdrawals from Fuel, Returns: TransactionResponse
Wallet.prototype.retrieve = async function (opts = {}) {
  try {
    const self = this;
    await self._setup();

    // Sync to grab the latest inputs.
    await self.sync();

    // Get inputs for retrieval.
    const { keys, proofs } = await self._inputs(0, {
      ...opts,
      retrieve: true,
      anytoken: true,
    });

    // Submissions.
    let receipts = [];

    // Go through inputs for withdraw.
    let inputIndex = 0;

    // Go through the proofs.
    for (const input of proofs) {
      // Get withdrawal proof.
      let withdrawTx = await self.contract.withdraw((await self.withdrawProofFromMetadata({
        metadata: protocol.metadata.Metadata(input.getAddon().object()),
        config: {
          contract: self.contract,
        },
      })).encodePacked(), {
        gasLimit: 4000000,
      });

      // Withdraw tx.
      withdrawTx = await withdrawTx.wait();

      // Add to receipts.
      receipts.push(withdrawTx);

      // Delete key from inputs. 
      self.db.del(keys[inputIndex]);

      // Increase the index.
      inputIndex += 1;
    }

    // Transaction submission.
    return new TransactionSubmission({
      receipts,
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
Wallet.prototype.fee = async function (tokenOrId = '0x') {
  try {
    const self = this;
    await self._setup();
    return utils.bigNumberify(await self._get([
        _interface.db.fee,
        await self._tokenId(tokenOrId),
    ]));
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = {
  utils,
  constants,
  Wallet,
};
