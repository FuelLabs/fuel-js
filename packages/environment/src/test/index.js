const { test, utils } = require('../index');

(async () => {

  await test('environment', async t => {

    await t.ok(t.getOverrides());

    t.setOverrides({
      gasPrice: '0xaabbaa',
    });

    await t.ok(t.getOverrides());

    await t.ok(t.getProvider());

    await t.equalBig(0, 0);

    await t.equalBig(0, utils.bigNumberify(0));

    await t.ok('ok');

    await t.equalBig(45, utils.bigNumberify(45));

    await t.equalHex('0xaa', '0xAA');

    await t.equalBig(0, await t.getProvider().getBlockNumber());

  });

})();
