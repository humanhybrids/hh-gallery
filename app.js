require('dotenv').config();
const express = require('express');
const adaro = require('adaro');
const http = require('http');
const twitterIndex = require('./api/twitter/index');
const twitterMedia = require('./api/twitter/media');

const app = express();
const server = http.createServer(app);

app.engine('dust', adaro.dust());
app.use('/api/twitter', twitterIndex);
app.use('/api/twitter/media', twitterMedia);
app.set('view engine', 'dust');

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at https://${hostname}:${port}.`);
});
