var storage = require('./storage');
var Job = require('./job');
var callBack = require('./callback');
var env = require('../../env.json');

var moment = require('moment');

function Queue() {
  this.table = env.queue.table;
  this.name = env.queue.name;
  this.delay = env.queue.delay;
}

Queue._instance = null;

Queue.instance = function() {
  if (this._instance == null) {
    console.log('init queue instance');
    this._instance = new Queue();
  }
  return this._instance;
};

Queue.currentTime = function() {
  return Math.floor(parseInt(moment().format('x'))/1000);
};

Queue.reservedLock = function() {
  return 9999999999;
};

function queue() {
  return Queue.instance();
}

/**
 * Expose `Queue`.
 */
module.exports = queue();

Queue.prototype.verify = function(cb) {
  storage.verifyIfQueueExists(queue().table, function (error) {
    if (error) {
      callBack(cb, error);
    } else {
      callBack(cb, null);
    }
  });
};

Queue.prototype.pop = function(cb) {
  this.getNextAvailableJob(function(error, job) {
    if (error) {
      callBack(cb, error, null);
    } else {
      if (job) {
        queue().markJobAsReserved(job, function(error) {
          if (error) {
            callBack(cb, error, null);
          } else {
            callBack(cb, null, job);
          }
        });
      } else {
        callBack(cb, error, null);
      }
    }
  });
};

Queue.prototype.getNextAvailableJob = function(cb) {
  var current_time = Queue.currentTime();
  var params = [queue().table, queue().name, current_time, current_time - queue().delay];
  var query = "SELECT * FROM ??\
    WHERE queue = ? AND \
      (\
        (reserved_at IS NULL AND available_at <= ?)\
        OR (reserved_at IS NOT NULL AND reserved_at <= ?)\
      )\
    ORDER BY id ASC\
    LIMIT 1";
  storage.execQuery(query, params, function(error, data) {
    if (error) {
      console.error('Error poping job from "%s" queue ', queue().name, error.stack);
      callBack(cb, error, null);
    } else {
      if (data.length) {
        console.log(data);
        console.log('Job poped from "%s" queue', queue().name);
      } else {
        //console.log('No jobs found in "%s" queue', queue().name);
      }
      var job = Job.parse(data[0]);
      callBack(cb, null, job);
    }
  });
};

Queue.prototype.markJobAsReserved = function(job, cb) {
  var params = [queue().table, Queue.reservedLock(), job.increment(), job.id];
  var query = "UPDATE ??\
    SET reserved_at = ?, attempts = ?\
    WHERE id = ?";
  storage.execQuery(query, params, function(error, data) {
    if (error) {
      console.error('Error reserving job in "%s" queue ', queue().name, error.stack);
      callBack(cb, error, null);
    } else {
      console.log('Job reserved in "%s" queue', queue().name);
      callBack(cb, null);
    }
  });
};

Queue.prototype.reserveUnlock = function(job, cb) {
  var params = [queue().table, Queue.currentTime(), job.id];
  var query = "UPDATE ??\
    SET reserved_at = ?\
    WHERE id = ?";
  storage.execQuery(query, params, function(error, data) {
    if (error) {
      console.error('Error unlocking job reserve in "%s" queue ', queue().name, error.stack);
      callBack(cb, error, null);
    } else {
      console.log('Job unlocked for reserve in "%s" queue', queue().name);
      callBack(cb, null);
    }
  });
};

Queue.prototype.push = function(job, cb) {
  var params = [queue().table, JSON.stringify(job.payload)];
  var query = "INSERT INTO ?? () VALUES (?,?,?)";
  storage.execQuery(query, params, function(error, data) {
    if (error) {
      console.error('Error pushing job into "%s" queue ', queue().name, error.stack);
      callBack(cb, error, null);
    } else {
      console.log('Job pushed into "%s" queue', queue().name);
      callBack(cb, null);
    }
  });
};

Queue.prototype.delete = function(job, cb) {
  var params = [queue().table, job.id];
  var query = "DELETE FROM ?? WHERE id = ?";
  storage.execQuery(query, params, function(error, data) {
    if (error) {
      console.error('Error deleting job from "%s" queue ', queue().name, error.stack);
      callBack(cb, error, null);
    } else {
      console.log('Job deleted from "%s" queue', queue().name);
      callBack(cb, null);
    }
  });
};
