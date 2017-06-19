const express = require('express');
const router = express.Router();
const client = require('./client');
const tweets = require('../../db/tweets');

const extract = {
    status: function ({ id_str: _id, text, user: { screen_name, name }, created_at, entities, extended_entities }) {
        var mentions = (entities.user_mentions || []).map(u => u.screen_name);
        return { _id, text, screen_name, name, mentions, created_at, media: extract.media({ entities, extended_entities }) };
    },
    media: function ({ entities: { media = [] } = {}, extended_entities: { media: extended_media } = {} }) {
        return [...(extended_media || media).map(extract.data)];
    },
    data: function ({ media_url, media_url_https, type, sizes, video_info }) {
        return { media_url, media_url_https, type, sizes, video_info };
    }
}

router.get('/:username', (req, res) => {
    var username = req.params.username;
    client.get('search/tweets', { q: `@${username} filter:media -filter:retweets`, count: 100, result_type: 'recent' })
        .then(r => {
            var statuses = r.statuses.map(extract.status);
            tweets.db.bulk({ docs: statuses });
            res.format({
                "text/html": function () {
                    res.render('media', { statuses, username });
                },
                "application/json": function () {
                    res.json(statuses);
                }
            });
        })
        .catch(err => console.warn(err));
});

module.exports = router;
