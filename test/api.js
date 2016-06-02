import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { spawn } from 'child_process';
import { fork } from 'child_process';
import test from 'ava';
// import rimraf from 'rimraf';
// import mkdirp from 'mkdirp';

const ext = '.js';
const dest = path.join(__dirname, 'x');
const env = Object.create(process.env);

env.FORK = true;

// test.beforeEach(t => {})

test.cb('.watch() rejects non-existing dest path', t => {
  execFile('../cli.js', [ext, dest], (err, stdout, stderr) => {
    t.ifError(err);
    
    t.is(stderr, `${dest} is not a valid directory\n`);
    t.end();
  })
})

test.cb('.watch() listens when given valid dest path', t => {
  const sp = spawn('../cli.js', [ext, __dirname]);

  sp.stdout.on('data', data => {
    t.is(data.toString(), `watching ${path.sep}desktop for new ${ext} files..\n`)
    t.end();
  })
})

test.cb('info.moved reflects number of files moved', t => {
  const sp = fork('../cli.js', [ext, __dirname], { env });

  sp.on('message', m => {
    t.is(m.movedFiles.length, 0);
    t.end();
  })
})

// test.skip('.watch() adds file to dest', t => {
//   const sp = spawn('../cli.js', [ext, __dirname], { env });

//   sp.on('close', code => {
//     fs.readdir(dest, (err, data) => {
//       t.ifError(err);

//       t.true(data.indexOf(__filename) !== -1);
//       t.end();
//     })
//   })
// })

// test.skip('.watch() removes file from desktop', t => {})
