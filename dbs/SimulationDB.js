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
  this.set = this.put = (key, value) => {
    this.opts.push({ type: 'put', key, value });
    return cache.set(key, value);
  };
  this.get = key => cache.get(key)
    .then(cached => !cached ? storage.get(key) : Promise.resolve(cached))
    .catch(error => Promise.reject(error));
  this.remove = this.del = key => {
    this.opts.push({ type: 'del', key });
    return cache.remove(key);
  };
  this.clear = () => {
    this.opts = [];
    this.storage = null;
    return cache.clear();
  };
}

module.exports = SimulationDB;
