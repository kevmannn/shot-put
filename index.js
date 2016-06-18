'use strict';
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const async = require('async');
const untildify = require('untildify');
const pathExists = require('path-exists');
const osHomedir = require('os-homedir');

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

  const moved = [];
  let preserved = [];

  if (process.env.FORK) {
    source = path.join(__dirname, 'output', 'x');
    process.nextTick(() => process.kill(process.pid, 'SIGINT'));
  }

  if (ext.charAt(0) !== '.') ext = `.${ext}`;

  if (typeof opts.preserve !== 'undefined') {
    preserved = opts.preserve.split(/\s/g).map(file => file.replace('"', ''));
  }

  return new Promise((resolve, reject) => {
    process.on('SIGINT', () => {
      const session = { moved, preserved };

      if (process.env.FORK) process.send(session);
      resolve(session);
    })

    pathExists(destPath)
      .then(beginWatch)
      .catch(reject)

    function beginWatch(validPath) {
      if (!validPath) return reject(`${destPath} is not a valid directory\n`);
      if (destPath === source) return reject(`must target a directory other than ${source}\n`);

      ps.emit('begin-watch', source);

      async.series([
        moveExisting,
        watch
      ], err => err ? reject(err) : null)
    }
  })

  function moveExisting(cb) {
    fs.readdir(source, (err, contents) => {
      if (err) return cb(err);

      const ofExt = contents.filter(f => path.extname(f) === ext);
      async.each(ofExt, moveFile, cb);
    })
  }

  function watch(cb) {
    fs.watch(source, (e, filename) => {
      if (!(e === 'rename' && path.extname(filename) === ext)) return;

      const emitMove = err => err ? cb(err) : ps.emit('move', filename);

      pathExists(path.join(source, filename))
        .then(exists => exists ? moveFile(filename, emitMove) : null)
        .catch(cb)
    })
  }

  function moveFile(filename, cb) {
    if (preserved.indexOf(filename) !== -1) return null;

    const oldPath = path.join(source, filename);
    const newPath = path.join(destPath, filename.replace(/\s/g, '_'));
    const read = fs.createReadStream(oldPath);

    read.pipe(fs.createWriteStream(newPath));

    read.on('error', cb);
    read.on('end', () => {
      moved.push(filename);
      process.nextTick(fs.unlink.bind(null, oldPath, cb));
    })
  }
}
