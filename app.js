require('dotenv').config();
const adaro = require('adaro');
const express = require('express');
const gallery = require('./src/gallery');
const http = require('http');
const io = require('./src/util/io');
const log = require('./src/util/logger');
const passport = require('passport');
const session = require('express-session');
const TwitterStrategy = require('passport-twitter').Strategy;
const graph = require('./src/graph/index');
const { graphiqlExpress } = require('apollo-server-express');

const app = express();
const server = http.createServer(app);
io.attach(server, { serveClient: false });

app.engine('dust', adaro.dust());
app.set('view engine', 'dust');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.TWITTER_CALLBACK,
}, (token, tokenSecret, profile, done) => {
  done(null, { token, tokenSecret, profile });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(session({
  secret: '@humanhybrids',
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: process.env.LOGIN_REDIRECT }));
app.use('/graph/docs', graphiqlExpress({
  endpointURL: '/graph',
}));
app.use('/graph', graph);

app.use(gallery);

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

if (!module.parent) {
  server.listen(port, () => {
    log.info(`Server running at https://${hostname}:${port}.`);
  });
}
