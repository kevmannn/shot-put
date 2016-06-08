import { spawn, fork } from 'child_process';
import test from 'ava';

const ext = '.js';
const env = Object.create(process.env);

env.FORK = true;

test.cb('--preserve protects files from movement', t => {
  const sp = fork('../cli.js', [ext, __dirname, '--preserve="i.js j.js"'], { env });

  sp.on('message', m => {
    t.deepEqual(m.preservedFiles, ['i.js', 'j.js']);
    t.end();
  })
})
