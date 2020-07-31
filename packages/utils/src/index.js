// @description general utilities
const { utils } = require('ethers');
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
function hexToInt(v) {
  return +v;
}

// Ip to Hex
function ipToHex(ip) {
  return utils.RLP.encode(ip.split('.')
    .map(v => big(v)));
}

// Hex to IP
function hexToIP(hex) {
  return utils.RLP.decode(hex)
    .reduce((acc, v) => acc + '.' + big(v).toNumber(), '')
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

// @description assert is
function hex(value) {
  return '0x' + value.toString(16);
}

// @descrition assert a value is hex
function assertHex(value, max = 0, min = 0, message = 'hex') {
  if (!utils.isHexString(value)) throw new Error('invalid not type hex');
  if (max > 0 && utils.hexDataLength(value) > max) throw new Error(`${message} ${value} < ${max} bytes`);
  if (min > 0 && utils.hexDataLength(value) < min) throw new Error(`${message} ${value} must be ${max} bytes`);
  return value;
}

const assert = (v, error = 'assertion-failed') => {
  if (!v) {
    const err = new Error(error);
    err.value = v;
    throw err;
  }
};

const assertHexEqual = (v0 = '0x', v1 = '0x', error) => {
  assert(v0.toLowerCase() === v1.toLowerCase(), error);
};

const emptyBytes32 = utils.hexZeroPad('0x0', 32);
const emptyAddress = utils.hexZeroPad('0x0', 20);

const ByPassError = function (error) {
  return error;
}

const day = () => Math.floor(unixtime() / 86400);

const minutes = v => Math.floor(v === undefined ? unixtime() : v / 60);

const noop = () => {};

// micro second timestamp
const timestamp = () => utils.bigNumberify((new Date()).getTime());

// Wait promise
const wait = time => new Promise(res => setTimeout(res, time));

const min = (x, y) => x.lt(y) ? utils.bigNumberify(x) : utils.bigNumberify(y);

const hexDataSub = (data = '0x', pos = 0, len = 0) => {
  assert(pos + len <= data.length * 2, 'hex-data-overflow');
  return '0x' + data.substr((pos * 2) + 2, len ? (len * 2) : undefined);
};

const logMemory = () => {
  const used2 = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used2 * 100) / 100} MB`);
};

const bigstring = v => utils.bigNumberify(v).toString();

const min_num = '0x0000000000000000000000000000000000000000000000000000000000000000';
const max_num = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';

const fetch = (url = '', obj = {}) => utils.fetchJson(url, JSON.stringify(obj));

function hasDuplicates(array = []) {
  return (new Set(array)).size !== array.length;
}

function toLowerCaseHex(array = []) {
  return array.map(v => utils.hexlify(v).toLowerCase());
}

// Ethers Utils + Fuel-Core Utils
module.exports = Object.assign({}, utils, {
  // hex and number handling
  hasDuplicates,
  toLowerCaseHex,
  hexit,
  big,
  hexToInt,
  BN,
  abi,
  hex,
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
  wait
});
