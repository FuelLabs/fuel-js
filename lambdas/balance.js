const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const { intakeTransaction } = require('../transactions/intakeTransaction');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');
const { RLP, big } = require('../utils/utils');
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

      // Enforce the block number in hex
      TypeHex(data.address, 20);
      TypeHex(data.tokenID);

      // Db Keys
      let dbKeys = [];
      let getAllEntries = [];

      // token id
      const tokenID = big(data.tokenID);

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
        await send(res, 200, { error: null, result: '0x0' });
        return;
      } else {

        // account balance
        let balance = big(0);

        // amounts
        dbKeys.map((key, keyIndex) => {
          const entry = getAllEntries[keyIndex];

          // check empty
          if (entry === null) { return; }

          // entry RLP decoded
          const rlp = RLP.decode(entry);

          // if UTXO
          if (key.indexOf(FuelDBKeys.UTXO) === 0
           || key.indexOf(FuelDBKeys.mempool + FuelDBKeys.UTXO.slice(2)) === 0) {

            // if token ID == rlp token id
            if (tokenID.eq(big(rlp[0][5]))) {
              balance = balance.add(big(rlp[0][3]));
            }
          }

          // if Deposit
          if (key.indexOf(FuelDBKeys.Deposit) === 0) {
            // if token id == RLP token id
            if (tokenID.eq(big(rlp[3]))) {
              balance = balance.add(big(rlp[0][4]));
            }
          }
        });

        await send(res, 200, { error: null, result: balance.toHexString() });
        return;
      }

      return;
    }
  } catch (error) {
    console.log(error);
    send(res, 400, { error: error.message, result: null });
  }
});
