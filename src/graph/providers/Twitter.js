const TwitterClient = require('twitter');
const DataLoader = require('dataloader');

function serializeKey(key) {
  return Object.keys(key).map(id => key[id]).join('-');
}

module.exports = class Twitter {
  constructor({
    token = process.env.TWITTER_ACCESS_TOKEN_KEY,
    tokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET,
  }) {
    this.client = new TwitterClient({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: token,
      access_token_secret: tokenSecret,
    });
    this.loader = new DataLoader(options => this.load(options), { serializeKey });
    this.userLoader = new DataLoader(keys => this.loadUsers(keys));
  }

  load(options) {
    return Promise.all(options.map(option => this.client.get(option.uri, option)));
  }
  loadUsers(keys) {
    return this.client.get('users/lookup', { screen_name: keys.join(',') });
  }

  get(options) {
    return this.loader.load(options);
  }
  getUser(name) {
    return this.userLoader.load(name);
  }
};
