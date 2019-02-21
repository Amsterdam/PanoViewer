const path = require('path');
const test = path.resolve(__dirname, 'test');

module.exports = [{
    entry: ['@babel/polyfill', './src/index.js'],
    mode: 'development',
    output: {
        path: test,
        publicPath: 'test/',
        filename: 'panoviewer-dev.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: 'css-loader'
            }, {
                test: /node_modules/,
                loader: 'ify-loader'
            }, {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    devtool: 'source-map',
    devServer: {
      historyApiFallback: true,
      disableHostCheck: true,
      compress: true,
      port: 3002
    }
}];
