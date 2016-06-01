'use strict';
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const async = require('async');
const untildify = require('untildify');
const pathExists = require('path-exists');

const home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
const desktop = path.join(home, 'desktop');
const parseHome = str => str.split(path.sep).slice(0, 3).join(path.sep) === home ? str : path.join(home, str);

let moved = [];
let preserved = [];

const ps = new EventEmitter();

exports.ps = ps;

exports.watch = (ext, dir, opts) => {
  opts = opts || {};

  if (!([ext, dir].every(arg => typeof arg === 'string'))) {
    return new TypeError('expected strings as first two arguments');
  }

  const dest = parseHome(untildify(dir));

  if (ext.charAt(0) !== '.') ext = '.' + ext;

  if (typeof opts.preserve !== 'undefined') {
    preserved = opts.preserve.split(/\s/g).map(file => file.replace('"', ''));
  }

  return new Promise((resolve, reject) => {
    pathExists(dest)
      .then(exists => {

        if (!exists) return reject(`${dir} is not a valid directory\n`);
        if (dest === desktop) return reject(`must target a directory other than ${path.sep + desktop}\n`);

        ps.emit('watch');

        async.series([
          moveExisting,
          watch
        ], err => err ? reject(err) : true)
      })

    process.on('SIGINT', () => {
      resolve({ moved, preserved });
    })
  })

  function moveExisting(cb) {
    fs.readdir(desktop, (err, files) => {
      if (err) return cb(err);

      files
        .filter(f => path.extname(f) === ext)
        .forEach(f => moveFile(f, err => err ? cb(err) : null))

      cb(null);
    })
  }

  function watch(cb) {
    fs.watch(desktop, (e, source) => {
      if (e === 'rename' && path.extname(source) === ext) {

        pathExists(path.join(desktop, source))
          .then(result => {
            if (!result) return;

            moveFile(source, err => {
              if (err) return cb(err);

              ps.emit('moved', source);
            })
          })
      }
    })
  }

  function moveFile(filename, cb) {
    if (preserved.indexOf(filename) !== -1) return null;

    const oldPath = path.join(desktop, filename);
    const newPath = path.join(dest, filename.replace(/\s/g, '_'));

    async.waterfall([
      read,
      append
    ], err => {
      if (err) return cb(err);

      moved.push(filename);

      process.nextTick(() => fs.unlink(oldPath, err => cb(err ? err : null)));
    })

    function read(cb) {
      fs.readFile(oldPath, (err, fileData) => {
        if (err) return cb(err);
        cb(null, fileData);
      })
    }

    function append(fileData, cb) {
      fs.appendFile(newPath, fileData, err => {
        if (err) return cb(err);
        cb(null);
      })
    }
  }
}
