// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
const exec = require('child_process').exec;

const path = require('path');

const webpack = require('webpack');

const tsTransformer = require('@formatjs/ts-transformer');

const PLUGIN_ID = require('../plugin.json').id;

const NPM_TARGET = process.env.npm_lifecycle_event; //eslint-disable-line no-process-env
let mode = 'production';
let devtool;
const plugins = [];
if (NPM_TARGET === 'debug' || NPM_TARGET === 'debug:watch') {
    mode = 'development';
    devtool = 'source-map';
    plugins.push(
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
        }),
    );
}

if (NPM_TARGET === 'build:watch' || NPM_TARGET === 'debug:watch' || NPM_TARGET === 'live-watch') {
    plugins.push({
        apply: (compiler) => {
            compiler.hooks.watchRun.tap('WatchStartPlugin', () => {
                // eslint-disable-next-line no-console
                console.log('Change detected. Rebuilding webapp.');
            });
            compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
                let command = 'cd .. && make deploy-from-watch';
                if (NPM_TARGET === 'live-watch') {
                    command = 'cd .. && make deploy-to-mattermost-directory';
                }
                exec(command, (err, stdout, stderr) => {
                    if (stdout) {
                        process.stdout.write(stdout);
                    }
                    if (stderr) {
                        process.stderr.write(stderr);
                    }
                });
            });
        },
    });
}

module.exports = {
    entry: [
        './src/index.tsx',
    ],
    resolve: {
        modules: [
            'src',
            'node_modules',
            path.resolve(__dirname),
        ],
        alias: {
            moment: path.resolve(__dirname, '../../webapp/node_modules/moment/'),
        },
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        getCustomTransformers: {
                            before: [
                                tsTransformer.transform({
                                    overrideIdFn: '[sha512:contenthash:base64:6]',
                                    ast: true,
                                }),
                            ],
                        },
                    },
                },
                exclude: [/node_modules/],

            },
            {
                test: /\.html$/,
                type: 'asset/resource',
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                    path.resolve(__dirname, 'loaders/globalScssClassLoader'),
                ],
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.(tsx?|js|jsx|mjs|html)$/,
                use: [
                ],
                exclude: [/node_modules/],
            },
            {
                test: /\.(png|eot|tiff|svg|woff2|woff|ttf|jpg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'static/[name].[ext]',
                }
            },
        ],
    },
    externals: {
        react: 'React',
        redux: 'Redux',
        'react-redux': 'ReactRedux',
        'mm-react-router-dom': 'ReactRouterDom',
        'prop-types': 'PropTypes',
        'react-bootstrap': 'ReactBootstrap',
    },
    output: {
        devtoolNamespace: PLUGIN_ID,
        path: path.join(__dirname, '/dist'),
        publicPath: '/',
        filename: 'main.js',
    },
    devtool,
    mode,
    plugins,
};

const env = {};
env.RUDDER_KEY = JSON.stringify(process.env.RUDDER_KEY || ''); //eslint-disable-line no-process-env
env.RUDDER_DATAPLANE_URL = JSON.stringify(process.env.RUDDER_DATAPLANE_URL || ''); //eslint-disable-line no-process-env

module.exports.plugins.push(new webpack.DefinePlugin({
    'process.env': env,
}));
