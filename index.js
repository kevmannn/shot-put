'use strict';
const fs = require('fs');
const path = require('path');
const async = require('async');
const untildify = require('untildify');
const pathExists = require('path-exists');
const log = require('single-line-log').stdout;

const home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
const desktop = path.join(home, `${path.sep}desktop`);

// exports.revert = () => {}

exports.watch = (ext, dir, opts) => {

  if (![ext, dir].every(arg => typeof arg === 'string')) {
    return new TypeError(`expected strings as first two arguments`);
  }

  dir = untildify(dir);
  opts = opts || {};

  let moved = [];
  let preserved = [];
  const dest = dir.split(path.sep).slice(0, 3).join(path.sep) === home ? dir : path.join(home, dir);

  if (typeof opts.preserve !== 'undefined') {
    preserved = opts.preserve.split(/\s/g).map(file => file.replace('"', ''));
  }

  if (ext.charAt(0) !== '.') ext = '.' + ext;

  return new Promise((resolve, reject) => {

    pathExists(dest)
      .then(exists => {

        if (!exists) return reject(`${dir} is not a valid directory\n`);
        if (dest === desktop) return reject(`must target a directory other than ${path.sep + desktop}\n`);

        process.stdout.write(`watching ${path.sep}desktop for new ${ext} files..\n`);

        async.series([
          moveExisting,
          watch
        ], err => {

          if (err) return reject(err);
        })
      })

    process.on('SIGINT', () => resolve({ moved, preserved }));
  })

  function moveExisting(cb) {
    fs.readdir(desktop, (err, files) => {
      if (err) return cb(err);

      files
        .filter(file => path.extname(file) === ext)
        .forEach(f => moveFile(f))

      cb(null);
    })
  }

  function watch() {
    fs.watch(desktop, (e, source) => {
      if (e === 'rename' && path.extname(source) === ext) {

        moveFile(source, err => {
          if (err) return new Error(err);

          log(`..moved ${source}\n`);
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

      fs.unlink(oldPath, err => {
        if (err) return cb(err);
        cb(null);
      })
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
