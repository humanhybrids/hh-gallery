const io = require('./util/io');
const { mapStatus } = require('./util/twitter-status-parse');
const twitter = require('./util/twitter-client');

const MIKE_USERID = 59594931;

twitter.stream('statuses/filter', { track: '@MikePanoots', follow: MIKE_USERID }, (stream) => {
  console.info('[INFO] Connected to twitter stream.');

  stream.on('data', (data) => {
    const status = mapStatus(data);
    if (status.userid === MIKE_USERID) {
      io.emit('dispatch', { type: 'SET_STATUS', status: { text: status.text, created: status.created } });
    }
    if (status.images && status.images.length > 0 && !data.retweeted) {
      io.emit('dispatch', { type: 'PUSH_STATUS', status });
    }
  });

  stream.on('error', (error) => {
    console.error(error);
  });
});
