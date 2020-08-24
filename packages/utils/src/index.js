const { utils, constants } = require('ethers');
const BN = require('bn.js');

// Shorthand ABI coder
const abi = new utils.AbiCoder();

// Shorthand bigNumberify
const big = (v, f) => utils.bigNumberify(v, f);

// @param v array or value
// @return all values in all arr depths hexlify
function hexit(v) {
  return Array.isArray(v)
    ? v.map(hexit)
    : utils.hexlify(v);
}

// @param v small hex values
// @return integer
function hexToInt(v = '0x') {
  if (v === '0x') {
    return 0;
  }

  return +v;
}

// Ip to Hex
function ipToHex(ip = '0.0.0.0') {
  return utils.RLP.encode(ip.split('.')
    .map(v => big(v)));
}

// Hex to IP
function hexToIP(value = '0xc400000000') {
  return utils.RLP.decode(value)
    .reduce((acc, v) => `${acc}.${utils.bigNumberify(v).toNumber()}`, '')
    .slice(1);
}

// @return full precision time
function time() {
  return (new Date()).getTime();
}

// @return standard unixtime
function unixtime() {
  return Math.round(time() / 1000);
}

const assert = (v = false, error = 'assertion-failed') => {
  if (!v) {
    const err = new Error(error);
    err.value = v;
    throw err;
  }
};

// @descrition assert a value is hex
function assertHex(value, max = 0, min = 0, message = 'hex') {
  assert(utils.isHexString(value), 'hex-string');
  if (max > 0 && utils.hexDataLength(value) > max) throw new Error(`${message} ${value} < ${max} bytes`);
  if (min > 0 && utils.hexDataLength(value) < min) throw new Error(`${message} ${value} must be ${max} bytes`);
  return value;
}

const assertHexEqual = (v0 = '0x', v1 = '0x', error = 'assertHexEqual') => {
  assert(utils.hexlify(v0).toLowerCase() === utils.hexlify(v1).toLowerCase(), error);
};

const emptyBytes32 = constants.HashZero; // utils.hexZeroPad('0x0', 32);
const emptyAddress = constants.AddressZero; // utils.hexZeroPad('0x0', 20);

function ByPassError(error) {
  return error;
}

const day = () => Math.floor(unixtime() / 86400);

const minutes = v => Math.floor((v === undefined ? unixtime() : v) / 60);

const noop = () => {};

// micro second timestamp
const timestamp = () => utils.bigNumberify((new Date()).getTime());

// Wait promise
const wait = (_time = 0) => new Promise(res => setTimeout(res, _time));

// BigNumberify Min method
const min = (x, y) => utils.bigNumberify(x.lt(y) ? x : y);

// Hex Data Sub
const hexDataSub = (data = '0x', pos = 0, len = 0) => {
  assert(pos + len <= (data.length - 2) / 2, 'hex-data-overflow');

  // eslint-disable-next-line
  return '0x' + data.substr((pos * 2) + 2, len ? (len * 2) : undefined);
};

const logMemory = (_console = console) => {
  const used2 = process.memoryUsage().heapUsed / 1024 / 1024;
  _console.log(`The script uses approximately ${Math.round(used2 * 100) / 100} MB`);
};

const bigstring = (v = 0) => utils.bigNumberify(v).toString();

// '0x0000000000000000000000000000000000000000000000000000000000000000';
const min_num = constants.HashZero;
// '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
const max_num = constants.MaxUint256;

const fetch = (url = '', obj = {}) => utils.fetchJson(url, JSON.stringify(obj));

function hasDuplicates(array = []) {
  return (new Set(array)).size !== array.length;
}

function toLowerCaseHex(array = []) {
  return array.map(v => utils.hexlify(v).toLowerCase());
}

// Ethers Utils + Fuel-Core Utils
module.exports = {
  // ethers.js full utils, eventually let's break this up
  ...utils,

  // hex and number handling
  hasDuplicates,
  toLowerCaseHex,
  hexit,
  big,
  hexToInt,
  BN,
  abi,
  assertHex,
  emptyBytes32,
  emptyAddress,
  ByPassError,
  min,
  hexDataSub,
  assert,
  bigstring,
  assertHexEqual,
  min_num,
  max_num,
  fetch,

  // ip
  ipToHex,
  hexToIP,

  // time
  time,
  unixtime,
  day,
  minutes,
  timestamp,
  logMemory,

  // handy
  noop,
  wait,
};
