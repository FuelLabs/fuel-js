const coder = require('@fuel-js/rolled');
const utils = require('@fuel-js/utils');

function decompose(value, arrayit) {
  return value.map(v =>
      v._isStruct === true
      ? v.values()
        : (typeof v === 'number'
          ? utils.bigNumberify(v).toHexString()
          : Array.isArray(v)
            ? decompose(v)
            : v._hex // unwind bignumber
              ? (arrayit ? utils.arrayify(v._hex) : v._hex)
              : (arrayit ? utils.arrayify(v) : v)));
}

function hexChunks(strHex, size = 2) {
  const stripped = strHex.slice(2);
  const numChunks = Math.ceil(stripped.length / size);
  const chunks = new Array(numChunks);
  let i = 0, o = 0;
  for (;i < numChunks; ++i, o += size) {
    chunks[i] = '0x' + stripped.substr(o, size);
  }
  return chunks;
}

const noop = v => v;
const pack = (...arr) => hexChunks('0x' + (arr || []).map(v => v._isStruct
  ? v.encodePacked().slice(2) : v.slice(2)).join(''));
const combine = arr => '0x' + (arr || []).map(v => v.encodePacked().slice(2)).join('');
const chunkJoin = arr => '0x' + arr.map(v => v.slice(2)).join('');

function struct(abi = '', filter = null) {
  if (abi.indexOf('tuple(') !== -1) throw new Error('no support for tuples yet');
  const entries = abi.split(',').map(v => v.trim());
  const split = entries.map(v => v.split(' '));
  const types = split.map(v => v[0]);
  const names = split.map((v, i) => v.length > 1 ? v[1] : '_' + i);
  const _coder = new coder.Coder(types);

  function Struct(_values = {}, addon = null, addonDecoder = null) {
    if (!(this instanceof Struct)) return new Struct(_values, addon, addonDecoder);
    const isArray = Array.isArray(_values);
    const values = isArray ? _values : (filter || noop)(_values);
    const self = this;

    self.properties = new StructProperties(isArray
      ? names.map((name, i) => values[i] || coder.defaults(types[i]))
      : names.reduce((acc, name, i) => acc.concat([
        values[name] || coder.defaults(types[i]),
      ]), []));
    self.addonStorage = ((addon || {})._isStruct ? addon.values() : addon)
      || (isArray ? values.slice(types.length) : []);
    self.addonDecoder = addonDecoder;
  }

  function StructProperties(storage = []) {
    const self = this;
    self.storage = storage;
  }

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    StructProperties.prototype[name] = function() {
      const self = this;
      return {
        set: value => {
          self.storage[i] = value;
        },
        keccak256: () => utils.keccak256(self.storage[i]),
        solidityKeccak256: () => utils.solidityKeccak256([types[i]], [self.storage[i]]),
        hex: () => {
          if (Array.isArray(self.storage[i])) {
            return chunkJoin(self.storage[i].map(v => utils.hexlify(v))).toLowerCase();
          }
          return utils.hexlify(self.storage[i]).toLowerCase();
        },
        get: () => types[i].indexOf('int') !== -1
          ? utils.bigNumberify(self.storage[i])
          : (
            types[i].indexOf('1[') !== -1 && typeof self.storage[i] === 'string'
            ? hexChunks(self.storage[i], 2)
            : self.storage[i]
          ),
        index: () => i,
      };
    }
  }

  Struct.prototype.object = function() {
    const self = this;
    return names.reduce((acc, name, i) => Object.assign(acc, {
      [name]: self.properties.storage[i] || coder.defaults(types[i]),
    }), {});
  }

  Struct.prototype.setAddon = function(arr = []) {
    const self = this;
    return (self.addonStorage = ((arr || {})._isStruct ? arr.values() : arr));
  }

  Struct.prototype.getAddon = function() {
    const self = this;
    const decoder = self.addonDecoder || noop;
    return decoder(decompose(self.addonStorage || []));
  }

  Struct.prototype.sizePacked = function() {
    const self = this;
    return utils.hexDataLength(self.encodePacked());
  };

  Struct.prototype._isStruct = true;

  Struct.prototype.types = function() {
    return types;
  };

  Struct.prototype.values = function(arrayify = false, addon = false) {
    const self = this;
    return decompose(self.properties.storage.concat(addon ? self.addonStorage : []), arrayify);
  };

  Struct.prototype.encode = function() {
    const self = this;
    return utils.abi.encode(coder.convert(types), self.values());
  };

  Struct.prototype.decode = function(value = '0x') {
    const self = this;
    return new Struct(utils.abi.decode(coder.convert(types), value));
  };

  Struct.prototype.encodePacked = function() {
    const self = this;
    return _coder.encode(self.values());
  };

  Struct.prototype.decodePacked = function(data = '0x') {
    const self = this;
    return new Struct(_coder.decode(data));
  };

  Struct.prototype.encodePackedBytes = function() {
    const self = this;
    return hexChunks(self.encodePacked(), 2);
  };

  Struct.prototype.packedDataLength = function() {
    const self = this;
    return utils.hexDataLength(self.encodePacked());
  };

  Struct.prototype.keccak256 = function() {
    const self = this;
    return utils.keccak256(self.encode());
  };

  Struct.prototype.keccak256Solidity = function() {
    const self = this;
    return utils.solidityKeccak256(coder.convert(types), self.values());
  };

  Struct.prototype.keccak256Packed = function() {
    const self = this;
    return utils.keccak256(self.encodePacked());
  };

  Struct.prototype.encodeRLP = function() {
    const self = this;
    return utils.RLP.encode(self.values(false, true));
  };

  Struct.prototype.decodeRLP = function(value = '0x', _addonDecoder = null) {
    const self = this;
    return new Struct(utils.RLP.decode(value), null, _addonDecoder);
  };

  Struct.types = () => types;
  Struct.tuple = name => `tuple(${types.join(',')}) ${name}`; // as a tuple
  Struct.decodePacked = (data = '0x') => new Struct(coder.decode(types, data));
  Struct.decodeRLP = (value = '0x', _addonDecoder = null) => new Struct(utils.RLP.decode(value), null, _addonDecoder);
  Struct.decode = (value = '0x') => new Struct(utils.abi.decode(coder.convert(types), value));

  return Struct;
}

module.exports = {
  struct,
  decompose,
  chunk: hexChunks,
  chunkJoin,
  pack,
  combine,
};
