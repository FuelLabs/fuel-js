const protocol = require('@fuel-js/protocol');
const interface = require('@fuel-js/interface');
const utils = require('@fuel-js/utils');

// Constructor | network is Ethereum network specifier | base is api base url
function Api(network = 'unspecified', opts = {}) {
  const { 
    base = '.api.fuel.sh/v1',
    url = null,
  } = opts;

  if (!url && (base || "").slice(-1) === '/') throw new Error('Api base must have no trailing slash');
  const self = this;
  self.url = url || 'https://' + network + base;
}

// No operation method
const noop = v => v;

// Fetch.
const fetch = (url = '', obj = {}) => utils.fetchJson({
  url,
  allowInsecure: true,
}, JSON.stringify(obj));

// fetch with retry
async function fetchRetry(path = '', obj = {}, opts = {}) {
  try {
    const maximumRetries = opts.retries || 10;
    let output = null;
    let error = null;

    // manage 502 retries if they occur
    for (var retry = 0; retry < maximumRetries; retry++) {
      try {

        
        output = await fetch(path, obj);
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

// get, general post/get method for api, RLP key specifier, decoder and addon
Api.prototype.get = function(key = '0x', decoderStruct = noop, addon = null) {
  const self = this;
  return fetchRetry(self.url + '/get', { key: utils.RLP.encode(key) })
    .then(({ error, result }) => {
      if (error) return Promise.reject(error);
      return decoderStruct(result, addon);
    })
    .catch(error => Promise.reject(error));
}

function decodeAssets(rlp = []) {
  let results = [];

  for (const [ token, balance ] of rlp) {
    results.push({
      token: utils.bigNumberify(token),
      balance: utils.bigNumberify(balance),
    });
  }

  return results;
}

// getAccount get all inputs for a specific Fuel account / owner
Api.prototype.getAssets = function(owner = '0x', token = '0x00', opts = {}) {
  const self = this;
  return fetchRetry(self.url + '/assets', { owner, token, ...opts })
    .then(({ error, result }) => {
      if (error) return Promise.reject(error);
      return decodeAssets(utils.RLP.decode(result));
    })
    .catch(error => Promise.reject(error));
}

async function recover(witness = {}, transactionId = '0x', getBlock = noop) {
  switch (witness.properties.type().get().toNumber()) {
    case protocol.witness.WitnessTypes.Signature:
      return utils.recoverAddress(transactionId, utils.joinSignature(witness.object()));
      break;

    case protocol.witness.WitnessTypes.Caller:
      return witness.properties.owner().hex();
      break;

    case protocol.witness.WitnessTypes.Producer:
      return await getBlock().blockProducer().hex();
      break;

    default:
      utils.assert(0, 'invalid-witness-type');
  }
}

// this will resolve the owners, -> to for a transaction for use in metadata
// [ froms, tos, type, token, value ]
Api.prototype.resolveTransaction = async function (opts = {}) {
  const {
    timestamp = utils.bigNumberify(0),
    transactionId = '0x',
    transaction = null, // resolved data for block explorer
  } = opts;
  const self = this;
  let decoded = null;
  let from = [];
  let outputs = [];
  let addonTimestamp = utils.bigNumberify(0);

  if (transaction) {
    // decode and set addon
    decoded = protocol.transaction._Transaction.decodePacked(transaction[0]);
    const addon = protocol.addons.Transaction(transaction);
    decoded.setAddon(addon);

    // if timestamp available
    addonTimestamp = addon.properties.timestamp().get();

    // decode inputs / outputs
    const _inputs = protocol.inputs.decodePacked(decoded.properties.inputs().hex());
    outputs = protocol.outputs.decodePacked(decoded.properties.outputs().hex());

    // decode witnesses
    const _witnesses = protocol.witness.decodePacked(decoded.properties.witnesses().hex());
    const _metadata = protocol.metadata.decodePacked(decoded.properties.metadata().hex(), _inputs);

    // decode blockheight and make get block method
    const blockHeight = addon.properties.blockHeight().get();
    const getBlock = () => self.getBlockByHeight(blockHeight);

    // from
    from = await Promise.all(_witnesses.map(witness => recover(witness, transactionId, getBlock)));
  }

  return {
    timestamp: utils.bigNumberify(timestamp.toNumber() || addonTimestamp.toNumber()),
    transactionId,
    transaction: decoded,
    from,
    outputs,
  };
};

function decodeHistory(rlp = '0x', self = {}) {
  let results = [];

  for (const [ timestamp, transactionId, transaction ] of rlp) {
    results.push(self.resolveTransaction({
      timestamp: utils.bigNumberify(timestamp),
      transactionId,
      transaction, // resolved data for block explorer
    }));
  }

  return Promise.all(results);
}

function sortHistory(results = []) {
  return results.sort((a, b) => {
    return b.timestamp.sub(a.timestamp);
  });
}

// decode deposit data from profiles
function decodeDeposits(deposits) {
  return deposits.map(value => {
    return protocol.deposit.Deposit(
      value,
      null,
      protocol.addons.Deposit,
    );
  });
}

Api.prototype.getProfile = function (owner = '0x', opts = {}) {
  const self = this;
  return fetchRetry(self.url + '/profile', { owner, ...opts })
    .then(({ error, result }) => {
      // return error reject
      if (error) return Promise.reject(error);

      // decode
      const [
        assets,
        history,
        ownerId,
        deposits,
      ] = utils.RLP.decode(result);

      // decode and return values
      return decodeHistory(history, self)
        .then(decodedHistory => ({
          assets: decodeAssets(assets),
          history: sortHistory(decodedHistory),
          ownerId: utils.bigNumberify(ownerId),
          deposits: decodeDeposits(deposits),
        }))
        .catch(Promise.reject);
    })
    .catch(error => Promise.reject(error));
};

// getAccount get all inputs for a specific Fuel account / owner
Api.prototype.getHistory = function(owner = '0x', opts = {}) {
  const self = this;
  return fetchRetry(self.url + '/history', { owner, ...opts })
    .then(({ error, result }) => {

      if (error) return Promise.reject(error);
      return decodeHistory(utils.RLP.decode(result), self);
    })
    .catch(error => Promise.reject(error));
}

// getAccount get all inputs for a specific Fuel account / owner
Api.prototype.getAccount = function(owner = '0x', opts = {}) {
  const self = this;
  return fetchRetry(self.url + '/account', { owner, ...opts })
    .then(({ result }) => {
      if (opts.proof) {
        const inputs = utils.RLP.decode(result);
        let balances = {};
        let inputProofs = [];
        const zero = utils.bigNumberify(0);

        for (const [key, result] of inputs) {
          const _type = key[4];
          const _isWithdraw = key[5];
          const _token = key[2];
          const inputProof = self.decodeInput(_type, _isWithdraw, result);

          // input proofs
          inputProofs.push(inputProof);

          // decode amount
          balances[_token] = (balances[_token] || zero).add(self.decodeAmount(
            _type,
            _isWithdraw,
            inputProof,
          ));
        }

        return {
          address: owner,
          balances,
          inputProofs,
        };
      }

      const results = utils.RLP.decode(result);
      return results.map(result => ({
        type: result[2],
        isWithdraw: result[3],
        hash: result[5],
      }));
    })
    .catch(error => Promise.reject(error));
}

Api.prototype.decodeAmount = function(type = 0, isWithdraw = 0, proof = {}) {
  const _isWithdraw = utils.bigNumberify(isWithdraw).eq(1);

  if (utils.bigNumberify(type).eq(protocol.inputs.InputTypes.Root)) {
    return proof.properties.rootLength().get()
      .mul(proof.properties.fee().get());
  }

  if (_isWithdraw && utils.bigNumberify(type).eq(protocol.inputs.InputTypes.Deposit)) {
    return proof.properties.value().get();
  }

  return proof.properties.amount().get();
}

// Get balance 2
Api.prototype.getBalance = async function(owner = '0x', token = '0x', opts = {}) {
  const self = this;

  // balance
  let balance = 0;
  let balObject = protocol.addons.Balance({});
  try {
    balObject = await self.get(interface.db.balance.encode([
      owner,
      token,
    ]), protocol.addons.Balance.decodeRLP);
    balance = balObject.properties.syncBalance().get();
  } catch (balanceError) {}
  balance = utils.bigNumberify(balance);

  // final bal.
  let finalBalance = 0;

  // If there is a transaction hash id present
  // we use mempool otherwise sync.
  if (balObject.properties.transactionHashId()
    .get() !== utils.emptyBytes32) {
      finalBalance = balObject.properties.mempoolBalance()
        .get();
  } else {
      finalBalance = balObject.properties.syncBalance()
        .get();
  }

  return finalBalance;
}

// getTransactions, get all transactions in a block root
Api.prototype.getTransactions = function(blockHeight = 0, rootIndex = 0) {
  const self = this;
  return fetchRetry(self.url + '/transactions', { blockHeight, rootIndex })
    .then(({ result }) => {
      const results = utils.RLP.decode(result);
      return results;
    })
    .catch(error => Promise.reject(error));
}

// getDeposit, get a deposit as specified by etheruem block number, token, owner
Api.prototype.getSpent = function(type = 0, hash = 0) {
  return this.get(interface.db.spent.encode([
    type,
    hash,
  ]));
}

// getDeposit, get a deposit as specified by etheruem block number, token, owner
Api.prototype.getDeposit = function(blockNumber = 0, token = 0, owner = '0x') {
  return this.get(interface.db.deposit2.encode([
    owner,
    token,
    blockNumber,
  ]), protocol.deposit.Deposit.decodeRLP);
}

Api.prototype.getMempoolTransaction = function(timestamp = '0x', nonce = '0x', transactionId = '0x') {
  const self = this;
  return this.get(interface.db.mempool.encode([
    timestamp,
    nonce,
    transactionId
  ]), protocol.addons.Transaction.decodeRLP);
}

// getTransactionByHash, get a transaction by it's 32 byte transaction Id hash
Api.prototype._transactionToMempoolByHash = function(transactionId = '0x') {
  const self = this;

  return self.get(interface.db.transactionId.encode([ transactionId ]),
    protocol.addons.Transaction.decodeRLP)
    .then(async (transaction = {}) => {
      try {
        const transactionData = transaction.properties.transaction().hex();
        const leaf = protocol.transaction._Transaction.decodePacked(transactionData);
        leaf.setAddon(transaction);

        return leaf;
      } catch (error) {
        throw new utils.ByPassError(error);
      }
    })
    .catch(error => Promise.reject(error));
}

// getTransactionByHash, get a transaction by it's 32 byte transaction Id hash
Api.prototype.getTransactionByHash = function(transactionId = '0x', includeInputProofs = true) {
  const self = this;

  return self.get(interface.db.transactionId.encode([ transactionId ]),
    protocol.addons.Transaction.decodeRLP)
    .then(async (transaction) => {
      try {
        const {
          decoded,
          inputs,
          outputs,
          witnesses,
          metadata,
        } = protocol.transaction.decodePacked(transaction.properties.transaction().hex());
        let inputProofs = transaction.properties.inputProofs().get();
        let outputProofs = transaction.properties.outputProofs().get();

        for (let i = 0; i < inputProofs.length; i++) {
          const input = inputs[i];
          const inputType = input.properties.type().get().toNumber();
          let decoder = protocol.outputs.UTXO.decodeRLP;

          switch (inputType) {
            case protocol.inputs.InputTypes.Transfer:
              decoder = protocol.outputs.UTXO.decodeRLP;
              break;

            case protocol.inputs.InputTypes.Deposit:
              decoder = protocol.deposit.Deposit.decodeRLP;
              break;

            case protocol.inputs.InputTypes.HTLC:
              decoder = protocol.outputs.UTXO.decodeRLP;
              break;

            case protocol.inputs.InputTypes.Root:
              decoder = protocol.root.RootHeader.decodeRLP;
              break;
          }

          inputProofs[i] = decoder(inputProofs[i]);
        }

        for (let i = 0; i < outputProofs.length; i++) {
          const output = outputs[i];
          const outputType = output.properties.type().get().toNumber();
          let decoder = protocol.outputs.UTXO.decodeRLP;

          switch (outputType) {
            case protocol.outputs.OutputTypes.Transfer:
              decoder = protocol.outputs.UTXO.decodeRLP;
              break;

            case protocol.outputs.OutputTypes.Withdraw:
              decoder = protocol.outputs.UTXO.decodeRLP;
              break;

            case protocol.outputs.OutputTypes.HTLC:
              decoder = protocol.outputs.UTXO.decodeRLP;
              break;

            case protocol.outputs.OutputTypes.Return:
              decoder = protocol.root.Leaf;
              break;
          }

          outputProofs[i] = decoder(outputProofs[i]);
        }

        return {
          transactionId,
          decoded,
          inputs,
          outputs,
          witnesses,
          metadata,
          inputProofs,
          outputProofs,
          ...transaction.object()
        };
      } catch (error) {
        return Promise.reject(error);
      }
    })
    .catch(error => Promise.reject(error));
}

// decode an inptu
Api.prototype.decodeInput = function(type = 0, isWithdraw = 0, entry = []) {
  const _type = utils.bigNumberify(type).toNumber();
  const _isWithdraw = utils.bigNumberify(isWithdraw).toNumber();
  if (_type === protocol.inputs.InputTypes.Root) {
    return protocol.root.RootHeader(entry, null, protocol.addons.RootHeader);
  }

  if (!_isWithdraw && _type === protocol.inputs.InputTypes.Deposit) {
    return protocol.deposit.Deposit(entry, null, protocol.addons.Deposit);
  }

  return protocol.outputs.UTXO(entry, null, protocol.addons.UTXO);
}

Api.prototype.getTokenMetadata = async function(id = 0) {
  return protocol.token.decodeTokenMetadata(await this.get(interface.db.tokenMetadata.encode([
    id,
  ]), protocol.token.Token.decodeRLP));
}

Api.prototype.getState = function() {
  return this.get(interface.db.state.encode([]), protocol.state.State.decodeRLP);
}

Api.prototype.getBlockByHeight = function(height = 0) {
  return this.get(interface.db.block.encode([ height ]), protocol.block.BlockHeader.decodeRLP);
}

Api.prototype.getToken = function(id = 0) {
  return this.get(interface.db.token.encode([ id ]), utils.RLP.decode);
}

Api.prototype.getTokenId = function(address = '0x') {
  return this.get(interface.db.tokenId.encode([ address ]), utils.RLP.decode);
}

Api.prototype.getAddress = function(id = 0) {
  return this.get(interface.db.address.encode([ id ]), utils.RLP.decode);
}

Api.prototype.getReturn = function(transactionId = '0x', outputIndex = '0x') {
  return this.get(interface.db.return.encode([ transactionId, outputIndex ]), utils.RLP.decode);
}

Api.prototype.getAddressId = function(address = '0x') {
  return this.get(interface.db.addressId.encode([ address ]), utils.RLP.decode);
}

Api.prototype.getRootByHash = function(hash = '0x') {
  return this.get(interface.db.inputHash.encode([ protocol.inputs.InputTypes.Root, 0, hash ]),
    protocol.root.RootHeader.decodeRLP, protocol.addons.RootHeader);
}

module.exports = Api;
