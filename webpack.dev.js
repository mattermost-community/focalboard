const merge = require("webpack-merge");
const makeCommonConfig = require("./webpack.common.js");

const commonConfig = makeCommonConfig();

const config = merge.merge(commonConfig, {
	mode: "development",
	devtool: "inline-source-map",
	optimization: {
		minimize: false
	}
});

module.exports = [
	merge.merge(config, {
	}),
];
