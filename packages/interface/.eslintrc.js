module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'no-plusplus': ['off'],
    'arrow-parens': ['off'],
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['./src/test/*'] }],
    camelcase: ['off'],
  },
};
