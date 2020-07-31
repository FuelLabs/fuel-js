const utils = require('@fuel-js/utils');

const supported = ['uint', 'bytes', 'address'];
const defaults = type => {
  const length = type.replace(/\D/g,'');
  const arrayish = type.indexOf('[') !== -1;
  let value = null;
  if (type.indexOf('uint') !== -1) value = 0;
  if (type.indexOf('bytes') !== -1) value = utils.hexZeroPad('0x', length);
  if (type.indexOf('address') !== -1) value = utils.hexZeroPad('0x', 20);
  return type.indexOf('[') !== -1 ? [] : value;
};
const even = v => utils.hexDataLength(v) % 2 !== 0 ? v + '00' : v;
const bytes = type => type.replace('uint', 'bytes').replace('address', 'bytes20');

function parse(code = {}) {
  const tuple = code.type.indexOf('tuple') !== -1;
  const array = code.type.indexOf('[') !== -1;
  const components = (tuple && !code.components
      ? utils.parseParamType(code.type)
      : code).components;

  if (tuple && !array) return {
    tuple,
    components: components.map(param => parse(param)),
  };

  const chunks = code.type.split('[');
  const divisor = code.type.slice(0, 2) === 'ui' ? 8 : 1;
  const base = bytes(chunks[0]);
  const chunk = tuple ? `tuple(${code.components.map(v => v.type).join(',')})` : chunks[0];
  const next = [chunk, ...chunks.slice(1).map(v => '[' + v)];
  const lengthSize = array && next[1].indexOf('*') !== -1
    ? next[1].split('*').length - 1
    : 2;

  return {
    code,
    base,
    size: parseInt(base.slice(5), 10) / divisor,
    lengthSize,
    length: array ? (parseInt(next[1].slice(1, -1)) || 0) : 0,
    array,
    next: array ? parse({ type: array ? [next[0], ...next.slice(2)].join('') : next[0] }) : null,
  };
}

// mslice, offset + 2 for 0x prefix, length is double 2 nibbles per byte..
const mslice = (value = '0x', offset = 0, length = 0) => '0x' + value.substr((offset * 2) + 2, length ? length * 2 : undefined);

// convert rolled types to normal types
function convert(types = []) {
  return types.map(v => v.replace('*', ''));
}

function _encode(kinds = [], data = []) {
  let result = '0x';

  for (let i = 0; i < kinds.length; i++) {
    const kind = kinds[i]; // parse(types[i]);
    const param = data[i];

    if (kind.array) {
      const chunks = typeof param === 'string' ? utils.arrayify(param) : param;
      result += kind.length ? ''
        : utils.hexZeroPad(utils.big(chunks.length).toHexString(), kind.lengthSize).slice(2);

      for (const item of chunks) {
        result += _encode([kind.next], [item]).slice(2);
      }
    } else {
      if (kind.tuple) {
        result += _encode(kind.components, param).slice(2);
      } else {
        const _hexed = utils.hexlify(param);
        if (((_hexed.length - 2) / 2) > kind.size) {
          utils.assert(0, 'invalid-encode-value-' + JSON.stringify(kind));
        }
        result += utils.hexZeroPad(_hexed, kind.size).slice(2);
      }
    }
  }

  return result;
}

function typesToKinds(types = [], noParam = false) {
  return types
    .map(type => parse(noParam ? type : utils.parseParamType(type)));
}

const encode = (types = [], data = '0x') => {
  return _encode(typesToKinds(types), data);
}

// decode types, data, should enforce decoding overflow
function _decode(kinds = [], data = '0x', offset = 0) {
  let parsed = [];

  for (const kind of kinds) {
    if (kind.tuple) {
      const [change, items] = _decode(kind.components, data, offset);
      parsed.push(items);
      offset = change;
    } else {
      if (kind.array) {
        let arr = [];
        const length = kind.length || parseInt(mslice(data, offset, kind.lengthSize), 16);
        offset += kind.length > 0 ? 0 : kind.lengthSize;

        for (let index = 0; index < length; index++) {
          const [change, items] = _decode([kind.next], data, offset);
          arr.push(items[0]);
          offset = change;
        }

        parsed.push(arr);
      } else {
        parsed.push(mslice(data, offset, kind.size));
        offset += kind.size;
      }
    }
  }

  return [offset, parsed];
}

const decode = (types = [], data = '0x') => {
  const [offset, decoded] = _decode(typesToKinds(types), data);
  // utils.assert(offset === utils.hexDataLength(data), 'decode-offset-mismatch');
  return decoded;
};

function Coder(types = []) {
  const self = this;
  self.codes = typesToKinds(types);
}

Coder.prototype.encode = function(data = []) {
  const self = this;
  return _encode(self.codes, data);
}

Coder.prototype.decode = function(data = '0x') {
  const self = this;
  const [offset, decoded] = _decode(self.codes, data);

  // console.log(offset, utils.hexDataLength(data));
  // utils.assert(offset === utils.hexDataLength(data), 'decode-offset-mismatch');
  return decoded;
}

module.exports = {
  parse,
  encode,
  decode,
  Coder,
  convert,
  defaults,
};
