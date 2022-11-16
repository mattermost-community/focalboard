// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
const merge = require('webpack-merge');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const makeCommonConfig = require('./webpack.common.js');

const commonConfig = makeCommonConfig();

const config = merge.merge(commonConfig, {
    mode: 'development',
    devtool: 'inline-source-map',
    optimization: {
        minimize: false,
    },
    devServer: {
        port: 9000,
        open: "/editor.html",
    },
    entry: ['./src/components/blocksEditor/devmain.tsx'],
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: path.resolve(__dirname, 'static'), to: 'static'},
            ],
        }),
        new HtmlWebpackPlugin({
            inject: true,
            title: 'Focalboard',
            chunks: ['main'],
            template: 'html-templates/deveditor.ejs',
            filename: 'editor.html',
            publicPath: '/',
            hash: true,
        }),
    ],
});

module.exports = [
    merge.merge(config, {
        devtool: 'source-map',
        output: {
            devtoolNamespace: 'focalboard',
        },
    }),
];
