const block = require('./block');
const deposit = require('./deposit');
const eip712 = require('./eip712');
const inputs = require('./inputs');
const metadata = require('./metadata');
const outputs = require('./outputs');
const root = require('./root');
const transaction = require('./transaction');
const witness = require('./witness');
const state = require('./state');
const addons = require('./addons');

module.exports = {
  block,
  deposit,
  metadata,
  eip712,
  inputs,
  outputs,
  root,
  transaction,
  witness,
  state,
  addons,
};
