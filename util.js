'use strict';
const path = require('path');
const _ = require('lodash');
const home = require('os-homedir')();

exports.parseHome = pathTo => {
  const startPath = pathTo.split(path.sep).slice(0, 3).join(path.sep);
  return startPath === home ? pathTo : path.join(home, pathTo);
}

exports.watcherIsActive = watcher => {
  return _.isFunction(watcher.getWatched) && _.keys(watcher.getWatched()).length;
}
