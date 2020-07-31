const { test } = require('../index');

(async () => {

  await test('cool', async t => {

    console.log(t.getOverrides());

    t.setOverrides({
      gasPrice: '0xaabbaa',
    });

    console.log(t.getOverrides());

    await t.ok('ok');
  });

  await test('cool', async t => {
    await t.fail('fail');
  });

})();
