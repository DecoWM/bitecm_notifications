/* jshint esversion:6 */

var level = require('level');
var db = level('./bitecm_notifications');
var Jobs = require('level-jobs');

var Services = require('./bitecm_services');

var options = {
  maxConcurrency: Infinity,
  maxRetries: 10,
  backoff: {
    randomisationFactor: 0,
    initialDelay:10,
    maxDelay: 300
  }
};

var queue = Jobs(db, worker, options);

module.exports = queue;

function worker (id, payload, callback) {
  sendRequest(payload, function (err) {
    if (err) console.error('Error processing request %s: %s', id, err.message);
    else console.log('Request %s successfully processed.', id);
    callback(err);
  });
}

function sendRequest (payload, callback) {
  var err;
  var service = Services();
  var url = 'https://10.121.6.249:8443/check_porting_status/'+payload.order_id;

  service.checkPortingStatus(url, payload).then(function (success) {
    if (!success) err = Error('Error in request.');
    callback(err);
  });
}
