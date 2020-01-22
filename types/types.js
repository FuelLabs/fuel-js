const { utils } = require('ethers');
const { TypeError } = require('../errors/errors');

const TypeString = v => {
  if (typeof v !== 'string') { throw new TypeError(new Error(`Invalid value ${v} not type String`)); }
};
const TypeDefined = v => {
  if (typeof v === 'undefined') { throw new TypeError(new Error(`Invalid value ${v} not defined type`)); }
};
const TypeNumber = v => {
  if (typeof v !== 'number') { throw new TypeError(new Error(`Invalid value ${v} not type Number`)); }
};
const TypeBoolean = v => {
  if (typeof v !== 'boolean') { throw new TypeError(new Error(`Invalid value ${v} not type Boolean`)); }
};
const TypeNetwork = v => {
  if ((typeof v !== 'number' || typeof v !== 'string')
  && (String(v) !== '1' && String(v) !== '3' && String(v) !== '10')) {
    throw new TypeError(new Error(`Invalid network chain identifier ${v}, must be 1 for mainnet or 3 for ropsten.`));
  }
};
const TypeAddress = v => {
  if (typeof v !== 'string' || !utils.isHexString(v) || utils.hexDataLength(v) !== 20 ) {
    throw new TypeError(new Error(`Invalid value ${v} not type Address`));
  }
};
const TypeHex = (v, len) => {
  if (typeof v !== 'string' || !utils.isHexString(v) || (len ? utils.hexDataLength(v) !== len : false)) {
    throw new TypeError(new Error(`Invalid value ${v} not type Hex with length ${len}`));
  }
};
const TypeBigNumber = v => {
  if (typeof v !== 'object' || !utils.BigNumber.isBigNumber(v)) {
    throw new TypeError(new Error(`Invalid value ${v} not type BigNumber`));
  }
};
const TypeObject = v => {
  if (typeof v !== 'object') {
    throw new TypeError(new Error(`Invalid value ${v} not type Object`));
  }
};
const TypeDB = v => {
  if (typeof v !== 'object' || !v.put || !v.get || !v.del) {
    throw new TypeError(new Error(`Invalid value ${v} not type DB`));
  }
};
const TypeProvider = v => {
  if (typeof v !== 'object' && !v.sendAsync) {
    throw new TypeError(new Error(`Invalid value ${v} not type Provider`));
  }
};
const TypeFunction = v => {
  if (typeof v !== 'function') {
    throw new TypeError(new Error(`Invalid value ${v} not type Function`));
  }
};
const TypeRPC = v => {
  if (typeof v !== 'function') {
    throw new TypeError(new Error(`Invalid value ${v} not type RPC Function`));
  }
};
const TypeArray = v => {
  if (typeof v !== 'object' && Array.isArray(v)) {
    throw new TypeError(new Error(`Invalid value ${v} not type Array`));
  }
};
const TypeInstance = (v, instanceType) => {
  TypeObject(v);
  if (!(v instanceof instanceType)) {
    throw new TypeError(new Error(`Invalid value ${v} not type Object instance of ${instanceType.name}`));
  }
}

module.exports = {
  TypeDB,
  TypeProvider,
  TypeNetwork,
  TypeFunction,
  TypeRPC,
  TypeArray, TypeInstance,
  TypeString, TypeDefined,
  TypeNumber, TypeBoolean, TypeAddress,
  TypeHex, TypeBigNumber, TypeObject,
};
