

/*
async function root(root = {}, config = {}) {
  // look at the first tx of every root, grab that, dump it into the mempool using transact
  try {
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
}
*/
