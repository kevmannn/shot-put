'use strict';
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const async = require('async');
const untildify = require('untildify');
const pathExists = require('path-exists');

const ps = new EventEmitter();

const home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
const desktop = path.join(home, 'desktop');

const parseHome = str => {
  return str.split(path.sep).slice(0, 3).join(path.sep) === home ? str : path.join(home, str);
}

exports.ps = ps;

exports.rename = str => {}

exports.watch = (ext, dir, opts) => {
  opts = opts || {};

  if (!_.every([ext, dir], String)) return new TypeError(`expected strings as first two args`);

  let moved = [];
  let preserved = [];
  const dest = parseHome(untildify(dir));

  if (ext.charAt(0) !== '.') ext = '.' + ext;

  if (typeof opts.preserve !== 'undefined') {
    preserved = opts.preserve.split(/\s/g).map(file => file.replace('"', ''));
  }

  return new Promise((resolve, reject) => {
    pathExists(dest)
      .then(exists => {

        if (!exists) return reject(`${dir} is not a valid directory\n`);
        if (dest === desktop) return reject(`must target a directory other than ${desktop}\n`);

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
      if (!(e === 'rename' && path.extname(source) === ext)) return;

      pathExists(path.join(desktop, source))
        .then(exists => {
          if (!exists) return;

          moveFile(source, err => err ? cb(err) : ps.emit('moved', source));
        })
    })
  }

  function moveFile(filename, cb) {
    if (preserved.indexOf(filename) !== -1) return null;

    const oldPath = path.join(desktop, filename);
    const newPath = path.join(dest, filename.replace(/\s/g, '_'));

    const read = fs.createReadStream(oldPath);

    read.pipe(fs.createWriteStream(newPath));
    
    read.on('error', err => cb(err));
    read.on('end', () => {
      moved.push(filename);

      process.nextTick(() => fs.unlink(oldPath, err => cb(err ? err : null)));
    })
  }
}
