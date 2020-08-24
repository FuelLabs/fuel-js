const { test, utils } = require('@fuel-js/environment');
const Config = require('../index');

module.exports = test('config', async t => {
  try {
    const config = Config({
      provider: t.getProvider(),
    });

    t.equal(config.confirmations, 6, 'confs');

  } catch (testError) { console.error(testError); }
});
