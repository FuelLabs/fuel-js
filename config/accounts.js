const { utils } = require('ethers');
const env = require('./process');
const interfaces = require('../interfaces/interfaces');
const HTTPProvider = require('ethjs-provider-http');

// Web3 Provider..
const web3Provider = new HTTPProvider(env.web3_provider);
const rpc = interfaces.FuelRPC({ web3Provider });

// Bal
const bal = async addr => utils
  .formatEther(await rpc('eth_getBalance', addr, 'latest'));

// Process to Display Accounts
(async () => {
  const producer = (new utils.SigningKey(env.block_production_key)).address;
  console.log('Block Producer', producer, await bal(producer));

  const fraud_commitment_key = (new utils.SigningKey(env.fraud_commitment_key)).address;
  console.log('Fraud Commitment Producer',
    fraud_commitment_key, await bal(fraud_commitment_key));

  env.transactions_submission_keys.split(',').map(async v => {
    const t_sub_key = (new utils.SigningKey(v)).address;
    console.log('Transaction key',
      t_sub_key, await bal(t_sub_key));
  });

  const faucet_key = (new utils.SigningKey(env.faucet_key)).address;
  console.log('Faucet Key',
    faucet_key, await bal(faucet_key));
})();
