const { test } = require('@fuel-js/environment');
const utils = require('../index');

module.exports = test('utils', async t => {
  t.ok(!utils.hasDuplicates(), 'hasDuplicates');
  t.ok(utils.hasDuplicates([0, 1, 0]), 'hasDuplicates');
  t.ok(!utils.hasDuplicates([0, 1, 2]), 'hasDuplicates');
  t.ok(utils.hasDuplicates(['0x00', '0x0a', '0x00']), 'hasDuplicates');

  t.equal(utils.toLowerCaseHex(['0xAA']), ['0xaa'], 'toLowerCaseHex');
  t.equal(utils.toLowerCaseHex(['0xaa']), ['0xaa'], 'toLowerCaseHex');
  t.equal(utils.toLowerCaseHex(['0x']), ['0x'], 'toLowerCaseHex');
  t.equal(utils.toLowerCaseHex(), [], 'toLowerCaseHex');

  t.equalRLP(utils.hexit([utils.big(0), '0xaa', ['0xbb']]), ['0x00', '0xaa', ['0xbb']], 'hexit');
  t.equalRLP(utils.hexit([]), [], 'hexit');

  t.equalBig(utils.big('0xaa'), utils.bigNumberify('0xaa'), 'big');

  t.ok(new utils.BN('aa', 16), 'BN');

  t.equal(utils.hexToInt('0x0a'), 10, 'hex to int');
  t.equal(utils.hexToInt('0x00'), 0, 'hex to int');
  t.equal(utils.hexToInt('0x0'), 0, 'hex to int');
  t.equal(utils.hexToInt('0x'), 0, 'hex to int');
  t.equal(utils.hexToInt(), 0, 'hex to int');

  t.ok(utils.abi, 'abi');

  t.ok(utils.assertHex('0xaa', 1, 1, 'one-byte'), 'assertHex');
  t.ok(utils.assertHex('0x', 0, 0, 'zero-byte'), 'assertHex');
  t.throws(() => utils.assertHex('0xaabb', 1, 1, 'max-overflow'), 'assertHex');
  t.throws(() => utils.assertHex('0xaa', 2, 4, 'min-underflow'), 'assertHex');
  t.throws(() => utils.assertHex(''), 'assertHex');

  t.equalHex(utils.emptyBytes32, utils.hexZeroPad('0x00', 32), 'emptyBytes32');
  t.equalHex(utils.emptyAddress, utils.hexZeroPad('0x00', 20), 'emptyAddress');
  t.equalHex(utils.max_num, '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    'max_num');
  t.equalHex(utils.min_num, utils.hexZeroPad('0x00', 32), 'min_num');

  t.equal(utils.ByPassError(new Error('helloworld')).message, 'helloworld', 'ByPassError');
  t.equalBig(utils.min(utils.bigNumberify(30), utils.bigNumberify(29)), 29, 'min');
  t.equalBig(utils.min(utils.bigNumberify(29), utils.bigNumberify(30)), 29, 'min');

  t.equalBig(utils.hexDataSub('0xaabbccdd', 1, 2), '0xbbcc', 'hexDataSub');
  t.throw(() => utils.hexDataSub('0xaabbccdd', 1, 4), 'hex-data-overflow');
  t.throw(() => utils.hexDataSub('0xaabbccddd', 1, 4), 'hex-data-overflow');
  t.equal(utils.hexDataSub('0xaabbccdddd', 1, 4), '0xbbccdddd', 'hexDataSub');
  t.throw(() => utils.hexDataSub('0xaa', 2, 0), 'hex-data-overflow');
  t.throw(() => utils.hexDataSub('0x', 1, 0), 'hex-data-overflow');
  t.equal(utils.hexDataSub('0x', 0, 0), '0x', 'hexDataSub');
  t.equal(utils.hexDataSub(), '0x', 'hexDataSub');

  t.ok(typeof utils.assert(true, 'good') === 'undefined', 'assert');
  t.throws(() => utils.assert(false, 'bad'), 'assert');
  t.throws(() => utils.assert(false, 'bad'), 'assert');
  t.throws(() => utils.assert(0, 'bad'), 'assert');
  t.throws(() => utils.assert(), 'assert');

  t.equalBig(utils.bigstring(utils.bigNumberify(0)), '0', 'bigstring');
  t.equalBig(utils.bigstring(utils.bigNumberify(2)), '2', 'bigstring');
  t.equalBig(utils.bigstring(), '0', 'bigstring');
  t.equalBig(utils.bigstring(utils.bigNumberify('0xaabb')), '43707', 'bigstring');

  t.ok(typeof utils.assertHexEqual('0xaa', '0xaa') === 'undefined', 'assertHexEqual');
  t.ok(typeof utils.assertHexEqual('0xaa', '0xAA') === 'undefined', 'assertHexEqual');
  t.ok(typeof utils.assertHexEqual('0x', '0x') === 'undefined', 'assertHexEqual');
  t.ok(typeof utils.assertHexEqual('0x0', '0x00') === 'undefined', 'assertHexEqual');
  t.ok(typeof utils.assertHexEqual('0x', '0x') === 'undefined', 'assertHexEqual');
  t.ok(typeof utils.assertHexEqual() === 'undefined', 'assertHexEqual');
  t.throw(() => utils.assertHexEqual('0xaa', '0xBB'), 'assertHexEqual');
  t.throws(() => utils.assertHexEqual(''), 'not-hex-value');

  t.ok(await utils.fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR', {}), 'fetch');
  // t.throws(() => utils.fetch(), 'fetch');

  try {
    await utils.fetch();
  } catch (error) {
    t.ok(error, 'fetch');
  }

  t.equal(utils.ipToHex('0.0.0.0'), utils.RLP.encode(['0x0', '0x0', '0x0', '0x0']), 'ipToHex');
  t.equal(utils.ipToHex(), utils.RLP.encode(['0x0', '0x0', '0x0', '0x0']), 'ipToHex');

  t.equal(utils.hexToIP(utils.RLP.encode(['0x0', '0x0', '0x0', '0x0'])), '0.0.0.0', 'hexToIP');
  t.equal(utils.hexToIP(), '0.0.0.0', 'hexToIP');

  t.ok(utils.time() >= (new Date()).getTime() - 100, 'time');
  t.ok(utils.unixtime() >= Math.round(utils.time() / 1000) - 100, 'unixtime');

  t.doesNotThrow(() => utils.wait(), 'wait');
  t.doesNotThrow(() => utils.wait(1000), 'wait');

  t.equal(utils.day(), Math.floor(utils.unixtime() / 86400), 'day');
  const timeValue = utils.unixtime();
  t.equal(utils.minutes(), Math.floor(utils.unixtime() / 60), 'minutes');
  t.equal(utils.minutes(timeValue), Math.floor(timeValue / 60), 'minutes');

  t.ok(utils.timestamp(), 'timestamp');
  t.ok(typeof utils.logMemory() === 'undefined', 'logMemory');

  t.ok(typeof utils.noop() === 'undefined', 'noop');
});
