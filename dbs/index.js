const IndexDB = require('./IndexDB');
const MemoryDB = require('./MemoryDB');
const LevelUpDB = require('./LevelUpDB');

module.exports = {
  Index: IndexDB,
  Memory: MemoryDB,
  Level: LevelUpDB,
};
