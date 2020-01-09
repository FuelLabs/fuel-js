const MysqlDB = require('../dbs/MysqlDB');

// Clear all Databases
async function clear() {
  try {
    const remote = new MysqlDB({ // for storing remotly for lambda processing
      host: process.env.mysql_host,
      port: parseInt(process.env.mysql_port, 10),
      database: process.env.mysql_database,
      user: process.env.mysql_user,
      password: process.env.mysql_password,
      table: 'keyvalues',
    });
    await remote.create();
    await remote.clear();
    const mempool = new MysqlDB({ // for storing mempool transaction data
      host: process.env.mysql_host,
      port: parseInt(process.env.mysql_port, 10),
      database: process.env.mysql_database,
      user: process.env.mysql_user,
      password: process.env.mysql_password,
      table: 'mempool',
    });
    await mempool.create();
    await mempool.clear();
    const accounts = new MysqlDB({ // for storing remote for lambda processing
      host: process.env.mysql_host,
      port: process.env.mysql_port,
      database: process.env.mysql_database,
      user: process.env.mysql_user,
      password: process.env.mysql_password,
      table: 'accounts',
      indexValue: true, // secondary index
    });
    await accounts.create();
    await accounts.clear();
    const faucet_requests = new MysqlDB({ // for storing remote for lambda processing
      host: process.env.mysql_host,
      port: process.env.mysql_port,
      database: process.env.mysql_database,
      user: process.env.mysql_user,
      password: process.env.mysql_password,
      table: 'faucet_requests',
      indexValue: true, // secondary index
    });
    await faucet_requests.create();
    await faucet_requests.clear();
    const faucet_inputs = new MysqlDB({ // for storing remote for lambda processing
      host: process.env.mysql_host,
      port: process.env.mysql_port,
      database: process.env.mysql_database,
      user: process.env.mysql_user,
      password: process.env.mysql_password,
      table: 'faucet_inputs',
      indexValue: true, // secondary index
    });
    await faucet_inputs.create();
    await faucet_inputs.clear();

    console.log('Production databases reset.');
  } catch(error) {
    console.error('Error while resetting production databases..');
    console.log(error);
  }
}

// Clear execution
// clear()
// .then(console.log)
// .catch(console.log);
