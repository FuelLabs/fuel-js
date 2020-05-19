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

    const reserveAUTXO = '0x0bde18b60ca08b1941cd914e2615cfbb113e95a4ae76feb843d5df115bf92b2c';
    const reserveBUTXO = '0x3d822b2ba72a9e1587369c60ed902b9ab445346427fb05fb6d580cd010e6e6fa';

    let tokenAReserve = await db
      .get(normalize(FuelDBKeys.mempool, FuelDBKeys.UTXO, reserveAUTXO));
    tokenAReserve = tokenAReserve || await db
      .get(normalize(FuelDBKeys.UTXO, reserveAUTXO));

    let tokenBReserve = await db
      .get(normalize(FuelDBKeys.mempool, FuelDBKeys.UTXO, reserveBUTXO));
    tokenBReserve = tokenBReserve || await db
      .get(normalize(FuelDBKeys.UTXO, reserveBUTXO));

    if (!tokenAReserve || !tokenBReserve) {
      throw new Error('Reserve inputs not found!');
    }

    // setup reserves
    const reserves = {
      a: decodeUTXORLP(tokenAReserve).proof,
      b: decodeUTXORLP(tokenBReserve).proof,
    };

    // add it to the database
    await db.put(FuelDBKeys.swap, utils.RLP.encode([
      reserves.a.amount,
      reserves.b.amount,
      reserveAUTXO,
      reserveBUTXO,
      reserves.a._ownerAddress,
    ]));

    return true;
  } catch(error) {
    console.error('Error while resetting production databases..');
    console.log(error);
  }
}

// Clear execution
setupSwap()
 .then(console.log)
 .catch(console.log);
