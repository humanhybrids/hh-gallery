const bigInt = require('big-integer');

const mapStatus = (status, favorited = false, retweeted = false) => {
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
    userid: status.user.id_str,
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
    favorited: status.favorited || favorited,
    retweeted: status.retweeted || retweeted,
  };
};

const transform = (req, statuses, favorites = [], retweets = []) => {
  const data = statuses.map(status => (
    mapStatus(status, favorites.includes(status.id_str), retweets.includes(status.id_str))
  ));
  const base = `https://${req.get('host')}${req.path}`;
  const first = statuses[0].id_str;
  const last = bigInt(statuses[statuses.length - 1].id_str).subtract(bigInt.one).toString();
  const links = {
    self: `${base}?page[max_id]=${first}`,
    next: `${base}?page[max_id]=${last}`,
    first: base,
  };
  return { data, links };
};

exports.transform = transform;
exports.mapStatus = mapStatus;
