const path = require('path');

module.exports = {
    entry: './js/PanoViwer.js',
    output: {
        path: path.reslove(__dirname, 'dist'),
        filename: 'panoviewer.js'
    }
};