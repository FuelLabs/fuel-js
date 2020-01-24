const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const { intakeTransaction } = require('../transactions/intakeTransaction');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');
const cors = microCors({ allowMethods: ['POST', 'OPTIONS'] });
const { unixtime, big, ipToHex } = require('../utils/utils');

const remote = new MysqlDB({ // for storing remotly for lambda processing
  host: process.env.mysql_host,
  port: parseInt(process.env.mysql_port, 10),
  database: process.env.mysql_database,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  table: 'keyvalues',
});
const requests = new MysqlDB({ // for storing remotly for lambda processing
  host: process.env.mysql_host,
  port: parseInt(process.env.mysql_port, 10),
  database: process.env.mysql_database,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  table: 'faucet_requests',
});

// Request Dispersal!
module.exports = cors(async (req, res) => {
  try {
    // Handle Cors Options
    if (req.method === 'OPTIONS') {
      await send(res, 200, { error: null });
      return;
    }

    // Faucet string fixed.
    if (req.method !== 'OPTIONS') {
      const data = await json(req);
      const ip = ipToHex(req.headers['x-forwarded-for']);
      const address = String(data.address).toLowerCase();
      const timeId = big(Math.round(unixtime() / 600)).toHexString(); // once an hour..

      // data.chain_id = 3 or 5 (ropsten or gorli), than select db..

      TypeHex(data.address, 20);

      try {
        // Batch writes in single tx. one pass to db
        await remote.batch([
          { type: 'put', table: remote.table, key: FuelDBKeys.ip + ip.slice(2) + timeId.slice(2), value: '0x1', ignore: false },
          { type: 'put', table: requests.table, key: FuelDBKeys.ip + ip.slice(2), value: data.address },
        ], true);

        // send out result
        await send(res, 200, { error: null, result: '0x1' });
        return;
      } catch (error) {
        send(res, 400, { error: 'Too many requests, can only request fake Dai every 10 mins per IP.', result: null });
        return;
      }
    }
  } catch (error) {
    send(res, 400, { error: error.message, result: null });
  }
});
