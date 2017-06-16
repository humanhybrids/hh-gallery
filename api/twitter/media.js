const express = require('express');
const router = express.Router();
const client = require('./client');
const tweets = require('../../db/tweets');

router.get('/:username', (req, res) => {
    client.get('search/tweets', { q: `@${req.params.username} filter:media -filter:retweets`, count: 10, result_type: 'recent' })
        .then(r => {
            tweets.db.bulk({ docs: r.statuses.map(t => (t._id = t.id_str, t)) })
            res.json(r.statuses)
        })
        .catch(err => console.warn(err));
});

module.exports = router;
