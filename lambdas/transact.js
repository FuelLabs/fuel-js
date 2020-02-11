const { send, json } = require('micro');
const microCors = require('micro-cors');
const { intakeTransaction } = require('../transactions/intakeTransaction');
const MysqlDB = require('../dbs/MysqlDB');
const env = require('../config/process');

const cors = microCors({ allowMethods: ['POST', 'OPTIONS'] });

const remote = new MysqlDB({ // for storing remotly for lambda processing
  host: env.mysql_host,
  port: parseInt(env.mysql_port, 10),
  database: env.mysql_database,
  user: env.mysql_user,
  password: env.mysql_password,
  table: 'keyvalues',
});
const mempool = new MysqlDB({ // for storing tx list
  host: env.mysql_host,
  port: parseInt(env.mysql_port, 10),
  database: env.mysql_database,
  user: env.mysql_user,
  password: env.mysql_password,
  table: 'mempool',
});
const accounts = new MysqlDB({ // for storing remotly for lambda processing
  host: env.mysql_host,
  port: env.mysql_port,
  database: env.mysql_database,
  user: env.mysql_user,
  password: env.mysql_password,
  table: 'accounts', // key / value table..
  indexValue: true,
});

// exports
module.exports = cors(async (req, res) => {
  try {
    // Handle Cors Options
    if (req.method === 'OPTIONS') {
      await send(res, 200, { error: null });
      return;
    }

    if (req.method !== 'OPTIONS') {
      const data = await json(req);

      // Intake Tx
      const result = await intakeTransaction({
        transaction: data.transaction,
        db: remote,
        mempool,
        accounts,
        batchAll: true,
      });

      // send out result
      await send(res, 200, { error: null, result: result ? '0x1' : '0x0' });
      return;
    }
  } catch (error) {
    console.log(error);
    send(res, 400, { error: error.message, result: null });
  }
});
