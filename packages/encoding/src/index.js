const utils = require('@fuel-js/utils');

// @description encoding-down options
const encoding = {
  keyEncoding: {
    type: 'rlp',
    encode: (v, opts = {}) => {
      if (opts.bypassEncoding) return v;
      if (Array.isArray(v)) {
        // eslint-disable-next-line
        if (v[0]._interfaceKey) {
          return Buffer.from(utils.RLP.encode(v[0].encode(v.slice(1))).slice(2), 'hex');
        }
        return Buffer.from(utils.RLP.encode(v).slice(2), 'hex');
      }
      return Buffer.from(v.slice(2), 'hex');
    },
    // eslint-disable-next-line
    decode: v => '0x' + v.toString('hex'),
    buffer: true,
  },
  valueEncoding: {
    type: 'rlp',
    encode: (v, opts = {}) => {
      if (opts.bypassEncoding) return v;
      // eslint-disable-next-line
      if (v._isStruct === true) return Buffer.from(v.encodeRLP().slice(2), 'hex');
      return Buffer.from(utils.RLP.encode(v).slice(2), 'hex');
    },
    decode: v => {
      try {
        // eslint-disable-next-line
        return utils.RLP.decode('0x' + v.toString('hex'));
      } catch (error) {
        // eslint-disable-next-line
        return '0x' + v.toString('hex');
      }
    },
    buffer: true,
  },
};

module.exports = encoding;
