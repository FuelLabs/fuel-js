// @description leveldown store, reads (1) cache if none: db, (2) puts only to cache
/* eslint no-underscore-dangle: 0 */
/* eslint consistent-return: 0 */
const { AbstractLevelDOWN } = require('abstract-leveldown');
const util = require('util');
const encoding = require('@fuel-js/encoding');

// Constructor
function SimulateDown(store = {}, cache = {}) {
  if (!(this instanceof SimulateDown)) return new SimulateDown(store, cache);

  AbstractLevelDOWN.call(this, {
    ...(store.supports || {}),
    ...(cache.supports || {}),
  });
  this.store = store;
  this.cache = cache;
}

// Our new prototype inherits from AbstractLevelDOWN
util.inherits(SimulateDown, AbstractLevelDOWN);

function openIfNew(db, options, callback) {
  if (db.status === 'new') return db.open(options, callback);
  process.nextTick(callback);
}

function closeIfOpen(db, callback) {
  if (db.status === 'open') return db.close(callback);
  process.nextTick(callback);
}

SimulateDown.prototype._open = function (options, callback) {
  const self = this;
  openIfNew(self.store, options, err => {
    if (!err) {
      return openIfNew(self.cache, options, callback);
    }
    return callback(err);
  });
};

SimulateDown.prototype._close = function (callback) {
  const self = this;
  closeIfOpen(self.store, err => {
    if (!err) {
      return closeIfOpen(self.cache, callback);
    }
    return callback(err);
  });
};

// the prefix here should likely be set in the options of the SimulateDown db...
const max_key_length = 96;
function deleteKey(key) {
  return Buffer.concat([
    Buffer.from('beef', 'hex'),
    Buffer.alloc(max_key_length - key.length),
    key,
  ]);
}

SimulateDown.prototype._put = function (key, value, options, callback) {
  const self = this;
  self.cache._put(key, value, options, (putError, result) => {
    if (putError) return callback(putError);
    self.cache._del(deleteKey(key), options, (deleteError) => {
      callback(deleteError, result);
    });
  });
};

SimulateDown.prototype._get = function (key = {}, options = {}, callback) {
  // if delete key is present, we throw, the key is technically deleted
  const self = this;

  self.cache.get(key, options, (cacheError, result) => {
    if (cacheError) {
      return self.cache.get(deleteKey(key), options, (deleteError) => {
        if (deleteError) {
          return self.store.get(key, options, callback);
        }

        return callback(new Error('key already deleted'));
      });
    }
    callback(cacheError, result);
  });
};

SimulateDown.prototype._del = function (key = {}, options = {}, callback) {
  const self = this;
  self.cache._del(key, options, (notCacheDelete) => {
    if (notCacheDelete) return callback(notCacheDelete);
    return self.cache._put(deleteKey(key), encoding.valueEncoding.encode(key), options, callback);
  });
};

SimulateDown.prototype._clear = function (options = {}, callback) {
  this.cache._clear(options, callback);
};

SimulateDown.prototype._batch = function (array = [], options = {}, callback) {
  this.cache._batch(array.reduce((acc = [], entry = {}) => {
    if (entry.type === 'put') {
      return acc.concat([entry, {
        type: 'del',
        key: deleteKey(entry.key),
      }]);
    }

    return acc.concat([entry, {
      type: 'put',
      key: deleteKey(entry.key),
      value: encoding.valueEncoding.encode(entry.key),
    }]);
  }, []), options, callback);
};

SimulateDown.prototype._iterator = function (options = {}) {
  return this.cache._iterator({
    ...(options.deleted ? {
      gte: deleteKey(Buffer.from('00', 'hex')),
      lte: deleteKey(Buffer.alloc(max_key_length).fill('FF', 'hex')),
    } : {}),
    ...(options.beforedeleted ? {
      lt: deleteKey(Buffer.from('00', 'hex')),
    } : {}),
    ...(options.afterdeleted ? {
      gt: deleteKey(Buffer.alloc(max_key_length).fill('FF', 'hex')),
    } : {}),
    ...options,
  });
};

module.exports = SimulateDown;
