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
        var r = parseInt(response.data);
        if (r === 0) {
          return {
            success: true,
            push: false
          };
        } else if (r === 1) {
          return {
            success: true,
            push: false
          };
        } else if (r === 2) {
          return {
            success: true,
            push: true
          };
        } else {
          return { success: false };
        }
      })
      .catch(function (err) {
        console.log(err);
        return { success: false };
      });
    return request;
  };

  return self;
}
