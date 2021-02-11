const path = require('path');
const production = process.env.NODE_ENV === 'production';

module.exports = {
  entry: './src/index.js',
  output: {
    library: 'fuel',
    libraryTarget: 'umd',
    filename: `fuel.umd${production ? '.min' : ''}.js`,
    path: path.resolve(__dirname, '../umd'),
  },
  optimization: {
    minimize: production,
  }
};
