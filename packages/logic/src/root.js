// return the raw calldata for this specific root
async function calldata(root = {}, config = {}) {
  try {
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

// process any transactions in a root thats produced by a foriegn entity into our own mempool
async function process(root = {}, config = {}) {
  try {
  } catch (error) {
    throw new utils.ByPassError(error);
  }
  // look at the first tx of every root, grab that, dump it into the mempool using transact
  /* try {
    const unsigned = '0x';
    const witnesses = '0x';
    const nonce = 0;
    // transact this first tx in our db
    try {
      await transact(unsigned, witnesses, nonce, config);
    } catch (transactError) {
      // maybe the tx is already in our db or not valid, either way it will be processed.
    }
  } catch (error) {
    throw new utils.ByPassError(error);
  }
  */
}

module.exports = {
  process,
  calldata,
};
