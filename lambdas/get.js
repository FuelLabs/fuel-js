const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');

const cors = microCors({ allowMethods: ['GET', 'PUT', 'POST', 'OPTIONS'] });

const db = new MysqlDB({
  host: process.env.mysql_host,
  port: parseInt(process.env.mysql_port, 10),
  database: process.env.mysql_database,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  table: 'keyvalues',
  useQuery: true,
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
