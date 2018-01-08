/* jshint esversion:6 */

var level = require('level');
var db = level('./bitecm_notifications');
var Jobs = require('level-jobs');

var Services = require('./bitecm_services');

var maxConcurrency = 1;
var queue = Jobs(db, worker, maxConcurrency);

module.exports = queue;

function worker (id, payload, callback) {
  sendRequest(payload, function (err) {
    if (err) console.error('Error processing request %s: %s', id, err.message);
    else console.log('Request %s successfully processed.', id);
    callback(err);
  });
}

function sendRequest (payload, callback) {
  var service = Services();
  var url = 'http://bitel-store.clientes-forceclose.com';
  var err;

  service.sendGetRequest(url).then(function (success) {
    if (!success) err = Error('Error in request.');
    callback(err);
  });
}
