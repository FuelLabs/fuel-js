const config = require('./config');

/*
# Web3 HTTP Provider (string - url.. Infura or Other *Required*)
web3_provider="https://.."

# MySQL Database Environment (string[s] - mysql connection settings, optional for sync or verifier nodes)
# mysql_host
# mysql_port
# mysql_database
# mysql_user
# mysql_password

# Keys (string - 64 byte hex)
# block_production_key=0x..
# fraud_commitment_key=0x..
# transactions_submission_keys=0x..[, 0x...]

# Faucet (string - hex)
# faucet_key=0x..

# Faucet (numberish - hex | number)
# faucet_token_id=1
# faucet_dispersal_amount=0x..

# Sentry Error Reporting (optional)
# sentry=https://..

# Monitor Memory (boolish, optional)
# memwatch=1

# Verifier Only (no block production, only fraud commitments etc..) (boolish, optional)
# verifier=1

# Chain Identifier (number, eventually 1 Mainnet or 3 Ropsten are supported, default: 3)
# chain_id=3

# Gas Limit (string - hex)
# gasLimit=0x..
*/

// Prefix
const prefix = config.networks[process.env.chain_id] + '_';

// Exports
// Maybe add explicit defaults / than to network specific..
module.exports = {
  web3_provider: process.env[prefix + 'web3_provider'],
  mysql_host: process.env[prefix + 'mysql_host'],
  mysql_port: process.env[prefix + 'mysql_port'],
  mysql_database: process.env[prefix + 'mysql_database'],
  mysql_user: process.env[prefix + 'mysql_user'],
  mysql_password: process.env[prefix + 'mysql_password'],
  block_production_key: process.env.block_production_key,
  fraud_commitment_key: process.env.fraud_commitment_key,
  transactions_submission_keys: process.env.transactions_submission_keys,
  faucet_key: process.env.faucet_key,
  faucet_token_id: process.env.faucet_token_id,
  faucet_dispersal_amount: process.env.faucet_dispersal_amount,
  sentry: process.env.sentry,
  verifier: process.env.verifier,
  memwatch: process.env.memwatch,
  gasLimit: process.env.gasLimit,
  chain_id: process.env.chain_id,
  pubnub_publisher_key: process.env.pubnub_publisher_key,
  pubnub_subscriber_key: process.env.pubnub_subscriber_key,
  pubnub_uuid: process.env.pubnub_uuid,
  port: process.env.port,
  network: config.networks[process.env.chain_id],
  prefix,
};
