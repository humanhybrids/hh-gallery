require('dotenv').config();
const express = require('express');
const adaro = require('adaro');
const http = require('http');
const api = require('./api/api');
const twitter = require('./api/util/twitter-client');
const { mapStatus } = require('./api/util/twitter-status-parse');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { serveClient: false });

app.engine('dust', adaro.dust());
app.set('view engine', 'dust');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(api);

/**
 * This watches for Mike's status changes to update the header.
 * TODO: This should probably go somewhere else. For now, I will just put it here.
 */
const stream = twitter.stream('statuses/filter', { follow: '59594931' });
stream.on('data', ({ text, created_at: created }) => {
  io.emit('dispatch', { type: 'SET_STATUS', status: { text, created } });
});
stream.on('error', (error) => {
  console.error(error);
});

/**
 * This watches for new images posted to @MikePanoots
 */
const statusStream = twitter.stream('statuses/filter', { track: '@MikePanoots' });
statusStream.on('data', (status) => {
  const response = mapStatus(status);
  if ((response.images && response.images.length > 0) || response.video) {
    io.emit('dispatch', { type: 'PUSH_STATUS', status: mapStatus(status) });
  }
});
statusStream.on('error', (error) => {
  console.error(error);
});

io.on('connection', (socket) => {
  console.log(`user connected: ${socket.client.id}`);
});
/**
 * END TODO.
 */

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

if (!module.parent) {
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running at https://${hostname}:${port}.`);
  });
}

exports.io = io;
exports.server = server;
