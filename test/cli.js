import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import test from 'ava';
import execa from 'execa';

const ext = '.js';
const dest = `${path.sep}documents`;

test.skip('--preserve protects files from movement', t => {
  const sp = child_process.spawn('../cli.js', [ext, dest, `--preserve="${n.js}"`]);
})

test.todo('--default stores ext and dir values');

test.todo('rejects non-string input args');
