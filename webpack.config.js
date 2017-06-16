
const path = require('path');

const config = {
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, 'public', 'js'),
        filename: 'main.js'
    }
};

module.exports = config;
