const utils = require('@fuel-js/utils');

async function invalidTransaction({
    block,
    root,
    transaction,
    transactionIndex,
    proofs,
    data,
  }, config = {}) {
  try {
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

async function invalidInput({
    block,
    root,
    transaction,
    transactionIndex,
    proofs,
    data,
    inputOutputIndex,
  }, config = {}) {
  try {
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

async function invalidSum({
    block,
    root,
    transaction,
    transactionIndex,
    proofs,
    data,
  }, config = {}) {
  try {
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

async function invalidWitness({
    block,
    root,
    transaction,
    transactionIndex,
    proofs,
    data,
  }, config = {}) {
  try {
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

async function malformedBlock({ block, root }, config = {}) {
  try {
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = {
  invalidTransaction,
  invalidInput,
  invalidWitness,
  invalidSum,
  invalidWitness,
  malformedBlock,
};
