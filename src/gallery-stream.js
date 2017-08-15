const { mapStatus } = require('./util/twitter-status-parse');
const io = require('./util/io');
const log = require('./util/logger');
const { client: twitter } = require('./util/twitter-client');

const MIKE_USERID = 59594931;

/**
 * Twitter API only allows a single connection via streams. This will
 * likely improve when Twitter uses web hooks instead of streaming connections.
 * Only activate streams when deployed.
 * Also, this will only work with a single deployed instance.
 * TODO: Need to create a single streaming service app to provide data to API services.
 */
if (process.env.STREAMS_ENABLED) {
  twitter.stream('statuses/filter', { track: '@MikePanoots', follow: MIKE_USERID }, (stream) => {
    log.info('Connected to twitter stream.');

    stream.on('data', (data) => {
      const status = mapStatus(data);
      if (status.userid === MIKE_USERID) {
        log.trace(`dispatch SET_STATUS text: ${status.text}, created: ${status.created}`);
        io.emit('dispatch', { type: 'SET_STATUS', status: { text: status.text, created: status.created } });
      }
      if (status.images && status.images.length > 0 && !data.retweeted_status) {
        log.trace(`dispatch PUSH_STATUS status: ${JSON.stringify(status)}`);
        io.emit('dispatch', { type: 'PUSH_STATUS', status });
      }
    });

    stream.on('error', error => log.error(error));
  });
}
