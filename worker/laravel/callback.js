var Log = require('./log');

function callBack(cb, error, data, other) {
  if(cb) {
    try {
      cb(error, data, other);
    } catch (err) {
      Log.error('CALLBACK ERROR', err);
    }
  }
}

module.exports = callBack;
