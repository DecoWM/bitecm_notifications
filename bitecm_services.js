/* jshint esversion:6 */

module.exports = Services;

var axios = require('axios');
// axios.defaults.baseURL = 'http://bitel-store.clientes-forceclose.com';


//CONSTRUCTOR FUNCTION
function Services () {
  self = {};

  self.sendGetRequest = function (url, config = []) {
    var request = axios.get(url, config)
      .then(function (response) {
        console.log("GET Correcto");
        return true;
      })
      .catch(function (err) {
        console.log("GET Error");
        return false;
      });
    return request;
  };

  self.sendPostRequest = function (url, data = {}, config = []) {
    axios.post(url, data, config)
      .then(function (response) {
        console.log("POST Correcto");
        return true;
      })
      .catch(function (err) {
        console.log("POST Error");
        return false;
      });
    return request;
  };

  return self;
}
