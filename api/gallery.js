
const express = require('express');
const client = require('./util/twitter-client');
const bigInt = require('big-integer');

const router = express.Router();

function transform(response, req) {
  const { statuses = [] } = response;

  const data = statuses.map((status) => {
    const {
      created_at: created, id_str: id, text,
      entities: { media: defaultMedia = [], hashtags = [] },
      extended_entities: { media = defaultMedia } = {},
      user: { id_str: userid, screen_name: username },
    } = status;
    const tags = hashtags.map(i => i.text);
    const images = media
      .filter(i => i.type === 'photo')
      .map(i => ({ id: i.id_str, url: i.media_url_https }));
    const videos = media.filter(i => i.type === 'video' || i.type === 'animated_gif');
    let video;
    if (videos.length) {
      const [{ media_url_https: thumb, video_info: { variants = [] } }] = videos;
      video = { thumb, src: variants.map(({ content_type: type, url }) => ({ type, url })) };
    }
    return { created, id, text, userid, username, tags, images, video };
  });

  const base = `https://${req.get('host')}${req.path}`;
  const first = statuses[0].id_str;
  const last = bigInt(statuses[statuses.length - 1].id_str).subtract(bigInt.one).toString();
  const links = {
    self: `${base}?page[max_id]=${first}`,
    next: `${base}?page[max_id]=${last}`,
    first: base,
  };

  return { data, links };
}

router.get('/gallery', (req, res) => {
  const { query: { page: { max_id, count = 100 } = {} } } = req;
  const username = 'MikePanoots';
  const q = `@${username} filter:media -filter:retweets`;
  client.get('search/tweets', { q, count, max_id, result_type: 'recent' }).then((response) => {
    res.format({
      'text/html': () => res.render('media', { username, statuses: response.statuses }),
      json: () => res.json(transform(response, req)),
    });
  }).catch((error) => {
    res.status(500).json({ error });
  });
});

module.exports = router;
