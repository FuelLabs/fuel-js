const utils = require('@fuel-js/utils');
const encoding = require('@fuel-js/encoding');

async function batch(db, keys, options = {}) {
  try {
    if (typeof db.supports.mysql === 'object') {
      const table = db.supports.mysql.table;
      const query = keys.map(key => 'SELECT value FROM '
        + (key.table || table)
        + ' WHERE `key`=' + db.supports.mysql.escape(encoding.keyEncoding.encode(key)) + ';').join('');

      return await new Promise((resolve, reject) => db.supports.mysql._query(query,
          (error, results) => {
            if (error) {
              return reject(error);
            }

            resolve(results.map((row, i) => {
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
    let results = [];
    for (const key of keys) {
      results.push({
        key: encoding.keyEncoding.decode(encoding.keyEncoding.encode(key)),
        value: await db.get(key),
      });
    }

    return results;
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = batch;
