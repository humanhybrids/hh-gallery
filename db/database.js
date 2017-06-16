const cfenv = require('cfenv');
const cloudant = require('cloudant');

module.exports = class Database {
    constructor(name) {
        this._settings = null;
        this._connection = null;
        this._database = null;
        this.documents = {};
        this.name = name;
    }
    get settings() {
        return this._settings || (() => {
            var env;
            try {
                env = cfenv.getAppEnv({ vcap: require('../vcap-local.json') });
            } catch (e) {
                env = cfenv.getAppEnv();
            }
            return this._settings = env;
        })();
    }
    get connection() {
        return this._connection || (() => {
            var config = this.settings.services.cloudantNoSQLDB;
            return config && (this._connection = cloudant(config[0].credentials));
        })();
    }
    get db() {
        return this._database || (() => this.connection.db.create(this.name), this._database = this.connection.db.use(this.name))();
    }
}
