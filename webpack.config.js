const path = require('path')
const WebpackUserscript = require('webpack-userscript')

module.exports = {
  mode: 'production',
  entry: {
    'sane-twitch-chat': path.join(__dirname, 'index.js')
  },
  output: {
    path: path.resolve(__dirname, 'output'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  debug: true,
                  useBuiltIns: "usage",
                  corejs: "3",
                  "targets": {
                    "browsers": [
                      "last 2 chrome version",
                      "last 2 firefox version"
                    ]
                  }
                }
              ]
            ]
          }
        }
      }
    ]
  },
  stats: {
    colors: true
  },
  devtool: 'source-map',
  optimization: {
    minimize: false
  },
  plugins: [
    new WebpackUserscript({
      headers: {
        name: '[name]',
        version: '[version]-build.[buildNo]',
        author: 'wilx',
        homepage: 'https://github.com/wilx/sane-twitch-chat',
        namespace: 'https://github.com/wilx/sane-twitch-chat',
        match: 'https://www.twitch.tv/*',
        'run-at': 'document-end',
        grant: 'none'
      },
      pretty: true
    })
  ],
  resolve: {
    alias: {
        'node_modules': path.join(__dirname, 'node_modules')
    }
  }
}
