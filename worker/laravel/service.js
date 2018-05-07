/* jshint esversion:6 */
var axios = require('axios');

function Service() {
  
}

Service._instance = null;

Service.instance = function() {
  if (this._instance == null) {
    console.log('init service instance');
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
      console.log(err);
      return { reached: false };
    });
  return request;
};
