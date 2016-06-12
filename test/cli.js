import { fork } from 'child_process';
import test from 'ava';

const ext = '.js';
const env = Object.create(process.env);

env.FORK = true;

test.skip('`promptRename` timesout after n ms and filename is retained', async t => {})

test.cb('--preserve protects files from movement', t => {
  const sPut = fork('../cli.js', [ext, __dirname, '--preserve="i.js j.js"'], { env });

  sPut.on('message', m => {
    t.deepEqual(m.preservedFiles, ['i.js', 'j.js']);
    t.end();
  })
})
