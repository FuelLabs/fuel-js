const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const { intakeTransaction } = require('../transactions/intakeTransaction');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');
const { RLP } = require('../utils/utils');
const env = require('../config/process');
const cors = microCors({
  allowMethods: ['POST', 'OPTIONS'],
});

// Here we would do two DB copies, one for each of the networks
// Gorli / ropsten.. than based upon network ID fed in via the call
// It would select the approporiate network
const db = new MysqlDB({ // for storing remotly for lambda processing
  host: env.mysql_host,
  port: parseInt(env.mysql_port, 10),
  database: env.mysql_database,
  user: env.mysql_user,
  password: env.mysql_password,
  table: 'keyvalues',
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
