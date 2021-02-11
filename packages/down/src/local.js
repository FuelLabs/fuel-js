// @description leveldown will store an additional key for each write for rewdinabilitiy
/* eslint no-underscore-dangle: 0 */
/* eslint consistent-return: 0 */
const { AbstractLevelDOWN } = require('abstract-leveldown');
const util = require('util');

function LocalDown(down = {}) {
  if (!(this instanceof LocalDown)) return new LocalDown(down);
  this.store = down;
  AbstractLevelDOWN.call(this, {
    stream: true,
    local: down,
  });
}

util.inherits(LocalDown, AbstractLevelDOWN);

function openIfNew(db, options, callback) {
  if (db.status === 'new') return db.open(options, callback);
  process.nextTick(callback);
}

function closeIfOpen(db, callback) {
  if (db.status === 'open') return db.close(callback);
  process.nextTick(callback);
}

LocalDown.prototype._open = function (options, callback) {
  openIfNew(this.store, options, callback);
};

LocalDown.prototype._close = function (callback) {
  closeIfOpen(this.store, callback);
};

LocalDown.prototype._put = function (key, value, options, callback) {
  const self = this;
  self.store._put(key, value, options, callback);
};

LocalDown.prototype._get = function (key, options, callback) {
  this.store._get(key, options, callback);
};

LocalDown.prototype._del = function (key, options, callback) {
  const self = this;
  self.store._del(key, options, callback);
};

LocalDown.prototype._clear = function (options, callback) {
  this.store._clear(options, callback);
};

LocalDown.prototype._batch = function (array, options, callback) {
  this.store._batch(array, options, callback);
};

LocalDown.prototype._iterator = function (options) {
  return this.store._iterator(options);
};

module.exports = LocalDown;
