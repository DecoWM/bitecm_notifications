var env = require('../../env.json');

function Log() {

}

Log.level = {
  'debug': 1,
  'warning': 2,
  'error': 3
};

Log.info = function() {
  if(Log.level[env.logLevel] && Log.level[env.logLevel] <= Log.level.debug) {
    log(arguments);
  }
};

Log.warning = function() {
  if(Log.level[env.logLevel] && Log.level[env.logLevel] <= Log.level.warning) {
    log(arguments);
  }
};

Log.error = function() {
  if(Log.level[env.logLevel] && Log.level[env.logLevel] <= Log.level.error) {
    log(arguments);
  }
};

function log(params) {
  if (params.length > 0) {
    console.log.apply(null, params);
  }
}

module.exports = Log;
