const MysqlDB = require('../dbs/MysqlDB');
const env = require('./process');
const { FuelDBKeys } = require('../interfaces/interfaces');
const { decodeUTXORLP } = require('../structs/structs');
const { utils } = require('ethers');

const normalize = (...args) => args[0]
  + String(args[1]).toLowerCase().slice(2)
  + (args[2] !== undefined ? String(args[2]).toLowerCase().slice(2) : '');

// Clear all Databases
async function setupSwap() {
  try {
    const db = new MysqlDB({ // for storing remotly for lambda processing
      host: env.mysql_host,
      port: parseInt(env.mysql_port, 10),
      database: env.mysql_database,
      user: env.mysql_user,
      password: env.mysql_password,
      table: 'keyvalues',
    });

    console.log(await db._query(`show variables like 'log_output%';`));

  } catch(error) {
    console.log(error);
  }
}

// Clear execution
setupSwap()
 .then(console.log)
 .catch(console.log);
