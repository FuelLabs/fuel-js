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
    'arrow-parens': ['off'],
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['./src/test/*'] }],
    'no-await-in-loop': ['off'],
    'no-plusplus': ['off'],
    'global-require': ['off'],
    'func-names': ['off'],
    camelcase: ['off'],
  },
};
