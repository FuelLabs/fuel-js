const { utils } = require('ethers');

console.log('Block Producer', new utils.SigningKey(process.env.block_production_key));
