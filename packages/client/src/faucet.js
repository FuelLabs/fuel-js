const utils = require('@fuel-js/utils');
const schema = require('@fuel-js/interface');
const { requests } = require('@fuel-js/logic');
const { Wallet } = require('@fuel-js/wallet');

// Amount to faucet per address.
const faucetAmount = utils.parseEther('1000.0');

// Faucet method.
async function faucet(config = {}) {
  // Stop nicely.
  if (!config.continue()) {
    return;
  }

  // Start a wallet instance.
  config.wallet = new Wallet(null, {
    network: config.networkSpecified,
    privateKey: (config.faucetOperator || {}).privateKey || config.operators,
    path: config.wallet_path || null,
    transact: config.transact || null,
    // spendProtection: true,
    // transact: (unsigned = '0x', witnesses = '0x') => logic.transact(unsigned, witnesses, 0, result),
  });

  // start loop
  config.console.log(`Begining faucet sequence on ${
    config.network.name
  } with wallet ${
    config.wallet.address
  }`);

  let loop = true;
  let start = 0;
  let startNonce = 0;

  // get first token
  let token = null;
  try {
    token = await config.db.get([ schema.db.token, 1 ]);
  } catch (noTokenYet) {
    return;
  }

  // sync the wallet
  await config.wallet.sync();

  // starting balance
  config.console.log(`starting balance ${utils.formatUnits(
    await config.wallet.balance(token, { sync: false }), 'ether')} ether`);

  // loop
  while (loop) {
    try {
      // Request processing on the remote DB.
      const entries = await requests(start, startNonce, utils.timestamp(), config);

      // processing
      config.console.log(`processing ${entries.length} addresses`);

      // addresses
      for (const { timestamp, nonce, address } of entries) {
        if (address === '0x') continue;
        await config.wallet.transfer(token, address, faucetAmount, {
          sync: false,
        });
        start = timestamp;
        startNonce = nonce;
      }

      // processing
      config.console.log(`processed ${entries.length} addresses`);

      // Batch delete these keys, onto the next, on remote db.
      await config.db.batch(entries.map(entry => ({
        type: 'del',
        key: entry.key,
      })), { remote: true });

    } catch (loopError) {
      config.console.error(loopError);
    }

    // If stop, then break the loop.
    if (!config.continue() || config.faucet_no_cycle) {
      break;
    }

    // If loop we wait, otherwise just stop process.
    if (loop) {
      await utils.wait(1000);
    }
  }
}

module.exports = faucet;
