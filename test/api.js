import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import test from 'ava';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import pify from 'pify';
import osHomedir from 'os-homedir';
import combined from 'combined-stream';
import { watch } from '../';

const ext = '.js';
const home = osHomedir();
const source = path.resolve('..', 'output', 'x');
const dest = path.resolve('..', 'output', 'y');

const env = Object.create(process.env);
env.FORK = true;

const restoreDir = async (t, dir) => {
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

test.beforeEach(t => [source, dest].forEach(restoreDir.bind(null, t)));

test.skip('`.watch` parses paths to `dest`', async t => {
  const paths = [`~${path.sep}`, home].map(p => path.join(p, dest));

  await paths.forEach(async p => {
    const result = await watch(ext, p);
    t.deepEqual(result, { moved: [], preserved: [] });
  })
})

test('`.watch` rejects non-existing `dest` path', async t => {
  const nonPath = path.join(dest, 'z');

  try {
    const result = await watch(ext, nonPath, {});
  } catch (err) {
    t.is(err, `${nonPath} is not a valid directory\n`);
  }
})

test.cb('`.watch` listens when given valid `dest` path', t => {
  const sPut = fork('../cli.js', [ext, dest], { env });

  sPut.on('message', m => {
    t.deepEqual(m, { moved: [], preserved: [] });
    t.end();
  })
})

test.cb('`info.moved` reflects number of files moved', t => {
  const sPut = fork('../cli.js', [ext, dest], { env });

  sPut.on('message', m => {
    t.is(m.moved.length, 0);
    t.end();
  })
})

// test.skip('`.watch` ignores files with extension other than `ext`', async t => {
//   const sPut = fork('..cli.js', [ext, dest], { env });

//   await populateSource(['index.js', 'README.md'])
//     .then(async () => {
//       const result = await watch(ext, dest, {});
//       t.is(result.moved, 1);
//     })
//     .catch(t.ifError)
// })

test.skip('`.watch` transfers `ext` file from `source` to `dest`', async t => {
  const sPut = fork('../cli.js', [ext, dest], { env });

  await populateSource(['index.js'])
    .then(readDest)
    .catch(t.ifError)

  async function readDest() {
    try {
      const contents = await pify(fs.readdir)(dest);
      t.true(contents.indexOf('index.js') !== -1);
    } catch (err) {
      t.ifError(err);
    }
  }
})
