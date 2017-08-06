const express = require('express');
const client = require('./util/twitter-client');
const bigInt = require('big-integer');
const querystring = require('querystring');

const router = express.Router();

function mapStatus(statuses) {
  return statuses.map((status) => {
    const {
      entities: { media: defaultMedia = [], hashtags = [] },
      extended_entities: { media = defaultMedia } = {},
    } = status;
    const videos = media.filter(i => ['video', 'animated_gif'].includes(i.type));
    let video;
    if (videos.length) {
      const [{ id_str: id, type, media_url_https: thumb, video_info: { variants = [] } }] = videos;
      video = { id, isGIF: type === 'animated_gif', thumb, src: variants.map(i => ({ type: i.content_type, url: i.url })) };
    }
    return {
      created: status.created_at,
      id: status.id_str,
      text: status.text,
      username: status.user.screen_name,
      tags: hashtags.map(i => i.text),
      images: media
        .filter(i => i.type === 'photo')
        .map(i => ({
          id: i.id_str,
          url: i.media_url_https,
          sizes: Object.keys(i.sizes).map(size => Object.assign({ size }, i.sizes[size])),
        })),
      video,
      favorites: status.favorite_count,
      retweets: status.retweet_count,
    };
  });
}

function transform(statuses, req) {
  const data = mapStatus(statuses);
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

/**
 *
 * @param {string|object} query
 */
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
