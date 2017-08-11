require('dotenv').config();
const adaro = require('adaro');
const api = require('./src/api');
const express = require('express');
const http = require('http');
const io = require('./src/util/io');

const app = express();
const server = http.createServer(app);
io.attach(server, { serveClient: false });

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

if (!module.parent) {
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running at https://${hostname}:${port}.`);
  });
}
