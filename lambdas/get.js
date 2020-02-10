const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');
const env = require('../config/process');

const cors = microCors({ allowMethods: ['GET', 'PUT', 'POST', 'OPTIONS'] });

const db = new MysqlDB({
  host: env.mysql_host,
  port: parseInt(env.mysql_port, 10),
  database: env.mysql_database,
  user: env.mysql_user,
  password: env.mysql_password,
  table: 'keyvalues',
});

// Request Dispersal!
module.exports = cors(async (req, res) => {
  try {
    // Handle Cors Options
    if (req.method === 'OPTIONS') {
      await send(res, 200, { error: null });
      return;
    }

    if (req.method !== 'OPTIONS') {
      const data = await json(req);

      // data.chain_id = 3 or 5 (ropsten or goerli), than select db..

      // Enforce the block number in hex
      TypeHex(data.key);

      // Throw if key is too long
      if (data.key.length > 128) {
        throw new Error('Key is too long.');
      }

      let result = null;
      let error = null;

      // Deny IP logs
      if (data.key.indexOf(FuelDBKeys.ip) === 0) {
        throw new Error('IP log access denied.');
      }

      try {
        result = await db.get(data.key);
      } catch (error) {
        error = 'Database error';
        console.error('Database get error:');
        console.error(error);
      }

      // send out result
      await send(res, 200, { error: null, result });
      return;
    }
  } catch (error) {
    send(res, 400, { error: error.message, result: null });
  }
});
