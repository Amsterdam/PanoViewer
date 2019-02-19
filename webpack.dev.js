const path = require('path');
const dist = path.resolve(__dirname, 'dist');
module.exports = [{
    entry: ['@babel/polyfill', './src/index.js'],
    mode: 'development',
    output: {
        path: dist,
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
    },
}];
