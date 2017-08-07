const cfenv = require('cfenv');
const cloudant = require('cloudant');
const vcap = require('../config/vcap-local.json');

module.exports = class Database {
  constructor(name) {
    this.settings = null;
    this.connection = null;
    this.database = null;
    this.documents = {};
    this.name = name;
  }
  getSettings() {
    return this.settings || (() => {
      let env;
      try {
        env = cfenv.getAppEnv({ vcap });
      } catch (e) {
        env = cfenv.getAppEnv();
      }
      return (this.settings = env);
    })();
  }
  getConnection() {
    return this.connection || (() => {
      const [config] = this.getSettings().services.cloudantNoSQLDB || [];
      return config && (this.connection = cloudant(config.credentials));
    })();
  }
  getDB() {
    return this.database || (() => {
      const connection = this.getConnection();
      connection.db.create(this.name);
      return (this.database = connection.db.use(this.name));
    });
  }
};
