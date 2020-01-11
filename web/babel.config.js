module.exports = {
  presets: [
    '@vue/app',
    ['@babel/preset-env', { modules: false }],
  ],
  plugins: [
    [
      'component',
      {
        libraryName: 'element-ui',
        styleLibraryName: 'theme-chalk',
      },
    ],
    [
      '@babel/plugin-proposal-class-properties',
    ],
    [
      '@babel/plugin-proposal-optional-chaining',
    ],
  ],
}
