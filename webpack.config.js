const path = require('path');

module.exports = (env, options) => [
  /** Server Config */
  {
    target: 'node',
    entry: './src/main_server.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main_server.js',
    },
    resolve: {
      modules: ['node_modules', path.resolve(__dirname, 'src')]
    },
    devtool: options.mode === 'development' ? 'cheap-source-map' : false
  },
  /** Client Config */
  {
    target: 'web',
    entry: './src/main_client.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main_client.js',
    },
    resolve: {
      modules: ['node_modules', path.resolve(__dirname, 'src')]
    },
    devtool: options.mode === 'development' ? 'cheap-source-map' : false
  }
];