module.exports = {
  created(tweet) {
    return tweet.created_at;
  },
  id(tweet) {
    return tweet.id_str;
  },
  favoriteCount(tweet) {
    return tweet.favorite_count;
  },
  retweetCount(tweet) {
    return tweet.retweet_count;
  },
};
