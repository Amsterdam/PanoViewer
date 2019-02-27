const path = require('path');

module.exports = [{
    entry: ['@babel/polyfill', './src/index.js'],
    mode: 'none',
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
    entry: ['@babel/polyfill', './src/index.js'],
    mode: 'production',
        output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'panoviewer.min.js'
    },
    plugins: [
    ],
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
   entry: ['@babel/polyfill', './src/index.js'],
    mode: 'none',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'panoviewer.core.js'
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    externals: {
        "marzipano": {
            commonjs: "marzipano",
            commonjs2: "marzipano",
            amd: "marzipano",
            root: "_"
        }
    }
}, {
    entry: ['@babel/polyfill', './src/index.js'],
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'panoviewer.core.min.js'
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    plugins: [
    ],
    externals: {
        "marzipano": {
            commonjs: "marzipano",
            commonjs2: "marzipano",
            amd: "marzipano",
            root: "_"
        }
    }
}
];
