// @description leveldown remote, reads from local, puts / dels / batch / on both dbs
const { AbstractLevelDOWN } = require('abstract-leveldown');
const util = require('util');

// Constructor
function CopyDown(remote, local) {
  if (!(this instanceof CopyDown)) return new CopyDown(remote, local);

  AbstractLevelDOWN.call(this, {
    ...(remote.supports || {}),
    ...(local.supports || {}),
    promises: true,
    buffer: true,
    remote: remote,
    local: local,
  });
  this.remote = remote;
  this.local = local;
}

// Our new prototype inherits from AbstractLevelDOWN
util.inherits(CopyDown, AbstractLevelDOWN);

function openIfNew(db, options, callback) {
  if (db.status === 'new') return db.open(options, callback);
  process.nextTick(callback);
}

function closeIfOpen(db, callback) {
  if (db.status === 'open') return db.close(callback);
  process.nextTick(callback);
}

CopyDown.prototype._open = function (options, callback) {
  const self = this;
  openIfNew(self.local, options, err => !err
    ? openIfNew(self.remote, options, callback)
    : callback(err));
}

CopyDown.prototype._close = function (callback) {
  const self = this;
  closeIfOpen(self.local, err => !err
    ? closeIfOpen(self.remote, callback)
    : callback(err));
}

CopyDown.prototype._put = function (key, value, options, callback) {
  const self = this;
  if (options.remote) return self.remote._put(key, value, options, callback);
  if (options.local) return self.local._put(key, value, options, callback);

  self.local._put(key, value, options, (error, result) => {
    if (error) { return callback(error, result); }
    self.remote._put(key, value, options, callback);
  });
}

CopyDown.prototype._get = function (key, options, callback) {
  const self = this;
  if (options.remote) return self.remote._get(key, options, callback);
  if (options.local) return self.local._get(key, options, callback);

  self.local._get(key, options, callback);
};

CopyDown.prototype._del = function (key, options, callback) {
  const self = this;
  if (options.remote) return self.remote._del(key, options, callback);
  if (options.local) return self.local._del(key, options, callback);

  self.local._del(key, options, (error, result) => {
    if (error) { return callback(error, result); }
    self.remote._del(key, options, callback);
  });
};

CopyDown.prototype._clear = function (options, callback) {
  const self = this;
  if (options.remote) return self.remote._clear(options, callback);
  if (options.local) return self.local._clear(options, callback);

  self.local._clear(options, (error, result) => {
    if (error) { return callback(error, result); }
    self.remote._clear(options, callback);
  });
};

CopyDown.prototype._batch = function(array, options, callback) {
  const self = this;
  if (options.remote) return self.remote._batch(array, options, callback);
  if (options.local) return self.local._batch(array, options, callback);

  self.local._batch(array, options, (error, result) => {
    if (error) { return callback(error, result); }
    self.remote._batch(array, options, callback);
  });
};

CopyDown.prototype._iterator = function(options) {
  if (options.remote) return this.remote._iterator(options);
  if (options.local) return this.local._iterator(options);

  return this.local._iterator(options);
};

module.exports = CopyDown;
