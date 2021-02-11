const coder = require('@fuel-js/rolled');
const utils = require('@fuel-js/utils');

function Key(key, ...arr) {
  if (!(this instanceof Key)) return new Key(key, ...arr);
  const self = this;

  // eslint-disable-next-line
  self._interfaceKey = true;
  self.key = key;

  self.sizes = (['uint8 index'].concat(arr))
    .map(type => coder.parse(utils.parseParamType(type)).size);

  self.encode = values => {
    const keyAndValues = [self.key].concat(values);
    utils.assert(keyAndValues.length === self.sizes.length, 'invalid key length');
    return keyAndValues.map((value, i) => {
      const hexed = utils.hexlify(value);

      // check overflow
      if (((hexed.length - 2) / 2) > self.sizes[i]) {
        utils.assert(0, `key-length-overflow-${((hexed.length - 2) / 2)}-${self.sizes[i]}-${hexed}`);
      }

      return utils.hexZeroPad(hexed, self.sizes[i]);
    });
  };
}

module.exports = Key;
