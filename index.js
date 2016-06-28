'use strict';
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const pump = require('pump');
const async = require('async');
const chokidar = require('chokidar');
const untildify = require('untildify');
const osHomedir = require('os-homedir');
const pathExists = require('path-exists');

const ps = new EventEmitter();
const home = osHomedir();
let source = path.join(home, path.resolve(home, path.relative(home, `${path.sep}desktop`)));

const parseHome = str => {
  return str.split(path.sep).slice(0, 3).join(path.sep) === home ? str : path.join(home, str);
}

exports.ps = ps;

exports.watch = (ext, destPath, opts) => {
  if (!_.every([ext, destPath], x => typeof x === 'string')) {
    throw new TypeError('expected strings as first two args');
  }

  opts = opts || {};
  destPath = parseHome(untildify(destPath));
  ext = ext.charAt(0) !== '.' ? `.${ext}` : ext;

  let watcher;
  const session = { moved: [], preserved: [] };

  if (typeof opts.preserve !== 'undefined') {
    session.preserved = opts.preserve.split(/\s/g).map(f => f.replace('\"', ''));
  }

  return new Promise((resolve, reject) => {
    process.on('SIGINT', () => {
      if (process.env.FORK) process.send(session);
      resolve(session);
    })

    pathExists(destPath)
      .then(init)
      .catch(reject)

    function init(isValidPath) {
      if (process.env.FORK) {
        source = path.join(__dirname, 'output', 'x');
        process.nextTick(process.kill.bind(null, process.pid, 'SIGINT'));
      }

      if (!isValidPath) return reject(`${destPath} is not a valid directory\n`);
      if (destPath === source) return reject(`must target a directory other than ${source}\n`);

      async.series([
        moveExistingFiles,
        beginWatch
      ], err => {
        if (err) {
          if (_.isObject(watcher)) watcher.close();
          return reject(err);
        }
      })
    }
  })

  function moveExistingFiles(cb) {
    fs.readdir(source, (err, contents) => {
      if (err) return cb(err);

      const ofExt = contents.filter(f => {
        return path.extname(f) === ext && !~session.preserved.indexOf(f);
      })

      async.each(ofExt, moveFileToDest, cb);
    })
  }

  function beginWatch(cb) {
    watcher = chokidar.watch(source, {
      ignored: `(!(*/${ext})|.*)`,
      persistent: true,
      atomic: true
    })

    watcher
      .on('ready', () => ps.emit('watch-initialized', source))
      .on('raw', initMove)
      .on('error', cb)

    function initMove(e, pathTo, detail) {
      if (e !== 'moved') return false;

      const file = path.basename(pathTo);
      const done = err => err ? cb(err) : ps.emit('file-moved', file);

      pathExists(pathTo)
        .then(exists => {
          if (exists && !~session.preserved.indexOf(file)) {
            moveFileToDest(file, done);
          }
        })
        .catch(cb)
    }
  }

  function moveFileToDest(filename, cb) {
    const oldPath = path.join(source, filename);
    const newPath = path.join(destPath, filename.replace(/\s/g, '_'));

    const read = fs.createReadStream(oldPath);
    const write = fs.createWriteStream(newPath);

    pump(read, write, err => {
      if (err) return cb(err);

      session.moved.push(filename);
      process.nextTick(fs.unlink.bind(null, oldPath, cb));
    })
  }
}
