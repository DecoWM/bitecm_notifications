/* jshint esversion:6 */

module.exports = Services;

var axios = require('axios');
// axios.defaults.baseURL = 'http://bitel-store.clientes-forceclose.com';


//CONSTRUCTOR FUNCTION
function Services () {
  self = {};

  self.checkPortingStatus = function (url, data = {}, config = []) {
    var request = axios.post(url, data, config)
      .then(function (response) {
        console.log(response.data);
        if (response.data == true) {
          console.log("POST Correcto");
          return true;
        }
        else {
          console.log("POST Error");
          return false;
        }
      })
      .catch(function (err) {
        console.log("POST Error");
        return false;
      });
    return request;
  };

  return self;
}
