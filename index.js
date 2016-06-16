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
let source = path.join(home, path.resolve(home, path.relative(home, `${path.sep}desktop`)));

const parseHome = str => {
  return str.split(path.sep).slice(0, 3).join(path.sep) === home ? str : path.join(home, str);
}

exports.ps = ps;

exports.watch = (ext, destPath, opts) => {
  if (!_.every([ext, destPath], x => typeof x === 'string')) {
    throw new TypeError(`expected strings as first two args`);
  }

  opts = opts || {};
  destPath = parseHome(untildify(destPath));

  let moved = [];
  let preserved = [];

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
      .then(beginWatch)
      .catch(reject)

    function beginWatch(validPath) {
      if (!validPath) return reject(`${destPath} is not a valid directory\n`);
      if (destPath === source) return reject(`must target a directory other than ${source}\n`);

      ps.emit('watch', source);

      async.series([
        moveExisting,
        watch
      ], err => err ? reject(err) : true)
    }
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
    fs.watch(source, (e, filename) => {
      if (!(e === 'rename' && path.extname(filename) === ext)) return;

      const emitMove = err => err ? cb(err) : ps.emit('move', filename);

      ps.on('rename-timeout', () => moveFile(filename, emitMove));
      ps.on('rename-init', renamed => moveFile(filename, { renamed }, emitMove));

      pathExists(path.join(source, filename))
        .then(exists => {
          if (!exists) return;

          ps.emit('detect', filename);
        })
        .catch(cb)
    })
  }

  function moveFile(filename, opts, cb) {
    if (preserved.indexOf(filename) !== -1) return null;
    if (_.isFunction(opts)) cb = opts;

    const oldPath = path.join(source, filename);
    const newPath = path.join(destPath, !_.isFunction(opts) ? opts.renamed : filename.replace(/\s/g, '_'));
    const size = { partial: 0, total: fs.statSync(oldPath).size }
    const read = fs.createReadStream(oldPath);

    read.pipe(fs.createWriteStream(newPath));

    read.on('error', cb);
    read.on('data', emitPartial);
    read.on('end', unlinkOldPath);

    function emitPartial(data) {
      size.partial += data.length;
      ps.emit('partial', Math.floor(size.partial / size.total));
    }

    function unlinkOldPath() {
      moved.push(filename);
      process.nextTick(() => fs.unlink(oldPath, err => cb(err ? err : null)));
    }
  }
}
