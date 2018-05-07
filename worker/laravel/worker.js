var queue = require('./queue');
var Job = require('./job');

var env = require('../../env.json');
var interval = env.worker.interval;
var timeOut = env.worker.timeOut;
var maxTries = env.worker.maxTries;

function Worker() {
  this.interval = null;
}

Worker._instance = null;

Worker.instance = function() {
  if (this._instance == null) {
    console.log('init worker instance');
    this._instance = new Worker();
  }
  return this._instance;
};

function worker() {
  return Worker.instance();
}

/**
 * Expose `Worker`.
 */
module.exports = worker();

Worker.prototype.daemon = function() {
  if (!worker().interval) return;
  //console.log('ticking each '+worker().interval+' miliseconds');
  worker().work();
  setTimeout(worker().daemon, worker().interval);
};

Worker.prototype.start = function() {
  this.interval = interval || 1000;
  queue.verify(function(error) {
    if (!error) {
      worker().daemon();
    } else {
      console.error(error.stack || error);
    }
  });
};

Worker.prototype.work = function() {
  this.runNextJob();
};

Worker.prototype.runNextJob = function() {
  queue.pop(function(error, job) {
    if (!error && job) {
      worker().runJob(job);
    }
  });
};

Worker.prototype.runJob = function(job) {
  if (worker().checkIfValid(job)) {
    job.fire(function(status) {
      switch(status) {
        case Job.COMPLETED:
          worker().terminateJob(job);
        break;
        case Job.FOR_LATER:
          worker().retryLater(job);
        break;
        case Job.CORRUPTED:
          worker().terminateJob(job);
        break;
        case Job.FAILED:
          //do nothing
        break;
      }
    });
  } else {
    worker().terminateJob(job);
  }
};

Worker.prototype.terminateJob = function(job) {
  queue.delete(job, function (err) {
    if (!err) {
      console.log('Job #%s terminated', job.id);
    }
  });
};

Worker.prototype.retryLater = function(job) {
  queue.reserveUnlock(job, function (err) {
    if (!err) {
      console.log('Job #%s retry', job.id);
    }
  });
};

Worker.prototype.checkIfValid = function(job) {
  return (maxTries !== 0 && job.attempts <= maxTries);
};

