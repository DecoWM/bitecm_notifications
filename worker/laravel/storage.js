var db = require('node-mysql');
var callBack = require('./callback');

var env = require('../../env.json');
var connectionInfo = env.connectionInfo;

function Storage() {
  this.dataSource = new db.DB(connectionInfo);
  this.queues = {};
}

Storage._instance = null;

Storage.instance = function() {
  if (this._instance == null) {
    console.log('init storage instance');
    this._instance = new Storage();
  }
  return this._instance;
};

function storage() {
  return Storage.instance();
}

/**
 * Expose `Storage`.
 */
module.exports = storage();

Storage.prototype.execQuery = function(query, params, cb) {
  if (!this.dataSource) cb('No datasource');
  this.dataSource.getConnection(function (error, connection) {
    if (error) {
      cb(error);
    } else {
      connection.query(query, params, cb);
      connection.release();
    }
  });
};

Storage.prototype.verifyIfQueueExists = function(queueName, cb) {
  this.execQuery('SELECT 1 FROM ?? LIMIT 1', [queueName], cb);
};

Storage.prototype.execQueryInQueue = function(queueName, query, params, cb) {
  this.verifyIfQueueExists(queueName, function (error) {
    if (error) {
      callBack(cb, error);
    } else {
      storage().execQuery(query, params, function(error, data) {
        if (error) {
          callBack(cb, error);
        } else {
          callBack(cb, null, data);
        }
      });
    }
  });
};
