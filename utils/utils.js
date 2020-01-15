const { utils } = require('ethers');

const abi = new utils.AbiCoder();
const big = (v, f) => utils.bigNumberify(v, f);
const BN = require('bn.js');

// Main vars
const emptyAddress = '0x0000000000000000000000000000000000000000';
const emptyBytes32 = utils.hexZeroPad('0x0', 32);
const RLP = utils.RLP;

// We should only use this once all tests complete (without duck typing)..
// If anything is sucpicious, turn on typing..
function hexToInt(v) {
  // TypeHex(v)
  return +v;
}

// convert bytesnum into number
function bytes(bytesNum) {
  return bytesNum * 2;
}

// Assembly like operators
const eq = (v1, v2) => big(v1).eq(big(v2));
const lt = (v1, v2) => big(v1).lt(big(v2));
const lte = (v1, v2) => big(v1).lte(big(v2));
const gt = (v1, v2) => big(v1).gt(big(v2));
const gte = (v1, v2) => big(v1).gte(big(v2));

// Normalize key
const normalizeKey = key => key.toLowerCase();

// Wait promise
const wait = time => new Promise(res => setTimeout(res, time));

// Unixtime
const unixtime = () => Math.floor((new Date()).getTime() / 1000);

// Minues
const minutes = v => v * 60;

// Ip to Hex
const ipToHex = ip => RLP.encode(ip.split('.')
  .map(v => big(v)));

// Hex to IP
const hexToIP = hex => RLP.decode(hex)
  .reduce((acc, v) => acc + '.' + big(v).toNumber(), '')
  .slice(1);

// RLP
function serializeRLP(arr) {
  return arr.map(v => (typeof v === 'number') ? big(v).toHexString() : v);
}

module.exports = {
  abi,
  big,
  BN,
  emptyAddress,
  emptyBytes32,
  RLP,
  hexToInt,
  bytes,
  eq,
  lt,
  lte,
  gt,
  gte,
  normalizeKey,
  wait,
  unixtime,
  minutes,
  serializeRLP,
  ipToHex,
  hexToIP,
};
