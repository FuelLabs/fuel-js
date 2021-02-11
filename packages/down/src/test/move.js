const { test, utils } = require('@fuel-js/environment');
const database = require('@fuel-js/database');
const memdown = require('memdown');
const streamToArray = require('stream-to-array');
const copydown = require('../copy');

// will copy the localdb to the remote db
async function copy(config = {}) {
  try {
    await config.db.clear({
      remote: true,
    });

    let loop = true;
    let lastKey = null;

    while (loop) {
      const entries = await streamToArray(config.db.createReadStream({
        ...(lastKey ? { gt: lastKey } : {}),
        limit: 3500,
        local: true,
      }));

      // stop here..
      if (!entries.length) {
        loop = false;
        return;
      }

      // last key out
      lastKey = utils.RLP.decode(entries[entries.length - 1].key);

      // remote put these into the db
      await config.db.batch(entries.map(entry => ({
        type: 'put',
        key: utils.RLP.encode(utils.RLP.decode(entry.key)),
        value: entry.value,
      })), { remote: true });
    }
  } catch (copyError) {
    throw new utils.ByPassError(copyError);
  }
}

module.exports = test('copy', async t => {
  const remote = memdown();
  const local = memdown();
  const db = database(copydown(remote, local));
  const localdb = database(local);
  const remotedb = database(remote);

  let localLength = (await streamToArray(localdb.createReadStream())).length;
  let remoteLength = (await streamToArray(remotedb.createReadStream())).length;

  t.equal(localLength, 0, 'local length');
  t.equal(remoteLength, 0, 'remote length');

  await copy({ db });

  for (let i = 0; i < 20000; i++) {
    await localdb.put(['0xaa', '0xbbbb', utils.hexlify(i)], '0xaabb');
  }

  localLength = (await streamToArray(localdb.createReadStream())).length;
  remoteLength = (await streamToArray(remotedb.createReadStream())).length;

  t.equal(localLength, 20000, 'local length');
  t.equal(remoteLength, 0, 'remote length');

  await copy({ db });

  localLength = (await streamToArray(localdb.createReadStream())).length;
  remoteLength = (await streamToArray(remotedb.createReadStream())).length;

  t.equal(localLength, 20000, 'local length');
  t.equal(remoteLength, 20000, 'remote length');

  for (let i = 0; i < 20000; i++) {
    t.equal('0xaabb', await remotedb.get(['0xaa', '0xbbbb', utils.hexlify(i)]));
  }

  await db.close();
});
