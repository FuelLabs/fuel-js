const mysql = require('mysql2');
const { ByPassError } = require('../errors/errors');
const types = require('../types/types');

const replaceAll = function (str, find, replace) {
  return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

// Pooled transactional Mysql DB Keystore in the level api format..
// Has a unique ignore (double key prevention) setting, and batch multi-key GET!
function MysqlDB(opts) {
  types.TypeObject(opts);
  const options = Object.assign({
    multipleStatements: true,
    debug:  false,
    // flags: '-FOUND_ROWS,IGNORE_SPACE',
    // ssl: { ca: fs.readFileSync(__dirname + '/mysql-ca.crt') },
  }, opts);
  const table = opts.table || 'keyvalues';
  const batchVolume = opts.batchVolume || 3500;
  const useQuery = opts.useQuery || false;
  const supportsCreatedColumn = opts.created || false;
  const indexValueSQL = opts.indexValue ? ', INDEX (`value`)' : ''; // allows for a more relational push model inside the keyvalue store db
  // dual would only be used for special relational cases ie mongo or mysql..
  delete options.table;
  delete options.batchVolume;
  delete options.indexValue;
  delete options.useQuery;
  delete options.created;

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
    createdColumn: supportsCreatedColumn,
  };

  const transact = this.transact = query => new Promise((resolve, reject) => {
    pool.getConnection(function(connectionError, conn) {
      if (connectionError) { conn.release(); return reject(connectionError); }

      // Use just query not transaction
      if (useQuery === true) {
        conn.query(query, function (queryError, results) {
          if (queryError) {
            return reject(queryError);
          }

          conn.release();
          return resolve(results);
        });
      } else {
        conn.beginTransaction(function(errTx) {
          if (errTx) { conn.release(); return reject(errTx); }


          console.log(query);


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
  const insertCreatedKey = supportsCreatedColumn ? `,${'`'}created${'`'}` : '';

  const createReadStream = this.createReadStream = (opts = {}) => new Promise((resolve, reject) => {
    pool.getConnection(function(err, conn) {
      if (err) { return reject(err); }

      const sql = supportsCreatedColumn
        ? `SELECT (${'`'}key${'`'},${'`'}value${'`'}${insertCreatedKey}) FROM ${table} ORDER BY created asc;`
        : `SELECT * FROM ${table};`;

      console.log(sql);

      // this is new, try it out  ORDER BY ${'`'}key${'`'} ASC
      resolve(conn.query(sql).stream()
      .on('result', (v) => console.log('row', v))
      .on('end', () => {
        conn.release();
      }));
    });
  });

  const createdKey = supportsCreatedColumn ? ', `created` datetime' : '';
  const insertCreatedValue = () => supportsCreatedColumn ? `,'${datetime()}'` : '';
  const datetime = this.datetime = () => (new Date()).toISOString().slice(0, 19).replace('T', ' ');
  const empty = {};
  this.pool = () => pool;
  this.create = () => transact('CREATE TABLE IF NOT EXISTS ' + table +  ' (`key` VARCHAR(128) NOT NULL, `value` VARCHAR(' + (indexValueSQL.length ? '128' : '4000') + ') NOT NULL' + createdKey + ', PRIMARY KEY (`key`)' + indexValueSQL + ' );');
  this.drop = () => transact(`DROP TABLE ${table};`);
  this.set = this.put = (key, value, ignore = true) => transact(`${ignore === true ? `DELETE FROM ${table} WHERE ${'`'}key${'`'} = ${mysql.escape(key)}; ` + 'INSERT' : 'INSERT'} INTO ${table} (${'`'}key${'`'},${'`'}value${'`'}${insertCreatedKey}) VALUES (${mysql.escape(key)},${mysql.escape(value)}${insertCreatedValue()});`);
  this.remove = this.del = key => transact(`DELETE FROM ${table} WHERE ${'`'}key${'`'} = ${mysql.escape(key)};`);
  this.get = key => transact(`SELECT value FROM ${table} WHERE ${'`'}key${'`'} = ${mysql.escape(key)} UNION SELECT NULL;`)
    .then(v => (v[0] || empty).value || null)
    .catch(e => Promise.reject(e));
  this.keys = value => transact(`SELECT ${'`'}key${'`'} FROM ${table} WHERE ${'`'}value${'`'} = ${mysql.escape(value)};`)
    .then(results => results.map(v => v.key || null))
    .catch(e => Promise.reject(e));
  this.clear = () => transact(`TRUNCATE TABLE ${table};`);
  var batch = this.batch = async (_arr, results = [], initCount = null) => {
    try {
      // MUST Be right filter..
      const hasGet = _arr.filter(v => v.type === 'get').length > 0;
      const arr = hasGet ? _arr : _arr
        .map(v => (v.table || table) + v.type + v.key)
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
        const rowTable = arr[i].table || table;

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
              sqlQuery += `INSERT INTO ${rowTable}(${'`'}key${'`'},${'`'}value${'`'}${rowTable === table ? insertCreatedKey : ''}) VALUES (${mysql.escape(arr[i].key)},${mysql.escape(arr[i].value)}${rowTable === table ? insertCreatedValue() : ''})`;
            } else {
              _sqlQuery += arr[i].ignore === false ? '' : ` OR ${delKey}`;
              sqlQuery += `,(${mysql.escape(arr[i].key)},${mysql.escape(arr[i].value)}${rowTable === table ? insertCreatedValue() : ''})`;
            }
            const futurePutRowType = ((arr[i + 1] || empty).table || table)
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
            const futureDelRowType = ((arr[i + 1] || empty).table || table)
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
      const transactionResults = await transact(preSQLQuery + sqlQuery);
      return await batch(arr.slice(len), results.concat(transactionResults), initCount);
    } catch (error) {
      throw new ByPassError(error);
    }
  };
}

module.exports = MysqlDB;
