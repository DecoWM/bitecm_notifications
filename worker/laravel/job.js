var service = require('./service');
var https = require('https');
var Log = require('./log');
var env = require('../../env.json');
var servers = env.servers;

function Job(data) {
  this.id = data.id;
  this.queue = data.queue;
  this.payload = JSON.parse(data.payload);
  this.attempts = data.attempts;
  this.reserved_at = data.reserved_at;
  this.available_at = data.available_at;
  this.created_at = data.created_at;
  Log.info(this);
}

Job.parse = function(data) {
  if (!data || data.length == 0) {
    return null;
  }
  return new Job(data);
};

Job.COMPLETED = 1;
Job.FOR_LATER = 2;
Job.CORRUPTED = 3;
Job.FAILED = 0;

/**
 * Expose `Job`.
 */
module.exports = Job;

Job.prototype.fire = function(callback) {
  var job = this;

  // Quita verificación de certificado SSL para poder conectarse a los ecommerce a través de la IP
  var agent = new https.Agent({
    rejectUnauthorized: false
  });

  if (servers.length == 0) {
    callback(Job.FAILED);
    return;
  }

  var selectedServer, selectedUrl;

  if (servers.length > 1) {
    selectedServer = Math.floor(Math.random() * Math.floor(2));
    selectedUrl = servers[selectedServer]+'/api/check_porting_status/'+job.payload.order_id;
    var alternateServer = (selectedServer == 0 ? 1 : 0);
    var alternateUrl = servers[alternateServer]+'/api/check_porting_status/'+job.payload.order_id;
  } else {
    selectedServer = 0;
    selectedUrl = servers[selectedServer]+'/api/check_porting_status/'+job.payload.order_id;
  }

  // Intentar conexión con el servidor seleccionado
  service.checkPortingStatus(selectedUrl, job.payload, {httpsAgent: agent}).then(function (result) {
    if (!result.reached) {
      if (servers.length > 1) {
        Log.warning('Error in request to server %s. Trying to connect to server %s', servers[selectedServer], servers[alternateServer]);
        // Intentar conexión con el servidor alternativo
        service.checkPortingStatus(alternateUrl, job.payload, {httpsAgent: agent}).then(function (result2) {
          if (!result2.reached) {
            Log.warning('Error in request to server %s too. Aborting.', servers[alternateServer]);
            err = Error('Error in request in all servers.');
            Log.error(err.stack);
            callback(Job.FAILED);
          } else {
            callback(result.status);
          }
        });
      } else {
        callback(Job.FAILED);
      }
    } else {
      callback(result.status);
    }
  });
};

Job.prototype.increment = function() {
  return this.attempts++;
};
