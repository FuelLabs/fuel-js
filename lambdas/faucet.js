const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const { intakeTransaction } = require('../transactions/intakeTransaction');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');
const cors = microCors({ allowMethods: ['POST', 'OPTIONS'] });
const { unixtime, big } = require('../utils/utils');

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
      const ip = big(String(req.headers['x-forwarded-for'])
        .toLowerCase().trim().replace(/\./gi, "")).toHexString();
      const address = String(data.address).toLowerCase();
      const timeId = big(Math.round(unixtime() / 600)).toHexString(); // once an hour..

      TypeHex(data.address, 20);

      try {
        await remote.set(FuelDBKeys.ip + ip.slice(2) + timeId.slice(2), '0x1', false); // SHOULD BE ,false); // prevent duplicates for issuance..
        await requests.set(FuelDBKeys.ip + ip.slice(2), data.address);

        // send out result
        await send(res, 200, { error: null, result: '0x1' });
        return;
      } catch (error) {
        send(res, 400, { error: 'Too many requests, can only request per IP every 10 mins.', result: null });
        return;
      }
    }
  } catch (error) {
    send(res, 400, { error: error.message, result: null });
  }
});
