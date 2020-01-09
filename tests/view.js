const { send, json } = require('micro');
const microCors = require('micro-cors');
const { TypeHex } = require('../types/types');
const { intakeTransaction } = require('../transactions/intakeTransaction');
const MysqlDB = require('../dbs/MysqlDB');
const { FuelDBKeys } = require('../interfaces/interfaces');
const { RLP } = require('../utils/utils');

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

async function app() {
  (await accounts.createReadStream()).on('data', console.log);
}

app().then(console.log).catch(console.log);
