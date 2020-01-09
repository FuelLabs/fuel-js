const level = require('level');
const rimraf = require("rimraf");
const { ByPassError } = require('../errors/errors');

// Memory DB
function LevelUpDB(name, clear = false, nolock = false) {
  // 1) Create our store
  if (clear) { rimraf.sync(name || "./dbcache"); }
  if (nolock) { rimraf.sync((name || "./dbcache") + '/LOCK') }
  const db = level(name || './dbcache');

  // Supports notation
  this.supports = {
    permanence: true,
    bufferKeys: false,
    promises: true,
    secondaryIndexes: false,
    backgroundProcessing: false,
  };

  // Wrapper Methods
  this.set = this.put = (key, value, noDoubleEntry) => new Promise((resolve, reject) => {
    if (noDoubleEntry) {
      db.get(key)
      .then(v => v !== null
        ? reject('Double entry!')
        : db.put(key, value)
          .then(resolve)
          .catch(reject))
      .catch(reject);
    } else {
      db.put(key, value).then(resolve).catch(reject);
    }
  });
  this.get = key => db.get(key)
    .then(result => Promise.resolve(result.toString()))
    .catch(error => Promise.resolve(null));
  this.remove = this.del = key => db.del(key);
  this.batch = (opts) => db.batch(opts);
  this.createReadStream = opts => db.createReadStream(opts);
  this.clear = () => db.clear();
}

module.exports = LevelUpDB;
