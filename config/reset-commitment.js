const MysqlDB = require('../dbs/MysqlDB');
const env = require('./process');
const interfaces = require('../interfaces/interfaces');

// Clear all Databases
async function clear() {
  try {
    const mempool = new MysqlDB({ // for storing mempool transaction data
      host: env.mysql_host,
      port: parseInt(env.mysql_port, 10),
      database: env.mysql_database,
      user: env.mysql_user,
      password: env.mysql_password,
      table: 'mempool',
    });

    await mempool.del(interfaces.FuelDBKeys.commitment);

    console.log('Commitment cleared..');
  } catch(error) {
    console.error('Error while resetting production databases..');
    console.log(error);
  }
}

// Clear execution
clear()
 .then(console.log)
 .catch(console.log);
