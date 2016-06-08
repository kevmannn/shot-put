import { spawn, fork } from 'child_process';
import test from 'ava';

const ext = '.js';
const env = Object.create(process.env);

env.FORK = true;

test.cb('cli rejects non-string input args', t => {
  const sp = spawn('../cli.js', [0, __dirname]);

  sp.stderr.on('data', data => {
    t.is(data.toString(), `Invoked with invalid ext and dir. Type 'shotPut --help' for examples\n`);
    t.end();
  })
})

test.cb('--preserve protects files from movement', t => {
  const sp = fork('../cli.js', [ext, __dirname, '--preserve="i.js j.js"'], { env });

  sp.on('message', m => {
    t.deepEqual(m.preservedFiles, ['i.js', 'j.js']);
    t.end();
  })
})
