
require('dotenv').config();
const express = require('express');
const adaro = require('adaro');
const http = require('http');
const api = require('./api/api');

const app = express();
const server = http.createServer(app);

app.engine('dust', adaro.dust());
app.set('view engine', 'dust');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(api);

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at https://${hostname}:${port}.`);
});
