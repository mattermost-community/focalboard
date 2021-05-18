// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
const merge = require('webpack-merge');

const makeCommonConfig = require('./webpack.common.js');

const commonConfig = makeCommonConfig();

const config = merge.merge(commonConfig, {
    mode: 'development',
    devtool: 'inline-source-map',
    optimization: {
        minimize: false,
    },
});

module.exports = [
    merge.merge(config, {
        devtool: 'source-map',
        output: {
            devtoolNamespace: 'focalboard',
        },
    }),
];
