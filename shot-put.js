import { EventEmitter } from 'events';
import { join } from 'path';
import _ from 'lodash';
import fs from 'graceful-fs';
import pump from 'pump';
import async from 'async';
import { watch } from 'chokidar';
import untildify from 'untildify';
import osHomedir from 'os-homedir';
import pathExists from 'path-exists';

import { parseHome, watcherIsActive, defaultSourcePath } from './util';

export const emitter = new EventEmitter();

export const beginWatch = (ext, destPath, opts = {}) => {
  if (!_.every([ext, destPath], x => _.isString(x))) {
    throw new TypeError(`
      expected strings as first two args -
      got ${[ext, destPath].map(x => typeof x)}
    `);
  }

  let watcher = {};
  let source = defaultSourcePath;
  const home = osHomedir();
  const session = { moved: [], preserved: [] };

  ext = ext.charAt(0) !== '.' ? `.${ext}` : ext;
  destPath = parseHome(untildify(destPath));

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
