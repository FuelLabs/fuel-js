const MysqlDB = require('../dbs/MysqlDB');

// Clear all Databases
async function clear() {
  try {
    console.log('Syncing remote database with Local');

    const remote = new MysqlDB({ // for storing remotly for lambda processing
      host: process.env.mysql_host,
      port: parseInt(process.env.mysql_port, 10),
      database: process.env.mysql_database,
      user: process.env.mysql_user,
      password: process.env.mysql_password,
      table: 'keyvalues',
    });
    await remote.create();

    const LevelUpDB = require('../dbs/levelupdb');

    const local = new LevelUpDB('./dbcache', false, true); // for local caching..

    (await remote.createReadStream())
    .on('data', data => local.put(data.key, data.value))
    .on('end', () => console.log('Remote synced with local'))
    .on('error', err => console.error(err));
  } catch(error) {
    console.error('Error while resetting production databases..');
    console.log(error);
  }
}

// Clear execution
clear()
.then(console.log)
.catch(console.log);
