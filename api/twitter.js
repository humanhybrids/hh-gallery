
const express = require('express');
const client = require('./util/twitter-client');

const router = express.Router();

router.get('/', (req, res) => {
  client.get('application/rate_limit_status', {})
    .then(data => res.json(data))
    .catch(error => res.status(500).json({ error }));
});

router.get('/media/:username', (req, res) => {
  const { params: { username }, query: { page: { max_id, count = 100 } = {} } } = req;
  const q = `@${username} filter:media -filter:retweets`;
  client.get('search/tweets', { q, count, max_id, result_type: 'recent' })
    .then((response) => {
      res.format({
        'text/html': () => res.render('media', { username, statuses: response.statuses }),
        json: () => res.json(response),
      });
    }).catch((error) => {
      res.status(500).json({ error });
    });
});

module.exports = router;
