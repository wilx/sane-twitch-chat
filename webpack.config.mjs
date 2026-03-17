import { join, resolve as pathResolve } from 'path';
import { UserscriptPlugin } from 'webpack-userscript';

const __dirname = import.meta.dirname;

export default {
    mode: 'production',
    entry: {
        'sane-twitch-chat': join(__dirname, 'src', 'index.js')
    },
    output: {
        path: pathResolve(__dirname, 'output'),
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
                                    corejs: '3',
                                    shippedProposals: true
                                }
                            ]
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime',
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
        minimize: false,
        usedExports: true
    },
    plugins: [
        new UserscriptPlugin({
            headers(original) {
                return {
                    ...original,
                    name: '[name]',
                    // version: '[version]',
                    author: 'wilx',
                    homepage: 'https://github.com/wilx/sane-twitch-chat',
                    namespace: 'https://github.com/wilx/sane-twitch-chat',
                    downloadURL: 'https://github.com/wilx/sane-twitch-chat/raw/master/output/index.user.js',
                    updateURL: 'https://github.com/wilx/sane-twitch-chat/raw/master/output/index.user.js',
                    match: 'https://www.twitch.tv/*',
                    'run-at': 'document-end',
                    grant: ['GM.cookie', 'GM.info']
                };
            },
            pretty: true
        })
    ],
    resolve: {
        alias: {
            node_modules: join(__dirname, 'node_modules')
        }
    }
};