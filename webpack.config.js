const path = require('path');

module.exports = [{
    entry: ['babel-polyfill', './src/index.js'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'panoviewer.js'
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
}, {
    entry: ['babel-polyfill', './src/index.js'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'panoviewer.min.js'
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