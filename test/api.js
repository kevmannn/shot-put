import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import test from 'ava';

const ext = '.js';

test.cb('.watch() rejects non-existing dest path', t => {
  const dest = path.join(__dirname, 'x');
  t.plan(2);

  child_process.execFile('../cli.js', [ext, dest], (err, stdout, stderr) => {
    t.ifError(err);
    t.is(stderr, `${dest} is not a valid directory\n`);
    t.end();
  })
})

test.cb('.watch() listens when given valid dest path', t => {
  const sp = child_process.spawn('../cli.js', [ext, __dirname]);
  t.plan(1);

  sp.stdout.on('data', data => {
    t.is(data.toString(), `watching ${path.sep}desktop for new ${ext} files..\n`)
    t.end();
  })
})

test.cb('info.moved reflects number of files moved', t => {
  const env = Object.create(process.env);
  env.FORK = true;

  const sp = child_process.fork('../cli.js', [ext, __dirname], { env });

  sp.on('message', m => {
    t.is(m.movedFiles.length, 0);
    t.end();
  })
})

test.todo('.watch() adds file to dest');

test.todo('.watch() removes file from desktop');
