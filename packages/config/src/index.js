// placeholder for primary config object
// we will use this for organizational purposes.
const utils = require('@fuel-js/utils');

const noop = () => {};
const defaults = {
  console: console,
  prompt: null,
  emit: noop,
  faucet: null,
  network: utils.getNetwork('unspecified'),
  gas_limit: 4000000,
  confirmations: 6,
  block_time: 13 * 1000,
  db: null,
  contract: { address: null },
  provider: null,
  operators: null,
};

function Config(opts = {}) {
  return Object.freeze({
    ...defaults,
    ...opts,
  });
}

module.exports = Config;
