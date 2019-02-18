const path = require('path');
// const webpack = require('webpack');

module.exports = [{
    entry: ['@babel/polyfill', './src/index.js'],
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'panoviewer.js'
    },
    resolve: {
        extensions: ['.js'],
        modules: ['./node_modules']
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
    }
}];
