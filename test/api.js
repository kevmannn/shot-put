import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import test from 'ava';
// import execa from 'execa';
// import tempWrite from 'temp-write';
import uniqueTempDir from 'unique-temp-dir';
import shotPut from '../';

const ext = '.js';

test.cb('.watch() rejects non-existing dest path', t => {
  t.plan(2);
  const dest = uniqueTempDir();
  child_process.execFile('../cli.js', [ext, dest], (err, stdout, stderr) => {
    t.ifError(err);
    t.is(stderr, `${dest} is not a valid directory\n`);
    t.end();
  })
})

test.cb('.watch() listens when given valid dest path', t => {
  t.plan(1);
  const dest = '/documents';
  const sp = child_process.spawn('../cli.js', [ext, dest]);

  sp.stdout.on('data', (data) => {
    t.is(data.toString(), `watching ${path.sep}desktop for new ${ext} files..\n`)
    t.end();
  })
})

test.todo('.moved reflects number of files moved');

test.todo('.revert() restores moved files to desktop');
