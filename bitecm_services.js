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
        return response.data;
      })
      .catch(function (err) {
        console.log(err);
        return false;
      });
    return request;
  };

  return self;
}
