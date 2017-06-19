require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const adaro = require('adaro');

// app.use(express.static(path.resolve(__dirname, 'client')));
app.engine('dust', adaro.dust());
app.use('/api/twitter', require('./api/twitter/index'));
app.use('/api/twitter/media', require('./api/twitter/media'));
app.set('view engine', 'dust');

io.on('connection', socket => {
    console.log('connected');
});

http.listen(process.env.PORT || 3000);
