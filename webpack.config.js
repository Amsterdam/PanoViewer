const path = require('path');

module.exports = {
    entry: './src/PanoViewer.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'panoviewer.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    }
};