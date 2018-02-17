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
    initialDelay: 1000,
    maxDelay: 6000
  }
};

var queue = Jobs(db, worker, options);

var https = require("https");

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
  // El axios no reconoce dominios registrados en el /etc/hosts. Siempre busca en el DNS
  var servers = ['10.121.6.249', '10.121.6.251']; //["pe-ecomm01.viettelperu.com.pe", "pe-ecomm02.viettelperu.com.pe"];
  var selectedServer = Math.floor(Math.random() * Math.floor(2));
  var alternateServer = (selectedServer == 0 ? 1 : 0);
  var selectedUrl = 'https://'+servers[selectedServer]+':8443/api/check_porting_status/'+payload.order_id;
  var alternateUrl = 'https://'+servers[alternateServer]+':8443/api/check_porting_status/'+payload.order_id;
  
  // Quita verificación de certificado SSL para poder conectarse a los ecommerce a través de la IP
  const agent = new https.Agent({  
    rejectUnauthorized: false
  });
  //var url = 'https://10.121.8.25/api/check_porting_status/'+payload.order_id;
  //var url = 'http://bitel-store.dev/api/test/'+payload.order_id;

  // Intentar conexión con el servidor seleccionado
  console.log('Trying... %s', selectedUrl);
  service.checkPortingStatus(selectedUrl, payload, {httpsAgent: agent}).then(function (success) {
    console.log('Connecting... %s', servers[selectedServer]);
    if (!success){
      console.log('Error in request to server %s. Trying to connect to server %s', servers[selectedServer], servers[alternateServer]);
      // Intentar conexión con el servidor alternativo
      service.checkPortingStatus(alternateUrl, payload, {httpsAgent: agent}).then(function (success) {
        if (!success) err = Error('Error in request.');
        else console.log('Sucess... %s', servers[alternateServer]);
      });
    } else {
      console.log('Sucess... %s', servers[selectedServer]);
    }
    console.log('Returning callback...');
    callback(err);
  });
}
