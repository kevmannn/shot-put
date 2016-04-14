import fs from 'fs';
import path from 'path';
import test from 'ava';
import tempWrite from 'temp-write';
import execa from 'execa';
import shotPut from '../';

test('.watch() handles valid dest path', async t => {
  const validPath = await tempWrite('const n = 42;\n', 't.js');
  // ..
})

test('.watch() moves existing files with ext suffix', async t => {

})

test('.watch() moves detected file with ext suffix', async t => {

})

test.todo('.moved reflects number of files moved');

test.todo('.revert()');

test.todo('set user default ext and dir');
