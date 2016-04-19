import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import test from 'ava';
import tempWrite from 'temp-write';
import uniqueTempDir from 'unique-temp-dir';
// import shotPut from '../';

const ext = '.js';
const home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

test.cb('.watch() rejects non-existing dest path', t => {
  const dest = path.join(uniqueTempDir(), `${path.sep}x`);
  t.plan(2);

  child_process.execFile('../cli.js', [ext, dest], (err, stdout, stderr) => {
    t.ifError(err);
    t.is(stderr, `${dest} is not a valid directory\n`);
    t.end();
  })
})

test.cb('.watch() listens when given valid dest path', t => {
  const sp = child_process.spawn('../cli.js', [ext, home]);
  t.plan(1);

  sp.stdout.on('data', data => {
    t.is(data.toString(), `watching ${path.sep}desktop for new ${ext} files..\n`)
    t.end();
  })
})

// test.skip('.moved reflects number of files moved', t => {
//   const sp = child_process.spawn('../cli.js', [ext, home]);
//   t.plan(2);

//   sp.stdout.on('data', data => {
//     t.deepEqual(shotPut.movedFiles, []);
//     t.is(shotPut.movedFiles.length, 0);
//     t.end();
//   })
// })

test.todo('.watch() adds file to dest');

test.todo('.watch() removes file from desktop');

test.todo('.revert() restores moved files to desktop');
