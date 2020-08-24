const protocol = require('@fuel-js/protocol');
const interface = require('@fuel-js/interface');
const utils = require('@fuel-js/utils');

// Constructor | network is Ethereum network specifier | base is api base url
function Api(network = 'unspecified', base = '.api.fuel.sh/v1') {
  if (base.slice(-1) === '/') throw new Error('Api base must have no trailing slash');
  const self = this;
  self.url = 'https://' + network + base;
}

// No operation method
const noop = v => v;

// get, general post/get method for api, RLP key specifier, decoder and addon
Api.prototype.get = function(key = '0x', decoderStruct = noop, addon = null) {
  const self = this;
  return utils.fetch(self.url + '/get', { key: utils.RLP.encode(key) })
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
  return utils.fetch(self.url + '/assets', { owner, token, ...opts })
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

Api.prototype.getProfile = function (owner = '0x', opts = {}) {
  const self = this;
  return utils.fetch(self.url + '/profile', { owner, ...opts })
    .then(({ error, result }) => {
      // return error reject
      if (error) return Promise.reject(error);

      // decode
      const [
        assets,
        history,
        ownerId,
      ] = utils.RLP.decode(result);

      // decode and return values
      return decodeHistory(history, self)
        .then(decodedHistory => ({
          assets: decodeAssets(assets),
          history: decodedHistory,
          ownerId: utils.bigNumberify(ownerId),
        }))
        .catch(Promise.reject);
    })
    .catch(error => Promise.reject(error));
};

// getAccount get all inputs for a specific Fuel account / owner
Api.prototype.getHistory = function(owner = '0x', opts = {}) {
  const self = this;
  return utils.fetch(self.url + '/history', { owner, ...opts })
    .then(({ error, result }) => {

      if (error) return Promise.reject(error);
      return decodeHistory(utils.RLP.decode(result), self);
    })
    .catch(error => Promise.reject(error));
}

// getAccount get all inputs for a specific Fuel account / owner
Api.prototype.getAccount = function(owner = '0x', opts = {}) {
  const self = this;
  return utils.fetch(self.url + '/account', { owner, ...opts })
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
Api.prototype.getBalance = function(owner = '0x', token = '0x', opts = {}) {
  const self = this;
  return utils.fetch(self.url + '/balance', { owner, token, ...opts })
    .then(({ result }) => {
      return utils.bigNumberify(utils.RLP.decode(result));
    })
    .catch(error => Promise.reject(error));
}

// Get balance
/*
Api.prototype.getBalance = function(owner = '0x', token = '0x', opts = {}) {
  const self = this;
  return utils.fetch(self.url + '/account', { owner, token, proof: true, ...opts })
    .then(({ result }) => {
      const inputs = utils.RLP.decode(result);
      let balance = utils.bigNumberify(0);

      for (const [key, result] of inputs) {
        const _type = key[4];
        const _isWithdraw = key[5];
        const inputProof = self.decodeInput(_type, _isWithdraw, result);

        balance = balance.add(self.decodeAmount(
          _type,
          _isWithdraw,
          inputProof,
        ));
      }

      return balance;
    })
    .catch(error => Promise.reject(error));
}
*/

// getTransactions, get all transactions in a block root
Api.prototype.getTransactions = function(blockHeight = 0, rootIndex = 0) {
  const self = this;
  return utils.fetch(self.url + '/transactions', { blockHeight, rootIndex })
    .then(({ result }) => {
      const results = utils.RLP.decode(result);
      return results;
    })
    .catch(error => Promise.reject(error));
}

// [ interface.db.spent, key[1], key[3] ]

// getDeposit, get a deposit as specified by etheruem block number, token, owner
Api.prototype.getSpent = function(type = 0, hash = 0) {
  return this.get(interface.db.spent.encode([
    type,
    hash,
  ]));
}

// getDeposit, get a deposit as specified by etheruem block number, token, owner
Api.prototype.getDeposit = function(blockNumber = 0, token = 0, owner = '0x') {
  return this.get(interface.db.deposit.encode([
    blockNumber,
    token,
    owner
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
        const data = transaction.properties.data().get();

        const block = protocol.block.BlockHeader({
          numAddresses: '0xFFFFFFFF',
          numTokens: '0xFFFFFFFF',
        });

        let inputProofs = [];
        let outputProofs = [];

        let inputIndex = 0;
        for (const input of inputs) {
          if (includeInputProofs) {
            const inputType = input.properties.type().get().toNumber();
            if (inputType === protocol.inputs.InputTypes.Deposit) {
              inputProofs.push(await self.getDeposit(
                metadata[inputIndex].properties.blockNumber().get(),
                metadata[inputIndex].properties.token().get(),
                input.properties.owner().get(),
              ));
            } else {
              const isWithdraw = 0;
              inputProofs.push(await self.getInputByHash(
                inputType,
                isWithdraw,
                data[inputIndex],
              ));
            }
          } else {
            inputProofs.push(null);
          }
          inputIndex++;
        }

        let outputIndex = 0;
        let owners = {};
        for (const output of outputs) {
          const outputType = output.properties.type().get().toNumber();
          let token = null, amount = null, owner = null,
            returnOwner = utils.emptyAddress, expiry = 0, digest = utils.emptyBytes32;

          if (outputType !== protocol.outputs.OutputTypes.Return) {
            const ownerData = output.properties.owner().hex();
            if (utils.hexDataLength(ownerData) < 20 && !owners[ownerData]) {
              owners[ownerData] = await self.getAddress(ownerData);
            }
          }

          switch (outputType) {
            case protocol.outputs.OutputTypes.Transfer:
              token = protocol.outputs.decodeToken(output, block);
              amount = protocol.outputs.decodeAmount(output);
              owner = protocol.outputs.decodeOwner(output, block, owners);
              break;

            case protocol.outputs.OutputTypes.Withdraw:
              token = protocol.outputs.decodeToken(output, block);
              amount = protocol.outputs.decodeAmount(output);
              owner = protocol.outputs.decodeOwner(output, block, owners);
              break;

            case protocol.outputs.OutputTypes.HTLC:
              token = protocol.outputs.decodeToken(output, block);
              amount = protocol.outputs.decodeAmount(output);
              owner = protocol.outputs.decodeOwner(output, block, owners);
              returnOwner = protocol.outputs.decodeReturnOwner(output, block, owners);
              expiry = output.properties.expiry().get();
              digest = output.properties.digest().get();
              break;

            case protocol.outputs.OutputTypes.Return:
              break;
          }

          // handle databasing of outputs
          if (outputType !== protocol.outputs.OutputTypes.Return) {
            const utxo = protocol.outputs.UTXO({
              transactionHashId: transactionId,
              outputType,
              outputIndex,
              token,
              amount,
              owner,
              expiry,
              digest,
              returnOwner,
            });
            outputProofs.push(utxo);
          } else {
            outputProofs.push({});
          }
          outputIndex++;
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

Api.prototype.getInputByMetadata = function(type = 0, isWithdraw = 0, blockHeight = 0,
  rootIndex = 0, transactionIndex = 0, outputIndex = 0) {
  const _type = utils.bigNumberify(type).toNumber();
  const _isWithdraw = utils.bigNumberify(isWithdraw).toNumber();
  let decoder = protocol.outputs.UTXO.decodeRLP;
  let addonDecoder = protocol.addons.UTXO;

  if (_type === protocol.inputs.InputTypes.Root) {
    decoder = protocol.root.RootHeader.decodeRLP;
    addonDecoder = protocol.addons.RootHeader;
  }

  if (!_isWithdraw && _type === protocol.inputs.InputTypes.Deposit) {
    decoder = protocol.deposit.Deposit.decodeRLP;
    addonDecoder = noop;
  }

  return this.get(interface.db.inputMetadata.encode([
    _type,
    isWithdraw,
    blockHeight,
    rootIndex,
    transactionIndex,
    outputIndex,
  ]), decoder, addonDecoder);
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

Api.prototype.getInputByHash = async function(type = 0, isWithdraw = 0, hash = '0x') {
  try {
    const _type = utils.bigNumberify(type).toNumber();
    const _isWithdraw = utils.bigNumberify(isWithdraw).toNumber();
    let decoder = protocol.outputs.UTXO.decodeRLP;
    let addonDecoder = protocol.addons.UTXO;

    if (_type === protocol.inputs.InputTypes.Root) {
      decoder = protocol.root.RootHeader.decodeRLP;
      addonDecoder = protocol.addons.RootHeader;

      return await this.get(interface.db.archiveHash.encode([
        _type,
        isWithdraw,
        hash
      ]), decoder, addonDecoder);
    }

    if (!_isWithdraw && _type === protocol.inputs.InputTypes.Deposit) {
      decoder = protocol.deposit.Deposit.decodeRLP;
      addonDecoder = protocol.addons.Deposit;

      return await this.get(interface.db.archiveHash.encode([
        _type,
        isWithdraw,
        hash
      ]), decoder, addonDecoder);
    }

    try {
      return await this.get(interface.db.inputHash.encode([
        _type,
        isWithdraw,
        hash
      ]), decoder, addonDecoder);
    } catch (archiveAttempt) {
      const transactionHashId = await this.get(interface.db.archiveHash.encode([
        _type,
        isWithdraw,
        hash
      ]), utils.RLP.decode);

      const tx = await this.getTransactionByHash(transactionHashId, false);

      let outputIndex = 0;
      for (const utxo of tx.outputProofs) {
        if (utxo.keccak256() === hash) {
          break;
        }
        outputIndex++;
      }

      return tx.outputProofs[outputIndex];
    }
  } catch (error) {
    throw new utils.ByPassError(error);
  }
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
