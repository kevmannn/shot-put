import child_process from 'child_process';
import test from 'ava';

const ext = '.js';

test.cb('cli rejects non-string input args', t => {
  const sp = child_process.spawn('../cli.js', [0, __dirname]);

  sp.stderr.on('data', data => {
    t.is(data.toString(), `Invoked with invalid ext and dir. Type 'shotPut --help' for examples\n`);
    t.end();
  })
})

test.cb('--preserve protects files from movement', t => {
  const env = Object.create(process.env);
  env.FORK = true;

  const sp = child_process.fork('../cli.js', [ext, __dirname, '--preserve="i.js j.js"'], { env });

  sp.on('message', m => {
    t.deepEqual(m.preservedFiles, ['i.js', 'j.js']);
    t.end();
  })
})
