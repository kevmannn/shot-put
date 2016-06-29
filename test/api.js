import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import test from 'ava';
import pify from 'pify';
import pump from 'pump';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import osHomedir from 'os-homedir';
import { watch } from '../';

const home = osHomedir();
const env = Object.create(process.env);
env.FORK = true;

const params = {
  ext: '.js',
  source: path.resolve('..', 'output', 'x'),
  dest: path.resolve('..', 'output', 'y')
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
  const nonPath = path.join(params.dest, 'z');

  try {
    const result = await watch(params.ext, nonPath, {});
  } catch (err) {
    t.is(err, `${nonPath} is not a valid directory\n`);
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
  const paths = [`~${path.sep}`, home].map(p => path.join(p, params.dest));

  await paths.forEach(async p => {
    const result = await watch(params.ext, p);
    t.deepEqual(result, { moved: [], preserved: [] });
  })
})

test.skip('`.watch` ignores files with extension other than `ext`', async t => {})

test.skip('`.watch` transfers `ext` file from `source` to `dest`', t => {
  const read = fs.createReadStream(path.resolve('..', 'index.js'));
  const mockedSource = fs.createWriteStream(path.join(params.source, 'x.js'));

  pump(read, mockedSource, async err => {
    if (err) return t.ifError(err);

    await watch(params.ext, params.dest, {});
    const x = await pify(fs.readdir)(params.source);
    const y = await pify(fs.readdir)(params.dest);
    
    t.deepEqual(x, []);
    t.deepEqual(y, ['index.js']);
    t.end();
  })
})
