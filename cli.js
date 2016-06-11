#!/usr/bin/env node
'use strict';
const meow = require('meow');
const ansi = require('ansi-escapes');
const chalkForm = require('chalk-form');
const log = require('single-line-log').stdout;
const sPut = require('./');

const cli = meow(`
  Usage:
    $ shot-put <ext dir> Watch /desktop for 'ext' files and move them to 'dir'

  Options:
    --preserve="<filenames>" Prevent specific files from ever being moved

  Examples:
    $ shot-put .png /desktop/ideas/space
    $ shot-put .js /documents/scripts
    $ shot-put .py /documents/scripts --preserve="i.py j.py"
`, {
  alias: {
    p: 'preserve'
  }
})

let sourceStr = '';
const destStr = chalkForm(['cyan', 'bold'])(cli.input[1]);

const negation = new Set(['\u001B', '\u007F', '\u0003']); // esc, delete, eot
const resolution = new Set(['\r', '\t']); // enter, tab

const write = str => process.stdout.write(str);
const writeErr = err => process.stderr.write(`> ${err}`);

const restore = () => {
  ansi.eraseLines(1);
  process.stdin.removeAllListeners('readable');
}

sPut.ps.on('watch', src => {
  sourceStr = chalkForm(['dim'])(src);
  write(`\n> watching ${sourceStr} for new ${chalkForm(['bold', 'cyan'])(cli.input[0])} files..\n`);
})

// sPut.ps.on('detect', promptRename);

// sPut.ps.on('partial', log);

sPut.ps.on('move', file => {
  log(`  + ${chalkForm(['italic', 'dim'])(file)}\n`);
})

sPut.watch(cli.input[0], cli.input[1], cli.flags)
  .then(logResult)
  .catch(writeErr)

function logResult(info) {
  const numMovedStr = chalkForm(['cyan', 'bold'])(`${info.moved.length} ${cli.input[0]}`);

  if (process.env.FORK) {
    process.send({ movedFiles: info.moved, preservedFiles: info.preserved });
  }
  
  write(`\n> moved ${numMovedStr} file${info.moved.length === 1 ? '' : 's'} from ${sourceStr} to ${destStr}:\n`);

  info.moved.forEach(f => write(`  ${chalkForm(['italic', 'dim'])(f)}\n`));
  process.exit(0);
}

function promptRename(file) {
  log(`> rename ${chalkForm(['italic', 'dim'])(file)} ${chalkForm(['bold'])('? (enter/esc)')}\n`);

  const timer = setTimeout(() => {
    sPut.ps.emit('rename-timeout');
    restore();
  }, 10 * 1000)

  process.stdin.on('readable', () => {
    const userIn = process.stdin.read();

    if (resolution.has(userIn)) {
      clearTimeout(timer);
      initRename(file);
    } else if (negation.has(userIn)) {
      restore();
    }
  })
}

function initRename(filename) {
  log('>  \n');

  process.stdin.on('readable', () => {
    const userIn = process.stdin.read();

    if (resolution.has(userIn)) sPut.ps.emit('rename-init', userIn.toString());
  })
}
