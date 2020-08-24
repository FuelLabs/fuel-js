const { test, utils } = require('@fuel-js/environment');

const db = require('@fuel-js/database');
const MemDown = require('memdown');
const streamToArray = require('stream-to-array');
const batch = require('../index');

module.exports = test('check mysql preforms like any other keystore', async t => {
  const mysqldb = db(new MemDown());
  const memorydb = db(new MemDown());

  await mysqldb.clear();
  await memorydb.clear();

  await mysqldb.put(['0xaa'], '0xbb');
  await memorydb.put(['0xaa'], '0xbb');

  const mysqlstream = await streamToArray(await mysqldb.createReadStream());
  const memorystream = await streamToArray(await memorydb.createReadStream());

  t.equalHex(mysqlstream[0].key, utils.RLP.encode(['0xaa']));
  t.equalHex(memorystream[0].key, utils.RLP.encode(['0xaa']));
  t.equalHex(mysqlstream[0].value, '0xbb');
  t.equalHex(memorystream[0].value, '0xbb');

  await mysqldb.put(['0xcc'], '0xee');
  await memorydb.put(['0xcc'], '0xee');

  const mysqlBatch = await batch(mysqldb, [ ['0xcc'], ['0xaa'] ]);
  const memoryBatch = await batch(memorydb, [ ['0xcc'], ['0xaa'] ]);

  t.equalHex(mysqlBatch[0].value, '0xee');
  t.equalHex(memoryBatch[0].value, '0xee');

  t.equalHex(mysqlBatch[1].value, '0xbb');
  t.equalHex(memoryBatch[1].value, '0xbb');

  t.catch(batch(), 'empty batch');

  try {
    await batch(mysqldb, [ ['0xcc'], ['0xff'] ]);
  } catch (error) {
    t.equal(typeof error, 'object', 'invalid batch get sql');
  }

  try {
    await batch(memorydb, [ ['0xcc'], ['0xff'] ]);
  } catch (error) {
    t.equal(typeof error, 'object', 'invalid batch get');
  }

  const fakeMysql = (opts = {}) => ({
    supports: {
      mysql: {
        table: 'table',
        escape: value => value,
        _query: (query, callback) => {
          if (opts.causeError) return callback(new Error('error!'));
          if (opts.noLength) return callback(null, [[], []]);

          callback(null, [[{
            key: '0xcc',
            value: Buffer.from('bb', 'hex'),
          }],
          [{
            key: '0xaa',
            value: Buffer.from('dd', 'hex'),
          }]]);
        },
      },
    },
  });

  t.ok(await batch(fakeMysql(), [ ['0xcc'], ['0xaa'] ]), 'mysql batch');
  t.catch(batch(fakeMysql({ causeError: true }), [ ['0xcc'], ['0xaa'] ]), 'mysql batch');
  t.catch(batch(fakeMysql({ noLength: true }), [ ['0xcc'], ['0xaa'] ]), 'mysql batch');

  await mysqldb.close();
});
