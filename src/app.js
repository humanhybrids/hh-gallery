import adaro from 'adaro';
import express from 'express';
import http from 'http';
import passport from 'passport';
import session from 'express-session';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import config from './util/config';
import gallery from './gallery';
import io from './util/io';
import log from './util/logger';
import initializeGraphQL from './graph';

const app = express();
const server = http.createServer(app);
io.attach(server, { serveClient: false });

app.engine('dust', adaro.dust());
app.set('view engine', 'dust');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
  );
  next();
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK,
    },
    (token, tokenSecret, profile, done) => {
      done(null, { token, tokenSecret, profile });
    },
  ),
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(
  session({
    secret: '@humanhybrids',
    resave: true,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: process.env.LOGIN_REDIRECT,
  }),
);

app.use(gallery);

initializeGraphQL('/graph', app).then(() => {
  const hostname = process.env.HOSTNAME || 'localhost';
  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    log.info(`Server running at https://${hostname}:${port}.`);
  });
});
