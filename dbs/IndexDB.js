// Memory DB
var levelup = require('levelup');
var leveljs = require('level-js');

// SET IMMEDIATE might need to be used here..
function IndexDB(name) {
  const db = levelup(leveljs(name || 'dblocalstore'));

  // Supports notation
  this.supports = {
    permanence: true,
    bufferKeys: false,
    promises: true,
    secondaryIndexes: false,
    doubleEntryPrevention: true,
    backgroundProcessing: false,
  };

  // Wrapper Methods
  this.set = this.put = (key, value, noDoubleEntry) => new Promise((resolve, reject) => {
    if (noDoubleEntry) {
      db.get(key, { asBuffer: false })
      .then(v => v !== null
        ? reject('Double entry!')
        : db.put(key, value, { asBuffer: false })
          .then(resolve)
          .catch(reject))
      .catch(reject);
    } else {
      db.put(key, value, { asBuffer: false }).then(resolve).catch(reject);
    }
  });
  this.get = key => new Promise((resolve, reject) => db.get(key, { asBuffer: false })
    .then(resolve)
    .catch(() => resolve(null)));
  this.remove = this.del = key => new Promise((resolve, reject) => db.del(key, { asBuffer: false })
    .then(resolve)
    .catch(() => Promise.resolve()));
  this.batch = opts => db.batch(opts);
  this.createReadStream = (opts = {}) => db.createReadStream(Object.assign({
    keyAsBuffer: false,
    valueAsBuffer: false
  }, opts));
  this.clear = () => db.clear();
}

module.exports = IndexDB;
