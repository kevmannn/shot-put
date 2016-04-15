import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempWrite from 'temp-write';
import uniqueTempDir from 'unique-temp-dir';
import execa from 'execa';
import shotPut from '../';

test('.watch() handles valid dest path', async t => {
  const dest = '/documents';
  execa('../cli.js', ['.js', dest])
    .then(result => {

      t.is(result.stdout, '\nwatching ${path.sep}desktop for new .js files..\n');
    })
    .catch(err => console.error(err))
})

test('.watch() handles invalid dest path', async t => {
  const dest = await uniqueTempDir();
  execa('../cli.js', ['.js', dest])
    .then(result => {

      t.is(result.stderr, `${dest} is not a valid directory`);
    })
    .catch(err => console.error(err))
})

test('.watch() detects file with ext suffix', async t => {
  // ..
})

test.todo('.moved reflects number of files moved');

test.todo('.revert() restores moved files to desktop');

test.todo('set user default ext and dir');
