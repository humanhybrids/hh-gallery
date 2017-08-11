const log4js = require('log4js');
const pkg = require('../../package.json');

const logger = log4js.getLogger(pkg.name);

logger.level = process.env.LOG4JS_LEVEL || 'debug';

module.exports = logger;
