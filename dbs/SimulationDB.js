const { TypeDB } = require('../types/types');

// Memory DB
function SimulationDB({ cache, storage }) {
  TypeDB(cache);
  TypeDB(storage);

  // Supports notation
  this.supports = {
    permanence: true,
    bufferKeys: false,
    promises: true,
    secondaryIndexes: false,
    backgroundProcessing: false,
  };

  this.storage = cache.storage || {};
  this.opts = [];
  this.put = (key, value) => {
    this.opts.push({ type: 'put', key, value });
    return cache.put(key, value);
  };
  this.get = key => cache.get(key)
    .then(cached => !cached ? storage.get(key) : Promise.resolve(cached))
    .catch(error => Promise.reject(error));
  this.del = key => {
    this.opts.push({ type: 'del', key });
    return cache.del(key);
  };
  this.clear = () => {
    this.opts = [];
    this.storage = null;
    return cache.clear();
  };
}

module.exports = SimulationDB;
