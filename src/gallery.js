require('./gallery-stream');
const express = require('express');
const { client, createClient } = require('./util/twitter-client');
const { transform, mapStatus } = require('./util/twitter-status-parse');
const querystring = require('querystring');
const log = require('./util/logger');

const router = express.Router();

const getClient = req =>
  req.user ? createClient(req.user.token, req.user.tokenSecret) : client;
const getUsername = req =>
  (req.user && req.user.profile.username) || 'humanhybrids';

function moreTweets(req, query) {
  return new Promise(resolve => {
    let options = query;
    if (typeof query === 'string') {
      options = querystring.parse(query.substring(1));
    }
    log.debug(`getting tweets on behalf of ${getUsername(req)}`);
    getClient(req)
      .get('search/tweets', options)
      .then(response => {
        const { statuses = [] } = response;
        const nextResults = response.search_metadata.next_results;
        if (nextResults) {
          moreTweets(req, nextResults).then(results => {
            resolve([...statuses, ...results]);
          });
        } else {
          resolve(statuses);
        }
      })
      .catch(error => console.error(error));
  });
}

function getTweets(req) {
  return new Promise((resolve, reject) => {
    const cli = getClient(req);
    const requests = [
      moreTweets(req, {
        q: '@MikePanoots filter:media -filter:retweets',
        count: 100,
        result_type: 'recent',
      }),
    ];
    if (req.user) {
      requests.push(cli.get('/favorites/list', { count: 200 }));
      requests.push(
        cli.get('/statuses/user_timeline', {
          count: 200,
          user_id: req.user.profile.id,
        }),
      );
    }
    Promise.all(requests)
      .then(([tweets, favorites = [], timeline = []]) => {
        const retweets = timeline
          .filter(status => status.retweeted_status)
          .map(status => status.retweeted_status.id_str);
        resolve(
          transform(req, tweets, favorites.map(fav => fav.id_str), retweets),
        );
      })
      .catch(reject);
  });
}

router.get('/gallery', (req, res) => {
  getTweets(req)
    .then(tweets => {
      res.json(tweets);
    })
    .catch(error => {
      res.status(500).json({ error });
    });
});

router.get('/panoots', (req, res) => {
  getClient(req)
    .get('statuses/user_timeline', {
      screen_name: 'MikePanoots',
      count: 200,
      trim_user: true,
    })
    .then(response => {
      res.json(response);
    })
    .catch(error => {
      res.status(500).json({ error });
    });
});

router.get('/user/:screen_name', (req, res) => {
  const { screen_name } = req.params;
  getClient(req)
    .get('users/show', { screen_name })
    .then(response => {
      res.json(response);
    })
    .catch(error => {
      res.status(500).json({ error });
    });
});

router.get('/user', (req, res) => {
  if (req.user && req.user.profile) {
    const name = '_json';
    res.json(req.user.profile[name]);
  } else {
    res.sendStatus(401);
  }
});

router.post('/like/:id', (req, res) => {
  if (req.user) {
    log.debug(
      `liking tweet with id ${req.params.id} on behalf of ${getUsername(req)}`,
    );
    const cli = getClient(req);
    const id = req.params.id;
    cli
      .post('/favorites/create', { id })
      .then(() => cli.get(`/statuses/show/${id}`, {}))
      .then(result => res.json(mapStatus(result)))
      .catch(error => res.status(500).json({ error }));
  } else {
    res.sendStatus(401);
  }
});

router.post('/retweet/:id', (req, res) => {
  if (req.user) {
    log.debug(
      `retweeting tweet with id ${req.params.id} on behalf of ${getUsername(
        req,
      )}`,
    );
    const cli = getClient(req);
    const id = req.params.id;
    cli
      .post(`/statuses/retweet/${id}.json`, {})
      .then(() => cli.get(`/statuses/show/${id}`, {}))
      .then(result => res.json(mapStatus(result)))
      .catch(error => res.status(500).json({ error }));
  } else {
    res.sendStatus(401);
  }
});

router.get('/favorited', (req, res) => {
  if (req.user) {
    log.debug(`getting favorited tweets for user ${getUsername(req)}`);
    getClient(req)
      .get('/favorites/list', {})
      .then(result => res.json(result))
      .catch(error => res.status(500).json({ error }));
  } else {
    res.sendStatus(401);
  }
});

module.exports = router;
