/* jshint esversion:6 */
var axios = require('axios');
var Log = require('./log');

function Service() {
  
}

Service._instance = null;

Service.instance = function() {
  if (this._instance == null) {
    Log.info('init service instance');
    this._instance = new Service();
  }
  return this._instance;
};

function service() {
  return Service.instance();
}

/**
 * Expose `Service`.
 */
module.exports = service();

Service.prototype.checkPortingStatus = function (url, data = {}, config = []) {
  var request = axios
    .post(url, data, config)
    .then(function (response) {
      var r = parseInt(response.data);
      return {
        reached: true,
        status: r
      };
    })
    .catch(function (err) {
      Log.error(err);
      return { reached: false };
    });
  return request;
};
