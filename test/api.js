import fs from 'fs';
import path from 'path';
import { execFile, fork } from 'child_process';
import test from 'ava';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import { watch, rename } from '../';

const ext = '.js';
const source = path.resolve('..', 'output', 'x');
const dest = path.resolve('..', 'output', 'y');
const env = Object.create(process.env);

env.FORK = true;

const restore = (t, dir) => {
  rimraf(dir, err => {
    t.ifError(err);
    mkdirp(dir, err => t.ifError(err));
  })
}

test.beforeEach(t => [source, dest].forEach(restore.bind(null, t)));

test.cb('`watch` rejects non-existing `dest` path', t => {
  const nonDest = path.join(dest, 'z');

  execFile('../cli.js', [ext, nonDest], (err, stdout, stderr) => {
    t.ifError(err);
    
    t.is(stderr, `> ${nonDest} is not a valid directory\n`);
    t.end();
  })
})

test.skip('`watch` listens when given valid `dest` path', t => {
  const sPut = fork('../cli.js', [ext, __dirname], { env });

  sPut.on('message', m => {
    t.truthy(m.src);
    t.end();
  })
})

test.cb('`info.moved` reflects number of files moved', t => {
  const sPut = fork('../cli.js', [ext, __dirname], { env });

  sPut.on('message', m => {
    t.true(Array.isArray(m.movedFiles));
    t.is(m.movedFiles.length, 0);
    t.end();
  })
})

test.skip('`rename` intercepts transfer and renames file', t => {})

test.skip('`rename` timesout after `n` ms and filename is retained', t => {})

test.skip('`watch` ignores files with ext other than `ext`', t => {})

test.skip('`watch` transfers file from `source` to `dest`', t => {
  const read = fs.createReadStream(path.resolve('..', 'index.js'));

  read.pipe(fs.createWriteStream(path.join(source, 'x.js')));

  read.on('error', err => t.ifError(err));
  read.on('end', sPut);

  function sPut() {
    const sPut = fork('../cli.js', [ext, dest], { env });

    sPut.on('message', m => {
      t.is(m.movedFiles.length, 1);

      fs.readdir(dest, (err, contents) => {
        t.ifError(err);

        t.true(contents.indexOf('index.js') !== -1);
        t.end();
      })
    })
  }
})
