module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? ['warn', { allow: ['warn', 'error'] }] : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    semi: [2, 'never'],
    'max-len': [2, { code: 150 }],
    'linebreak-style': [0, 'error', 'windows'],
    camelcase: 0,
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
