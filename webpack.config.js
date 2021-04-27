const path = require('path');
const WebpackUserscript = require('webpack-userscript');
const JsDocPlugin = require('jsdoc-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        'sane-twitch-chat': path.join(__dirname, 'src', 'index.js')
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
                                    useBuiltIns: 'usage',
                                    corejs: '3'
                                }
                            ]
                        ],
                        plugins: [
                            // 'babel-plugin-minify-constant-folding',
                            'babel-plugin-minify-guarded-expressions',
                            ['babel-plugin-transform-remove-undefined', {
                                tdz: true
                            }],
                            'babel-plugin-transform-simplify-comparison-operators',
                            ['babel-plugin-minify-dead-code-elimination', {
                                tdz: true
                            }]
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
                version: '[version]',
                author: 'wilx',
                homepage: 'https://github.com/wilx/sane-twitch-chat',
                namespace: 'https://github.com/wilx/sane-twitch-chat',
                downloadURL: 'https://github.com/wilx/sane-twitch-chat/raw/master/output/index.user.js',
                match: 'https://www.twitch.tv/*',
                'run-at': 'document-end',
                grant: 'none'
            },
            pretty: true
        }),
        new JsDocPlugin({
            conf: path.join(__dirname, 'jsdoc.conf.json')
        })
    ],
    resolve: {
        alias: {
            node_modules: path.join(__dirname, 'node_modules')
        }
    }
};
