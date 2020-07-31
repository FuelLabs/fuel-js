// @description leveldown will store an additional key for each write for rewdinabilitiy
const { AbstractLevelDOWN } = require('abstract-leveldown');
const util = require('util');
const encoding = require('@fuel-js/encoding');

// const _coder = { key: _key => _key + '00' };
function RewindDown(down = {}, coder = null, encoder = encoding) {
  if (!coder) throw new Error('invalid rewind coder must be object with prop key');
  if (!(this instanceof RewindDown)) return new RewindDown(down, coder);
  this.store = down;
  this.coder = coder;
  this.encoder = encoder;
  AbstractLevelDOWN.call(this, {
    stream: true,
    rewindable: true,
    local: down,
  });
}

util.inherits(RewindDown, AbstractLevelDOWN);

function openIfNew(db, options, callback) {
  if (db.status === 'new') return db.open(options, callback);
  process.nextTick(callback);
}

function closeIfOpen(db, callback) {
  if (db.status === 'open') return db.close(callback);
  process.nextTick(callback);
}

RewindDown.prototype._open = function (options, callback) {
  openIfNew(this.store, options, callback)
}

RewindDown.prototype._close = function (callback) {
  closeIfOpen(this.store, callback);
}

RewindDown.prototype._put = function (key, value, options, callback) {
  const self = this;
  self.store._put(key, value, options, (error, result) => {
    if (error) { return callback(error, result); }
    self.store._put(self.encoder.keyEncoding.encode(self.coder.key(key)), key, options, callback);
  });
}

RewindDown.prototype._get = function (key, options, callback) {
  try {
    this.store._get(key, options, callback);
  } catch (error) {
    callback(error, null);
  }
};

RewindDown.prototype._del = function (key, options, callback) {
  const self = this;
  self.store._del(key, options, (error, result) => {
    if (error) { return callback(error, result); }
    self.store._del(self.encoder.keyEncoding.encode(self.coder.key(key)), options, callback);
  });
};

RewindDown.prototype._clear = function (options, callback) {
  this.store._clear(options, callback);
};

RewindDown.prototype._batch = function (array, options, callback) {
  const self = this;
  const additional = array.map(entry => {
    if (entry.type === 'put') {
      return {
        type: 'put',
        key: self.encoder.keyEncoding.encode(self.coder.key(entry.key)),
        value: entry.key
      };
    }

    if (entry.type === 'del') {
      return {
        type: 'del',
        key: self.encoder.keyEncoding.encode(self.coder.key(entry.key))
      };
    }
  });

  self.store._batch(array.concat(additional), options, callback);
};

RewindDown.prototype._iterator = function(options) {
  return this.store._iterator(options);
};

module.exports = RewindDown;
