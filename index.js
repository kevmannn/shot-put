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

exports.rename = userIn => {}

exports.watch = (ext, destPath, opts) => {
  opts = opts || {};

  if (!_.every([ext, destPath], x => typeof x === 'string')) {
    throw new TypeError(`expected strings as first two args`);
  }

  let moved = [];
  let preserved = [];
  destPath = parseHome(untildify(destPath));

  if (process.env.FORK) {
    source = path.join(__dirname, 'output', 'x');
    process.nextTick(() => process.kill(process.pid, 'SIGINT'));
  }

  if (ext.charAt(0) !== '.') ext = '.' + ext;

  if (typeof opts.preserve !== 'undefined') {
    preserved = opts.preserve.split(/\s/g).map(file => file.replace('"', ''));
  }

  return new Promise((resolve, reject) => {
    process.on('SIGINT', () => resolve({ moved, preserved }));

    pathExists(destPath)
      .then(exists => {
        if (!exists) return reject(`${destPath} is not a valid directory\n`);
        if (destPath === source) return reject(`must target a directory other than ${source}\n`);

        ps.emit('watch', source);

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
    fs.watch(source, (e, origin) => {
      if (!(e === 'rename' && path.extname(origin) === ext)) return;

      pathExists(path.join(source, origin))
        .then(exists => {
          if (!exists) return;

          ps.emit('detect', origin);
          ps.on('rename-timeout', () => {
            moveFile(origin, err => err ? cb(err) : ps.emit('move', origin))
          })
        })
    })
  }

  function moveFile(filename, cb) {
    if (preserved.indexOf(filename) !== -1) return null;

    const oldPath = path.join(source, filename);
    const newPath = path.join(destPath, filename.replace(/\s/g, '_'));

    let n = 0;
    const full = fs.statSync(oldPath).size;
    const read = fs.createReadStream(oldPath);

    read.pipe(fs.createWriteStream(newPath));
    
    read.on('error', cb);
    read.on('data', emitPartial);
    read.on('end', unlinkOldPath);

    function emitPartial(data) {
      n += data.length;
      ps.emit('partial', Math.floor(n / full));
    }

    function unlinkOldPath() {
      moved.push(filename);

      process.nextTick(() => fs.unlink(oldPath, err => cb(err ? err : null)));
    }
  }
}
