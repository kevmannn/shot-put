import { fork } from 'child_process';
import { resolve, join } from 'path';
import fs from 'graceful-fs';
import test from 'ava';
import pify from 'pify';
import pump from 'pump';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import osHomedir from 'os-homedir';
import multistream from 'multistream';
import { watch } from '../';

const home = osHomedir();
const env = Object.create(process.env);
env.FORK = true;

const params = {
  ext: '.js',
  source: resolve('..', 'output', 'x'),
  dest: resolve('..', 'output', 'y')
}

const restoreDir = async (t, dir) => {
  try {
    await pify(rimraf)(dir);
    mkdirp(dir);
  } catch (err) {
    t.ifError(err);
  }
}

test.beforeEach(t => [params.source, params.dest].forEach(restoreDir.bind(null, t)));

test('`.watch` rejects non-existing `dest` path', async t => {
  const nonPath = join(params.dest, 'z');

  try {
    const result = await watch(params.ext, nonPath, {});
  } catch (err) {
    t.is(err, `${nonPath} is not a valid directory\n`);
  }
})

test('`.watch` rejects non-string `ext` and `dest`', async t => {
  try {
    const result = await watch(2, null, {});
  } catch (err) {
    t.truthy(err);
  }
})

test.cb('`.watch` listens when given valid `dest` path', t => {
  const sPut = fork('../cli.js', [params.ext, params.dest], { env });

  sPut.on('message', m => {
    t.deepEqual(m, { moved: [], preserved: [] });
    t.end();
  })
})

test.cb('`info.moved` reflects number of files moved', t => {
  const sPut = fork('../cli.js', [params.ext, params.dest], { env });

  sPut.on('message', m => {
    t.is(m.moved.length, 0);
    t.end();
  })
})

test.skip('`.watch` parses varying paths to `dest`', async t => {
  const paths = [`~${path.sep}`, home].map(p => join(p, params.dest));

  await paths.forEach(async p => {
    const result = await watch(params.ext, p);
    t.deepEqual(result, { moved: [], preserved: [] });
  })
})

test.skip('`.watch` ignores files with extension other than `ext`', async t => {})

test.skip('`.watch` transfers `ext` file from `source` to `dest`', t => {
  const indexRs = fs.createReadStream(resolve('..', 'index.js'));
  const sourceWs = fs.createWriteStream(join(params.source, 'x.js'));

  pump(indexRs, sourceWs, async err => {
    if (err) return t.ifError(err);

    await watch(params.ext, params.dest, {});
    const x = await pify(fs.readdir)(params.source);
    const y = await pify(fs.readdir)(params.dest);
    
    t.deepEqual(x, []);
    t.deepEqual(y, ['index.js']);
    t.end();
  })
})
