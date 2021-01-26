// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
const tsTransformer = require('@formatjs/ts-transformer');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

const outpath = path.resolve(__dirname, 'pack');

function makeCommonConfig() {
    const commonConfig = {
        target: 'web',
        mode: 'development',
        node: {
            __dirname: false,
            __filename: false,
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
                    loader: 'file-loader',
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        'style-loader',
                        'css-loader',
                        'sass-loader',
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
                    test: /\.(tsx?|js|jsx|html)$/,
                    use: [
                    ],
                    exclude: [/node_modules/],
                },
            ],
        },
        resolve: {
            modules: [
                'node_modules',
                path.resolve(__dirname),
            ],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    {from: path.resolve(__dirname, 'static'), to: 'static'},
                    {from: path.resolve(__dirname, 'node_modules/easymde/dist/easymde.min.css'), to: 'static'},
                ],
            }),
            new HtmlWebpackPlugin({
                inject: true,
                title: 'Focalboard',
                chunks: ['main'],
                template: 'html-templates/page.ejs',
                filename: 'index.html',
                publicPath: '/',
            }),
        ],
        entry: {
            main: './src/main.tsx',
        },
        output: {
            filename: 'static/[name].js',
            path: outpath,
        },
    };

    return commonConfig;
}

module.exports = makeCommonConfig;
