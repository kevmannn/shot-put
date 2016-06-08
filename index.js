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
let source = path.join(home, 'desktop');

const parseHome = str => {
  return str.split(path.sep).slice(0, 3).join(path.sep) === home ? str : path.join(home, str);
}

exports.ps = ps;

exports.rename = str => {}

exports.watch = (ext, destPath, opts) => {
  opts = opts || {};

  if (!_.every([ext, destPath], String)) return new TypeError(`expected strings as first two args`);

  let moved = [];
  let preserved = [];
  destPath = parseHome(untildify(destPath));

  if (ext.charAt(0) !== '.') ext = '.' + ext;
  if (process.env.FORK) source = path.join('output', 'x');

  if (typeof opts.preserve !== 'undefined') {
    preserved = opts.preserve.split(/\s/g).map(file => file.replace('"', ''));
  }

  return new Promise((resolve, reject) => {
    process.on('SIGINT', () => resolve({ moved, preserved }));

    pathExists(destPath)
      .then(exists => {
        if (!exists) return reject(`${destPath} is not a valid directory\n`);
        if (destPath === source) return reject(`must target a directory other than ${source}\n`);

        ps.emit('watch');

        async.series([
          moveExisting,
          watch
        ], err => err ? reject(err) : true)
      })
  })

  function moveExisting(cb) {
    fs.readdir(source, (err, files) => {
      if (err) return cb(err);

      files
        .filter(f => path.extname(f) === ext)
        .forEach(f => moveFile(f, err => err ? cb(err) : null))

      cb(null);
    })
  }

  function watch(cb) {
    fs.watch(source, (e, source) => {
      if (!(e === 'rename' && path.extname(source) === ext)) return;

      pathExists(path.join(source, source))
        .then(exists => {
          if (!exists) return;

          moveFile(source, err => err ? cb(err) : ps.emit('moved', source));
        })
    })
  }

  function moveFile(filename, cb) {
    if (preserved.indexOf(filename) !== -1) return null;

    const oldPath = path.join(source, filename);
    const newPath = path.join(destPath, filename.replace(/\s/g, '_'));

    const read = fs.createReadStream(oldPath);

    read.pipe(fs.createWriteStream(newPath));
    
    read.on('error', err => cb(err));
    read.on('end', () => {
      moved.push(filename);

      process.nextTick(() => fs.unlink(oldPath, err => cb(err ? err : null)));
    })
  }
}
