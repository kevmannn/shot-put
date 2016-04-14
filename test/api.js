import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempWrite from 'temp-write';
import uniqueTempDir from 'unique-temp-dir';
import execa from 'execa';
import shotPut from '../';

test('.watch() handles invalid dest path', async t => {
  const dir = await uniqueTempDir();
  shotPut.watch('.js', dir);
  // t.is(shotPut.watch('.js', p), '');
})

test('.watch() moves existing files with ext suffix', async t => {
  const p = await tempWrite('const n = 42;\n', 'n.js');

})

test('.watch() moves detected file with ext suffix', async t => {

})

test.todo('.moved reflects number of files moved');

test.todo('.revert()');

test.todo('set user default ext and dir');
