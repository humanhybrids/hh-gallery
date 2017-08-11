require('./gallery-stream');
const express = require('express');
const client = require('./util/twitter-client');
const { transform } = require('./util/twitter-status-parse');
const querystring = require('querystring');

const router = express.Router();

function moreTweets(query) {
  return new Promise((resolve) => {
    let options = query;
    if (typeof query === 'string') {
      options = querystring.parse(query.substring(1));
    }
    client.get('search/tweets', options).then((response) => {
      const { statuses = [] } = response;
      const nextResults = response.search_metadata.next_results;
      if (nextResults) {
        moreTweets(nextResults).then((results) => {
          resolve([...statuses, ...results]);
        });
      } else {
        resolve(statuses);
      }
    }).catch(error => console.error(error));
  });
}

function getTweets(req) {
  return new Promise((resolve) => {
    moreTweets({ q: '@MikePanoots filter:media -filter:retweets', count: 100, result_type: 'recent' }).then((tweets) => {
      resolve(transform(tweets, req));
    });
  });
}

router.get('/gallery', (req, res) => {
  getTweets(req).then((tweets) => {
    res.json(tweets);
  }).catch((error) => {
    res.status(500).json({ error });
  });
});

router.get('/panoots', (req, res) => {
  client.get('statuses/user_timeline', { screen_name: 'MikePanoots', count: 200, trim_user: true }).then((response) => {
    res.json(response);
  }).catch((error) => {
    res.status(500).json({ error });
  });
});

router.get('/user/:screen_name', (req, res) => {
  const { screen_name } = req.params;
  client.get('users/show', { screen_name }).then((response) => {
    res.json(response);
  }).catch((error) => {
    res.status(500).json({ error });
  });
});

module.exports = router;
