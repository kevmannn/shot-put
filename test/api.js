import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import test from 'ava';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import pify from 'pify';
// import concat from 'concat-stream';
import combined from 'combined-stream';
import { watch } from '../';

const ext = '.js';
const source = path.resolve('..', 'output', 'x');
const dest = path.resolve('..', 'output', 'y');
const env = Object.create(process.env);

env.FORK = true;

const restore = async (t, dir) => {
  try {
    await pify(rimraf)(dir);
    mkdirp(dir);
  } catch (err) {
    t.ifError(err);
  }
}

const populateSource = filenames => {
  const agg = combined.create();

  return new Promise((resolve, reject) => {
    filenames.forEach(f => agg.append(path.resolve('..', f)));

    agg.pipe(fs.createWriteStream(path.join(source, 'x.js')));
    agg.on('error', reject);
    agg.on('end', resolve);
  })
}

test.beforeEach(t => [source, dest].forEach(restore.bind(null, t)));

test.skip('`.watch` parses paths to `dest`', t => {})

test('`.watch` rejects non-existing `dest` path', async t => {
  const nonPath = path.join(dest, 'z');

  try {
    const result = await watch(ext, nonPath, {});
  } catch (err) {
    t.is(err, `${nonPath} is not a valid directory\n`);
  }
})

test.cb('`.watch` listens when given valid `dest` path', t => {
  const sPut = fork('../cli.js', [ext, __dirname], { env });

  sPut.on('message', m => {
    t.truthy(m.moved);
    t.end();
  })
})

test.cb('`info.moved` reflects number of files moved', t => {
  const sPut = fork('../cli.js', [ext, __dirname], { env });

  sPut.on('message', m => {
    t.true(Array.isArray(m.moved));
    t.is(m.moved.length, 0);
    t.end();
  })
})

test.skip('`.watch` ignores files with extension other than `ext`', async t => {
  t.plan(1);

  await populateSource(['index.js', 'README.md'])
    .then(async () => {
      const result = await watch(ext, dest, {});
      t.is(result.moved, 1);
    })
    .catch(t.ifError)
})

test.skip('`.watch` transfers `ext` file from `source` to `dest`', async t => {
  t.plan(2);

  await populateSource(['index.js'])
    .then(async () => {
      const result = await watch(ext, dest, {});
      t.is(result.moved, 1);
    })
    .catch(t.ifError)
})
