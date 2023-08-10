// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
const exec = require('child_process').exec;

const path = require('path');

const webpack = require('webpack');
const {ModuleFederationPlugin} = require('webpack').container;

const tsTransformer = require('@formatjs/ts-transformer');

const PLUGIN_ID = require('../plugin.json').id;

const NPM_TARGET = process.env.npm_lifecycle_event; //eslint-disable-line no-process-env
const TARGET_IS_PRODUCT = NPM_TARGET?.endsWith(':product');

let mode = 'production';
let devtool;
const plugins = [];
if (NPM_TARGET === 'debug' || NPM_TARGET === 'debug:watch' || NPM_TARGET === 'start:product') {
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

const config = {
    entry: TARGET_IS_PRODUCT ? './src/remote_entry.ts' : './src/plugin_entry.ts',
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
                test: /\.(png|eot|tiff|svg|ttf|jpg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: '[name][ext]',
                    publicPath: TARGET_IS_PRODUCT ? undefined : '/static/',
                }
            },
            {
                test: /\.(woff2|woff)$/,
                type: 'asset/resource',
                generator: {
                    filename: '[name][ext]',
                    publicPath: TARGET_IS_PRODUCT ? undefined : '/plugins/focalboard/static/',
                }
            },
        ],
    },
    devtool,
    mode,
    plugins,
};

if (TARGET_IS_PRODUCT) {
    // Set up module federation
    function makeSingletonSharedModules(packageNames) {
        const sharedObject = {};

        for (const packageName of packageNames) {
            sharedObject[packageName] = {

                // Ensure only one copy of this package is ever loaded
                singleton: true,

                // Set this to false to prevent Webpack from packaging any "fallback" version of this package so that
                // only the version provided by the web app will be used
                import: false,

                // Set these to false so that any version provided by the web app will be accepted
                requiredVersion: false,
                version: false
            };
        }

        return sharedObject;
    }

    config.plugins.push(new ModuleFederationPlugin({
        name: 'boards',
        filename: 'remote_entry.js',
        exposes: {
            '.': './src/index',

            // This probably won't need to be exposed in the long run, but its a POC for exposing multiple modules
            './manifest': './src/manifest',
        },
        shared: [
            '@mattermost/client',
            'prop-types',

            makeSingletonSharedModules([
                'react',
                'react-dom',
                'react-intl',
                'react-redux',
                'react-router-dom',
            ]),
        ],
    }));

    config.plugins.push(new webpack.DefinePlugin({
        'process.env.TARGET_IS_PRODUCT': TARGET_IS_PRODUCT, // TODO We might want a better name for this
    }));

    config.output = {
        path: path.join(__dirname, '/dist'),
        chunkFilename: '[name].[contenthash].js',
    };
} else {
    config.resolve.alias['react-intl'] = path.resolve(__dirname, '../../webapp/node_modules/react-intl/');

    config.externals = {
        react: 'React',
        'react-dom': 'ReactDOM',
        redux: 'Redux',
        'react-redux': 'ReactRedux',
        'mm-react-router-dom': 'ReactRouterDom',
        'prop-types': 'PropTypes',
        'react-bootstrap': 'ReactBootstrap',
    };

    config.output = {
        devtoolNamespace: PLUGIN_ID,
        path: path.join(__dirname, '/dist'),
        publicPath: '/',
        filename: 'main.js',
    };
}

const env = {};
env.RUDDER_KEY = JSON.stringify(process.env.RUDDER_KEY || ''); //eslint-disable-line no-process-env
env.RUDDER_DATAPLANE_URL = JSON.stringify(process.env.RUDDER_DATAPLANE_URL || ''); //eslint-disable-line no-process-env

config.plugins.push(new webpack.DefinePlugin({
    'process.env': env,
}));

if (NPM_TARGET === 'start:product') {
    const url = new URL(process.env.MM_BOARDS_DEV_SERVER_URL ?? 'http://localhost:9006');

    config.devServer = {
        server: {
            type: url.protocol.substring(0, url.protocol.length - 1),
            options: {
                minVersion: process.env.MM_SERVICESETTINGS_TLSMINVER ?? 'TLSv1.2',
                key: process.env.MM_SERVICESETTINGS_TLSKEYFILE,
                cert: process.env.MM_SERVICESETTINGS_TLSCERTFILE,
            },
        },
        host: url.hostname,
        port: url.port,
        devMiddleware: {
            writeToDisk: false,
        },
        static: {
            directory: path.join(__dirname, '../../webapp/static'),
            publicPath: '/static',
        },
    };
}

module.exports = config;
