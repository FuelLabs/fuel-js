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

Api.prototype.getTokenMetadata = async function(id = 0) {
  return await protocol.token.decodeTokenMetadata(await this.get(interface.db.tokenMetadata.encode([
    id,
  ]), protocol.token.Token.decodeRLP));
}

function inputObject(kind = 0, data = {}) {
}

function outputObject(kind = 0, data = {}) {
}

Api.prototype.getTransactionById = async function(transactionId = '0x') {
  const data = (await this.get(interface.db.transaction.encode([
    transactionId,
  ]), protocol.addons.Transaction.decodeRLP));

  // The result data.
  const result = {
    transactionId,
    timestamp: data.timestamp,
    raw: data.data,
    inputs: data.inputTypes.map((kind, index) => {
      return inputObject(kind, data.inputProofs[index]);
    }),
    outptus: [],
  };

  return result;
}

Api.prototype.getState = async function() {
  return (await this.get(interface.db.state.encode([]), protocol.state.State.decodeRLP)).object();
}

Api.prototype.getBlockByHeight = async function(height = 0) {
  return (await this.get(interface.db.block.encode([ height ]), protocol.block.BlockHeader.decodeRLP))
    .object();
}

Api.prototype.getToken = async function(id = 0) {
  return await this.get(interface.db.token.encode([ id ]), utils.RLP.decode);
}

Api.prototype.getTokenId = async function(address = '0x') {
  return await this.get(interface.db.tokenId.encode([ address ]), utils.RLP.decode);
}

Api.prototype.getAddress = async function(id = 0) {
  return await this.get(interface.db.address.encode([ id ]), utils.RLP.decode);
}

Api.prototype.getReturn = async function(transactionId = '0x', outputIndex = '0x') {
  return await this.get(interface.db.return.encode([ transactionId, outputIndex ]), utils.RLP.decode);
}

Api.prototype.getAddressId = async function(address = '0x') {
  return await this.get(interface.db.addressId.encode([ address ]), utils.RLP.decode);
}

Api.prototype.getRootByHash = async function(hash = '0x') {
  return (await this.get(interface.db.inputHash.encode([ protocol.inputs.InputTypes.Root, 0, hash ]),
    protocol.root.RootHeader.decodeRLP, protocol.addons.RootHeader)).object();
}

module.exports = Api;
