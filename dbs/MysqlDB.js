const mysql = require('mysql');
const { ByPassError } = require('../errors/errors');
const types = require('../types/types');

const replaceAll = function (str, find, replace) {
  return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

const _process = require('../config/process');

const emptyConn = { release: () => {} };

// Pooled query or transactional Mysql DB Keystore in the level api format..
// Has a unique ignore (double key prevention) setting, and batch multi-key GET!
function MysqlDB(opts) {
  types.TypeObject(opts);
  const options = Object.assign({
    multipleStatements: true,
    debug:  false,
  }, opts);

  // prefix the table name with the network, this is nasty but whatever..
  const prefixTable = name => {
    if (String(name).indexOf(_process.prefix) === -1) {
      return _process.prefix + String(name);
    }

    return name;
  };

  const table = prefixTable(opts.table || 'keyvalues');
  const batchVolume = opts.batchVolume || 3500;
  const indexValueSQL = opts.indexValue ? ', INDEX (`value`)' : ''; // allows for a more relational push model inside the keyvalue store db
  // dual would only be used for special relational cases ie mongo or mysql..
  delete options.table;
  delete options.batchVolume;
  delete options.indexValue;
  delete options.useQuery;

  // add Table name property..
  this.table = table;

  // Create Pool
  let pool = mysql.createPool(options);
  this.pool = pool;

  // Supports notation
  this.supports = {
    permanence: true,
    bufferKeys: false,
    promises: true,
    secondaryIndexes: true,
    batchReads: true,
    backgroundProcessing: false,
    mysql: true, // added
    multiTableBatch: true, // added
  };

  const _query = this._query = (query, transact) => new Promise((resolve, reject) => {
    pool.getConnection((connectionError, conn) => {
      if (connectionError) {
        // conn.release();
        return reject(connectionError);
      }

      console.log(query.substring(0, 1000), transact);

      console.log(query.length >= 1000 ? query.substring(1000, 2000) : '');

      console.log(query.length >= 2000 ? query.substring(2000, 3000) : '');

      console.log(query);

      if (!transact) {
        conn.query(query, (queryError, results) => {
          conn.release();

          if (queryError) {
            return reject(queryError);
          }

          return resolve(results);
        });
      } else {
        conn.beginTransaction(function(errTx) {
          if (errTx) { conn.release(); return reject(errTx); }

          conn.query(query, function (queryError, results) {
            if (queryError) {
              conn.rollback(function() {
                // conn.release();
                reject(queryError);
              });
            } else {
              conn.commit(function(commitError) {
                if (commitError) {
                  return conn.rollback(function() {
                    conn.release();
                    return reject(commitError);
                  });
                } else {
                  conn.release();
                  return resolve(results);
                }
              });
            }
          });
        });
      }
    });
  });

  const createReadStream = this.createReadStream = (opts = {}) => new Promise((resolve, reject) => {
    pool.getConnection(function(err, conn) {
      if (err) { return reject(err); }

      // this is new, try it out  ORDER BY ${'`'}key${'`'} ASC
      resolve(conn.query(`SELECT * FROM ${table};`).stream().on('end', () => {
        conn.release();
      }));
    });
  });

  const empty = {};
  this.pool = () => pool;
  this.create = () => _query('CREATE TABLE IF NOT EXISTS ' + table +  ' (`key` VARCHAR(128) NOT NULL, `value` VARCHAR(' + (indexValueSQL.length ? '128' : '4000') + ') NOT NULL' + ', PRIMARY KEY (`key`)' + indexValueSQL + ' );');
  this.drop = () => _query(`DROP TABLE ${table};`);
  this.put = (key, value, ignore = true, transact = false) => _query(`${ignore === true ? `DELETE FROM ${table} WHERE ${'`'}key${'`'} = ${mysql.escape(key)}; ` + 'INSERT' : 'INSERT'} INTO ${table} (${'`'}key${'`'},${'`'}value${'`'}) VALUES (${mysql.escape(key)}, ${mysql.escape(value)});`, transact);
  this.del = (key, transact = false) => _query(`DELETE FROM ${table} WHERE ${'`'}key${'`'} = ${mysql.escape(key)};`, transact);
  this.get = (key, transact = false) => _query(`SELECT value FROM ${table} WHERE ${'`'}key${'`'} = ${mysql.escape(key)} UNION SELECT NULL;`, transact)
    .then(v => (v[0] || empty).value || null)
    .catch(e => Promise.reject(e));
  this.keys = value => _query(`SELECT ${'`'}key${'`'} FROM ${table} WHERE ${'`'}value${'`'} = ${mysql.escape(value)};`)
    .then(results => results.map(v => v.key || null))
    .catch(e => Promise.reject(e));
  this.clear = (transact = false) => _query(`TRUNCATE TABLE ${table};`, transact);
  const batch = this.batch = async (_arr, transact = false, results = [], initCount = null) => {
    try {
      // MUST Be right filter..
      const hasGet = _arr.filter(v => v.type === 'get').length > 0;
      const arr = hasGet ? _arr : _arr
        .map(v => (prefixTable(v.table || table)) + v.type + v.key)
        .map((v, i, s) => s.lastIndexOf(v) === i ? i : null)
        .filter(v => v !== null)
        .map(v => _arr[v]);

      if (initCount === null) {
        initCount = arr.length;
      }

      if (arr.length <= 0) {
        const final = results
          .map(v => Array.isArray(v)
            ? ((v[0] ? v[0] : {}).value || null)
            : ((v || {}).value ? v.value : (v || null)));

        if (final.length === 0 && initCount === 1) {
          return [null];
        }

        return final;
      }

      const emptyDel = `DELETE FROM ${table} WHERE ();`;
      let sqlQuery = '';
      let _sqlQuery = '';
      let previousType = null;
      let tables = {};
      const len = (arr.length > batchVolume ? batchVolume : arr.length);

      for (var i = 0; i < len; i++) {
        // Get row specifed table
        const rowTable = prefixTable(arr[i].table || table);

        // Add to tables for empty delete removals later.
        tables[rowTable] = true;

        switch (arr[i].type)  {
          case 'put':
            const delKey = arr[i].ignore === false
              ? ''
              : `${'`'}key${'`'} = ${mysql.escape(arr[i].key)}`;
            const putRowType = rowTable + 'put';

            if (previousType !== putRowType) {
              _sqlQuery += `DELETE FROM ${rowTable} WHERE (${delKey}`;
              sqlQuery += `INSERT INTO ${rowTable}(${'`'}key${'`'},${'`'}value${'`'}) VALUES (${mysql.escape(arr[i].key)},${mysql.escape(arr[i].value)})`;
            } else {
              _sqlQuery += arr[i].ignore === false ? '' : ` OR ${delKey}`;
              sqlQuery += `,(${mysql.escape(arr[i].key)},${mysql.escape(arr[i].value)})`;
            }
            const futurePutRowType = (prefixTable((arr[i + 1] || empty).table || table))
              + (arr[i + 1] || empty).type;

            if (futurePutRowType !== putRowType || (i + 1) === len) {
              _sqlQuery += ');';
              sqlQuery += ';';
            }
            previousType = putRowType;
            break;

          case 'get':
            sqlQuery += `SELECT value FROM ${rowTable} WHERE (${'`'}key${'`'} <=> ${mysql.escape(arr[i].key)});`;
            previousType = rowTable + 'get';
            break;

          case 'del':
            const delRowType = rowTable + 'del';

            if (previousType !== delRowType) {
              sqlQuery += `DELETE FROM ${rowTable} WHERE (${'`'}key${'`'} = ${mysql.escape(arr[i].key)}`;
            } else {
              sqlQuery += ` OR ${'`'}key${'`'} = ${mysql.escape(arr[i].key)}`;
            }
            const futureDelRowType = (prefixTable((arr[i + 1] || empty).table || table))
              + (arr[i + 1] || empty).type;
            if (futureDelRowType !== delRowType || (i + 1) === len) {
              sqlQuery += ');';
            }
            previousType = delRowType;
            break;
        }
      }

      // Remove all empty delete statements
      const preSQLQuery = Object.keys(tables)
         .reduce((acc, tableName) => replaceAll(acc, `DELETE FROM ${tableName} WHERE ();`, ''), _sqlQuery);

      // Tx Results
      const _queryionResults = await _query(preSQLQuery + sqlQuery, transact);
      return await batch(arr.slice(len), transact, results.concat(_queryionResults), initCount);
    } catch (error) {
      throw new ByPassError(error);
    }
  };
}

module.exports = MysqlDB;
