const os = require('os')

module.exports = {
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'assets',
  indexPath: 'index.html',
  runtimeCompiler: true,
  transpileDependencies: [],
  productionSourceMap: false,
  parallel: os.cpus().length > 1,
  devServer: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/',
        },
      },
    },
  },
}
