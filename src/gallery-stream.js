const { mapStatus } = require('./util/twitter-status-parse');
const io = require('./util/io');
const log = require('./util/logger');
const twitter = require('./util/twitter-client');

const MIKE_USERID = 59594931;

if (process.env.STREAMS_ENABLED) {
  twitter.stream('statuses/filter', { track: '@MikePanoots', follow: MIKE_USERID }, (stream) => {
    log.info('Connected to twitter stream.');

    stream.on('data', (data) => {
      const status = mapStatus(data);
      if (status.userid === MIKE_USERID) {
        log.trace(`dispatch SET_STATUS text: ${status.text}, created: ${status.created}`);
        io.emit('dispatch', { type: 'SET_STATUS', status: { text: status.text, created: status.created } });
      }
      if (status.images && status.images.length > 0 && !data.retweeted) {
        log.trace(`dispatch PUSH_STATUS status: ${JSON.stringify(status)}`);
        io.emit('dispatch', { type: 'PUSH_STATUS', status });
      }
    });

    stream.on('error', error => log.error(error));
  });
}
