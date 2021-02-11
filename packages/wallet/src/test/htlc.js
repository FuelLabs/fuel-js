const { test, utils } = require('@fuel-js/environment');
const schema = require('@fuel-js/interface');
const Api = require('@fuel-js/api');
const ethers = require('ethers');
const fuel = require('../index');

module.exports = test('htlc', async t => {
  const network = 'unspecified';
  const path = 'http://localhost:3000';
  const jsonProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

  // Setup Addresses
  const producer = t.wallets[0].connect(jsonProvider);
  const cold = t.wallets[1].connect(jsonProvider);
  const userA = t.wallets[2].connect(jsonProvider);
  const userB = t.wallets[3].connect(jsonProvider);

  // Special API key.
  const apiKey = utils.hexDataSlice(
    utils.keccak256('0xbebebe'),
    12,
    32,
  );

  const api = new Api(network, {
    url: 'http://localhost:3000',
  });

  const walletB = new fuel.Wallet(jsonProvider, {
      privateKey: utils.hexlify(utils.randomBytes(32)),
      network,
      path,
      apiKey,
  });

  console.log('wallet b address', walletB.address);

  await walletB.sync();

  await walletB.faucet();

  const preImageA = utils.keccak256('0xdeadbeaf');

  t.ok(await walletB.transfer(
        1,
        walletB.address,
        utils.parseEther('500'),
        {
            htlc: true,
            preImage: preImageA,
            expiry: (await api.getState())
                .properties.blockNumber().get()
                .add(500),
        },
    ), 'transfer full to self');

    await walletB.sync();

    t.equalBig(await walletB.balance(1), utils.parseEther('500'),
        'wallet balance after HTLC');

    t.equalBig(await walletB.balance(1, {
        htlc: true,
        preimages: [preImageA],
    }), utils.parseEther('1000'), 'wallet balance after HTLC');

    t.ok(await walletB.transfer(
        1,
        walletB.address,
        utils.parseEther('1000'),
        {
            preimages: [preImageA],
        },
    ), 'transfer full to self after htlc');

    t.equalBig(await walletB.balance(1), utils.parseEther('1000'),
        'wallet balance after HTLC');

    walletB.off();

    await walletB.db.close();
});
