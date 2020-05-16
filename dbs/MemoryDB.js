// Memory DB
const levelup = require('levelup');
const memdown = require('memdown');

// SET IMMEDIATE might need to be used here..
function MemoryDB() {
  const db = levelup(memdown());

  // Supports notation
  this.supports = {
    permanence: false,
    bufferKeys: false,
    promises: true,
    secondaryIndexes: false,
    backgroundProcessing: false,
  };

  var storage = this.storage = {};
  this.storageDB = db;
  this.storageGet = () => {
    return storage;
  };
  this.put = (key, value) => new Promise((resolve, reject) => db.put(key, value)
    .then(() => {
      storage[key] = value;
      return Promise.resolve();
    })
    .then(resolve)
    .catch(reject));
  this.get = key => new Promise((resolve, reject) => db.get(key, { asBuffer: false })
    .then(resolve)
    .catch(() => resolve(null)));
  this.del = key => new Promise((resolve, reject) => db.del(key, { asBuffer: false })
    .then(() => {
      delete storage[key];
      return Promise.resolve();
    })
    .then(resolve)
    .catch(reject));
  const localBatch = (opts) => {
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].type === 'put') {
        storage[opts[i].key] = opts[i].value;
      }

      if (opts[i].type === 'del') {
        delete storage[opts[i].key];
      }
    }

    return Promise.resolve();
  };
  const localClear = () => {
    storage = null;
    storage = {};
    return Promise.resolve();
  };
  this.batch = (opts) => Promise.all([localBatch(opts), db.batch(opts)])
    .then(v => v[0] || [])
    .catch(err => Promise.reject(err));
  this.close = () => db.close();
  this.createReadStream = (opts = {}) => db.createReadStream(Object.assign({
    keyAsBuffer: false,
    valueAsBuffer: false
  }, opts));
  this.clear = () => Promise.all([localClear(), db.clear()]);
}

module.exports = MemoryDB;
