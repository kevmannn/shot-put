import fs from 'fs';
import path from 'path';
import { execFile, fork } from 'child_process';
import test from 'ava';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import { watch } from '../';

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

test('`.watch` rejects non-existing `dest` path', async t => {
  const p = path.join(dest, 'z');

  try {
    const result = await watch(ext, p, {});
  } catch (err) {
    t.is(err, `${p} is not a valid directory\n`);
  }
})

test('`.watch` rejects desktop given as `dest` path', async t => {
  const home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
  const desk = path.join(home, path.resolve(home, path.relative(home, `${path.sep}desktop`)));

  try {
    const result = await watch(ext, desk);
  } catch (err) {
    t.is(err, `must target a directory other than ${desk}\n`);
  }
})

test.skip('`.watch` listens when given valid `dest` path', t => {
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

test.skip('`.watch` ignores files with ext other than `ext`', t => {
  const read = fs.createReadStream(path.resolve('..', 'index.js'));

  read.pipe(fs.createWriteStream(path.join(source, 'x.js')));

  read.on('error', t.ifError);
  read.on('end', sPut);

  function sPut() {}
})

test.skip('`.watch` transfers file from `source` to `dest`', t => {
  const read = fs.createReadStream(path.resolve('..', 'index.js'));

  read.pipe(fs.createWriteStream(path.join(source, 'x.js')));

  read.on('error', t.ifError);
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
