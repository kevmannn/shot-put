'use strict';
const fs = require('fs');
const path = require('path');
const async = require('async');
const untildify = require('untildify');
const pathExists = require('path-exists');
const log = require('single-line-log').stdout;

exports.watch = (ext, dir, opts) => {

  dir = untildify(dir);
  opts = opts || {};

  let moved = [];
  let preserved = [];

  if (typeof opts.preserve !== 'undefined') {
    preserved = opts.preserve.split(/\s/g).map(file => file.replace('"', ''));
  }

  const userHome = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
  const desktop = userHome + `${path.sep}desktop`;
  const dest = path.resolve(dir.split(path.sep).slice(0, 3).join(path.sep)) === userHome ? dir : path.join(userHome, dir);

  if (dest === desktop) return process.stderr.write('dir must be a directory other than /desktop\n');
  if (ext.charAt(0) !== '.') ext = '.' + ext;

  pathExists(dest)
    .then(exists => {

      if (!exists) {
        process.stderr.write(`${dir} is not a valid directory\n`);
        process.exit(0);
      }

      process.stdout.write(`watching ${path.sep}desktop for new ${ext} files..\n`);

      process.nextTick(() => {

        async.series([
          moveExisting,
          watch
        ], err => {
          if (err) {
            log.clear();
            return new Error('..encountered a problem watching the desktop');
          }
        })
      })
    })

  return new Promise((resolve, reject) => {

    process.on('SIGINT', () => resolve({ moved, preserved }));
  })

  function moveFile(filename, oldPath, newPath) {
    if (preserved.indexOf(filename) > -1) return null;

    oldPath = oldPath || path.normalize(desktop + `${path.sep + filename}`);
    newPath = newPath || path.normalize(dest + `${path.sep + filename.replace(/\s/g, '_')}`);

    async.waterfall([
      read,
      append
    ], err => {
      if (err) return new Error(err);

      process.stdout.write(`..moving ${filename}\n`);
      moved.push(filename);

      fs.unlink(oldPath, (err) => {})      
    })

    function read(cb) {
      fs.readFile(oldPath, (err, fileData) => {
        if (err) return cb(err);
        cb(null, fileData);
      })
    }

    function append(fileData, cb) {
      fs.appendFile(newPath, fileData, (err) => {
        if (err) return cb(err);
        cb(null);
      })
    }
  }

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
      if (e === 'rename' && path.extname(source) === ext) moveFile(source);
    })
  }
}

exports.revert = () => {}
