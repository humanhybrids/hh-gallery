const express = require('express');
const client = require('./client');

const router = express.Router();

router.get('/:username', (req, res) => {
  const { username } = req.params;
  const { page: { max_id } = {} } = req.query;
  client.get('search/tweets', {
    q: `@${username} filter:media -filter:retweets`,
    count: 100,
    result_type: 'recent',
    max_id,
  }).then((response) => {
    res.format({
      'text/html': () => {
        res.render('media', { username, statuses: response.statuses });
      },
      json: () => {
        res.json(response);
      },
    });
  }).catch((error) => {
    res.status(500).json({ error });
  });
});

module.exports = router;
