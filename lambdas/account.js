const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const { intakeTransaction } = require('../transactions/intakeTransaction');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');
const { RLP } = require('../utils/utils');

const cors = microCors({ allowMethods: ['POST', 'OPTIONS'] });

const db = new MysqlDB({ // for storing remotly for lambda processing
  host: process.env.mysql_host,
  port: parseInt(process.env.mysql_port, 10),
  database: process.env.mysql_database,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  table: 'keyvalues',
  useQuery: true,
});
const accounts = new MysqlDB({ // for storing remotly for lambda processing
  host: process.env.mysql_host, // "SG-fuel3-1564-master.servers.mongodirector.com",
  port: process.env.mysql_port,
  database: process.env.mysql_database,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  table: 'accounts', // key / value table..
  indexValue: true,
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
      TypeHex(data.address, 20);

      let dbKeys = [];
      let getAllEntries = [];

      // Get Block Number
      try {
        dbKeys = await accounts.keys(String(data.address).toLowerCase());
        getAllEntries = await db.batch(dbKeys.map(key => ({
          type: 'get',
          key,
        })));
      } catch (error) {
        console.error('Database error:');
        console.error(error);
      }

      if (dbKeys.length <= 0) {
        await send(res, 200, { error: null, result: RLP.encode([
          [],
          [],
        ]) });
        return;
      }

      // send out result
      await send(res, 200, { error: null, result: RLP.encode([
        dbKeys,
        getAllEntries.map(v => v === null ? '0x' : v),
      ]) });
      return;
    }
  } catch (error) {
    console.log(error);
    send(res, 400, { error: error.message, result: null });
  }
});
