const { TypeDB } = require('../types/types');
const noopFalse = () => false;

// Orgnize db into two cache db's. Two puts on write, than offshore long term storage
// to another DB in process. This is good for storage writes that are longer term..
function MiddleCacheDB(cacheDB, middleCacheDB, storageDB) {
  TypeDB(cacheDB);
  TypeDB(middleCacheDB);
  TypeDB(storageDB);

  // Supports notation
  this.supports = {
    permanence: true,
    bufferKeys: false,
    promises: true,
    secondaryIndexes: false,
    middleCache: true,
  };

  this.cache = cacheDB;
  this.middle = middleCacheDB;
  this.storage = storageDB;

  this.process = (batchVolume = 3500, ignoreKey = noopFalse) => new Promise((resolve, reject) => {
    let _opts = [];
    let ended = false;
    const strm = middleCacheDB.createReadStream();
    strm.on('data', async data => {
      try {
        const result = await cacheDB.get(data.key);

        // Check status in cachedb
        if (!ignoreKey(data.key)) {
          if (result !== null || typeof result === "undefined") {
            _opts.push({ type: 'put', key: data.key, value: result });
          } else {
            _opts.push({ type: 'del', key: data.key });
          }
        }

        if (_opts.length >= batchVolume) {
          strm.pause();

          // console.log('len > batch vol', _opts);

          await storageDB.batch(_opts);
          _opts = null; // kill
          _opts = []; // reset
          strm.resume();
        }
      } catch (error) {
        reject(error);
      }
    });
    strm.on('error', err => reject(err));
    strm.on('end', async () => {
      try {
        // console.log('end', _opts);

        await middleCacheDB.clear();
        ended = true;
        _opts = null;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
  this.put = (key, value) => new Promise((resolve, reject) => cacheDB.put(key, value)
    .then(() => middleCacheDB.put(key, '0x1'))
    .then(resolve)
    .catch(reject));
  this.get = key => cacheDB.get(key);
  this.del = key => new Promise((resolve, reject) => cacheDB.del(key)
    .then(() => middleCacheDB.put(key, '0x1'))
    .then(resolve)
    .catch(reject));
  this.batch = opts => Promise.all([cacheDB.batch(opts), middleCacheDB.batch(opts.map(
      data => ({
        type: 'put',
        key: data.key,
        value: '0x1',
      })
    ))])
    .then(v => v[0] || [])
    .catch(err => Promise.reject(err));
  this.createReadStream = opts => cacheDB.createReadStream(opts);
  this.clear = () => Promise.all([cacheDB.clear(), middleCacheDB.clear(), storageDB.clear()]);
}

module.exports = MiddleCacheDB;
