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

    const reserveAUTXO = '0x4068913e203707dc03633ad47c3cf0461aa5c025aee5720933da5464942675f7';
    const reserveBUTXO = '0xf06e3720a72478a962200cf333a0ad0de6c7400cf9f082c4bda4f86dbbd132d1';

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
