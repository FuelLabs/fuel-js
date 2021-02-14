const utils = require('@fuel-js/utils');
const encoding = require('@fuel-js/encoding');

async function batch(db = {}, keys = [], options = {}) {
  try {
    if (typeof db.supports.mysql === 'object') {
      const { table } = db.supports.mysql;

      // eslint-disable-next-line
      const query = keys.map(key => 'SELECT value FROM '
        // eslint-disable-next-line
        + table
        // eslint-disable-next-line
        + ' WHERE `key`=' + db.supports.mysql.escape(encoding.keyEncoding.encode(key)) + ';').join('');

      // eslint-disable-next-line
      return await new Promise((resolve, reject) => db.supports.mysql._query(query,
        (error, results) => {
          if (error) {
            return reject(error);
          }

          return resolve(results.map((row, i) => {
            if (row.length === 0) {
              return reject(new Error('Invalid Batch Selection'));
            }

            return {
              key: encoding.keyEncoding.decode(encoding.keyEncoding.encode(keys[i])),
              value: encoding.valueEncoding.decode(row[0].value),
            };
          }));
        },
        options.transact));
    }

    // normal batch get sequence
    const results = [];
    for (const key of keys) {
      results.push({
        key: encoding.keyEncoding.decode(encoding.keyEncoding.encode(key)),
        value: await db.get(key, options),
      });
    }

    return results;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = batch;
