'use strict';
const { EventEmitter } = require('events');
const { sep, join, relative, resolve, basename } = require('path');
const _ = require('lodash');
const fs = require('graceful-fs');
const pump = require('pump');
const async = require('async');
const { watch } = require('chokidar');
const untildify = require('untildify');
const osHomedir = require('os-homedir');
const pathExists = require('path-exists');
const { parseHome, watcherIsActive } = require('./util');

const home = osHomedir();
const emitter = new EventEmitter();
let source = join(home, resolve(home, relative(home, `${sep}desktop`)));

exports.emitter = emitter;

exports.watch = (ext, destPath, opts) => {
  if (!_.every([ext, destPath], x => _.isString(x))) {
    throw new TypeError(`
      expected strings as first two args -
      got ${[ext, destPath].map(x => typeof x)}
    `);
  }

  opts = opts || {};
  destPath = parseHome(untildify(destPath));
  ext = ext.charAt(0) !== '.' ? `.${ext}` : ext;

  let watcher = {};
  const session = { moved: [], preserved: [] };

  if (typeof opts.preserve !== 'undefined') {
    session.preserved = opts.preserve.split(/\s/g).map(f => f.replace('\"', ''));
  }

  return new Promise((resolve, reject) => {
    process.on('SIGINT', () => {
      if (process.env.FORK) process.send(session);
      if (watcherIsActive(watcher)) watcher.close();

      resolve(session);
    })

    pathExists(destPath)
      .then(init)
      .catch(reject)

    function init(isValidPath) {
      if (process.env.FORK) {
        source = join(__dirname, 'output', 'x');
        process.nextTick(process.kill.bind(null, process.pid, 'SIGINT'));
      }

      if (!isValidPath) return reject(`${destPath} is not a valid directory\n`);
      if (destPath === source) return reject(`must target a directory other than ${source}\n`);

      async.series([
        moveExistingFiles,
        beginWatch
      ], err => {
        if (err) {
          if (watcherIsActive(watcher)) watcher.close();
          return reject(err);
        }
      })
    }
  })

  function moveExistingFiles(cb) {
    fs.readdir(source, (err, contents) => {
      if (err) return cb(err);

      const ofExt = contents.filter(f => {
        return extname(f) === ext && !~session.preserved.indexOf(f);
      })

      async.each(ofExt, moveFileToDest, cb);
    })
  }

  function beginWatch(cb) {
    watcher = watch(source, {
      ignored: `(!(*/${ext})|.*)`,
      depth: 1,
      persistent: true,
      atomic: true
    })
      .on('ready', () => emitter.emit('watch-initialized', source))
      .on('raw', initMove)
      .on('error', cb)

    function initMove(e, pathTo, detail) {
      if (e !== 'moved') return false;

      const file = basename(pathTo);
      const done = err => err ? cb(err) : emitter.emit('file-moved', file);

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
    const oldPath = join(source, filename);
    const newPath = join(destPath, filename.replace(/\s/g, '_'));

    const rs = fs.createReadStream(oldPath);
    const ws = fs.createWriteStream(newPath);

    pump(rs, ws, err => {
      if (err) return cb(err);

      session.moved.push(filename);
      process.nextTick(fs.unlink.bind(null, oldPath, cb));
    })
  }
}
