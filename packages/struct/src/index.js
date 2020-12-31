/* eslint no-underscore-dangle: 0 */
/* eslint prefer-template: 0 */
const coder = require('@fuel-js/rolled');
const utils = require('@fuel-js/utils');
const abi = require('@ethersproject/abi');

function decompose(value, arrayit) {
  return value.map(v => {
    // eslint-disable-next-line
    const result = v._isStruct === true
    // eslint-disable-next-line
      ? v.values()
      // eslint-disable-next-line
      : (typeof v === 'number'
      // eslint-disable-next-line
        ? utils.bigNumberify(v).toHexString()
        // eslint-disable-next-line
        : Array.isArray(v)
        // eslint-disable-next-line
          ? decompose(v)
          // eslint-disable-next-line
          : v._hex // unwind bignumber
            // eslint-disable-next-line
            ? (arrayit ? utils.arrayify(v._hex) : v._hex)
            // eslint-disable-next-line
            : (arrayit ? utils.arrayify(v) : v));
    return result;
  });
}

function hexChunks(strHex, size = 2) {
  const stripped = strHex.slice(2);
  const numChunks = Math.ceil(stripped.length / size);
  const chunks = new Array(numChunks);
  let i = 0;
  let o = 0;
  for (;i < numChunks; i += 1, o += size) {
    chunks[i] = '0x' + stripped.substr(o, size);
  }
  return chunks;
}

const noop = v => v;

const pack = (...arr) => {
  const bytes = arr.map(v => {
    if (v._isStruct) {
      return v.encodePacked().slice(2);
    }

    return v.slice(2);
  });

  return hexChunks('0x' + bytes.join(''));
};
const combine = arr => '0x' + (arr || []).map(v => v.encodePacked().slice(2)).join('');
const chunkJoin = arr => '0x' + arr.map(v => v.slice(2)).join('');

function fragmentToEntries(data = '') {
  const decoded = abi.Fragment.fromString(`function target(${data})`);
  const { inputs } = decoded;
  const output = inputs.map(param => [
    param.format('minimal'),
    param.name,
  ]);

  return output;
}

function componentToType(component = {}) {
  if (component.type === 'tuple') {
    return `tuple(${component.components
      .map(componentToType)
      .join(',')})`;
  }

  return component.type;
}

const defaults = type => {
  const length = type.replace(/\D/g, '');
  // const arrayish = type.indexOf('[') !== -1;
  let value = null;
  if (type.indexOf('tuple') !== -1) {
    return [
      ...utils.parseParamType(type)
        .components
        .map(component => defaults(componentToType(component))),
    ];
  }
  if (type.indexOf('uint') !== -1) value = 0;
  if (type.indexOf('bytes') !== -1) value = utils.hexZeroPad('0x', length || 0);
  if (type.indexOf('address') !== -1) value = utils.hexZeroPad('0x', 20);
  return type.indexOf('[') !== -1 ? [] : value;
};

function struct(abiData = '', filter = null) {
  // if (abi.indexOf('tuple(') !== -1) throw new Error('no support for tuples yet');
  const entries = abiData.split(',').map(v => v.trim());
  let split = entries.map(v => v.split(' '));

  if (abiData.indexOf('tuple(') !== -1) {
    split = fragmentToEntries(abiData);
  }

  const types = split.map(v => v[0]);
  const names = split.map((v, i) => {
    if (v.length > 1) {
      return v[1];
    }
    return '_' + i;
  });
  const _coder = new coder.Coder(types);

  function StructProperties(storage = []) {
    const self = this;
    self.storage = storage;
  }

  function Struct(_values = {}, addon = null, addonDecoder = null) {
    if (!(this instanceof Struct)) return new Struct(_values, addon, addonDecoder);
    const isArray = Array.isArray(_values);
    const values = isArray ? _values : (filter || noop)(_values);
    const self = this;

    self.properties = new StructProperties(isArray
      ? names.map((name, i) => values[i] || defaults(types[i]))
      : names.reduce((acc, name, i) => acc.concat([
        values[name] || defaults(types[i]),
      ]), []));
    self.addonStorage = ((addon || {})._isStruct ? addon.values() : addon)
      || (isArray ? values.slice(types.length) : []);
    self.addonDecoder = addonDecoder;
  }

  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    StructProperties.prototype[name] = function () {
      const self = this;
      return {
        set: value => {
          self.storage[i] = value;
        },
        keccak256: () => utils.keccak256(utils.hexlify(self.storage[i])),
        solidityKeccak256: () => utils.solidityKeccak256([types[i]], [self.storage[i]]),
        hex: () => {
          if (Array.isArray(self.storage[i])) {
            return chunkJoin(self.storage[i].map(v => utils.hexlify(v))).toLowerCase();
          }
          return utils.hexlify(self.storage[i]).toLowerCase();
        },
        get: () => {
          if (types[i].indexOf('tuple') !== -1) {
            return self.storage[i];
          }

          if (types[i].indexOf('int') !== -1) {
            return utils.bigNumberify(self.storage[i]);
          }

          return (types[i].indexOf('1[') !== -1 && typeof self.storage[i] === 'string')
            ? hexChunks(self.storage[i], 2)
            : self.storage[i];
        },
        index: () => i,
      };
    };
  }

  Struct.prototype.object = function () {
    const self = this;
    return names.reduce((acc, name, i) => Object.assign(acc, {
      [name]: self.properties.storage[i] || defaults(types[i]),
    }), {});
  };

  Struct.prototype.setAddon = function (arr = []) {
    const self = this;
    self.addonStorage = ((arr || {})._isStruct ? arr.values() : arr);
  };

  Struct.prototype.getAddon = function () {
    const self = this;
    const decoder = self.addonDecoder || noop;
    return decoder(decompose(self.addonStorage || []));
  };

  Struct.prototype.sizePacked = function () {
    const self = this;
    return utils.hexDataLength(self.encodePacked());
  };

  // eslint-disable-next-line
  Struct.prototype._isStruct = true;

  Struct.prototype.types = function () {
    return types;
  };

  Struct.prototype.values = function (arrayify = false, addon = false) {
    const self = this;
    return decompose(self.properties.storage.concat(addon ? self.addonStorage : []), arrayify);
  };

  Struct.prototype.encode = function () {
    const self = this;
    return utils.abi.encode(coder.convert(types), self.values());
  };

  Struct.prototype.decode = function (value = '0x') {
    return new Struct(utils.abi.decode(coder.convert(types), value));
  };

  Struct.prototype.encodePacked = function () {
    const self = this;
    return _coder.encode(self.values());
  };

  Struct.prototype.decodePacked = function (data = '0x') {
    return new Struct(_coder.decode(data));
  };

  Struct.prototype.encodePackedBytes = function () {
    const self = this;
    return hexChunks(self.encodePacked(), 2);
  };

  Struct.prototype.packedDataLength = function () {
    const self = this;
    return utils.hexDataLength(self.encodePacked());
  };

  Struct.prototype.keccak256 = function () {
    const self = this;
    return utils.keccak256(self.encode());
  };

  Struct.prototype.keccak256Solidity = function () {
    const self = this;
    return utils.solidityKeccak256(coder.convert(types), self.values());
  };

  Struct.prototype.keccak256Packed = function () {
    const self = this;
    return utils.keccak256(self.encodePacked());
  };

  Struct.prototype.encodeRLP = function () {
    const self = this;
    return utils.RLP.encode(self.values(false, true));
  };

  Struct.prototype.decodeRLP = function (value = '0x', _addonDecoder = null) {
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
