const merge = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const makeCommonConfig = require("./webpack.common.js");

const commonConfig = makeCommonConfig();

const config = merge.merge(commonConfig, {
	mode: "production",
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin({})]
	}
});

module.exports = [
	merge.merge(config, {
	}),
];
