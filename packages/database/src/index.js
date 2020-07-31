// @description database wrapper for leveldown
const levelup = require('levelup');
const encoding = require('@fuel-js/encoding');
const encode = require('encoding-down');

function db(down) {
  return levelup(encode(down, encoding));
}

module.exports = db;
