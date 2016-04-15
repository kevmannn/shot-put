import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import test from 'ava';
// import execa from 'execa';
// import tempWrite from 'temp-write';
import uniqueTempDir from 'unique-temp-dir';
import shotPut from '../';

test.cb('.watch() rejects desktop dest path', t => {
  t.plan(2);
  const dest = '/desktop';
  child_process.execFile('../cli.js', ['.js', dest], (err, stdout, stderr) => {
    t.ifError(err);
    t.is(stderr, 'dir must be a directory other than /desktop\n');
    t.end();
  })
})

test.cb('.watch() rejects non-existing dest path', t => {
  t.plan(2);
  const dest = uniqueTempDir();
  child_process.execFile('../cli.js', ['.js', dest], (err, stdout, stderr) => {
    t.ifError(err);
    t.is(stderr, `${dest} is not a valid directory\n`);
    t.end();
  })
})

test.todo('.moved reflects number of files moved');

test.todo('.revert() restores moved files to desktop');
