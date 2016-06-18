import { fork } from 'child_process';
import test from 'ava';

const ext = '.js';
const env = Object.create(process.env);

env.FORK = true;

test.cb('--preserve protects files from movement', t => {
  const sPut = fork('../cli.js', [ext, __dirname, '--preserve="i.js j.js"'], { env });

  sPut.on('message', m => {
    t.deepEqual(m.preserved, ['i.js', 'j.js']);
    t.end();
  })
})
