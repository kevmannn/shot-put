#!/usr/bin/env node
'use strict';
const meow = require('meow');
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

const write = str => process.stdout.write(`\n> ${str}\n`);
const writeErr = err => process.stderr.write(`\n> ${err}\n`);

sPut.ps.on('begin-watch', src => {
  sourceStr = chalkForm(['dim'])(src);
  write(`watching ${sourceStr} for new ${chalkForm(['bold', 'cyan'])(cli.input[0])} files..`);
})

sPut.ps.on('move', file => {
  log(`  + ${chalkForm(['italic', 'dim'])(file)}\n`);
})

sPut.watch(cli.input[0], cli.input[1], cli.flags)
  .then(logResult)
  .catch(writeErr)

function logResult(info) {
  const numMovedStr = chalkForm(['cyan', 'bold'])(`${info.moved.length} ${cli.input[0]}`);

  write(`moved ${numMovedStr} file${info.moved.length === 1 ? '' : 's'} from ${sourceStr} to ${destStr}:`);

  info.moved.forEach(f => console.log(`  ${chalkForm(['italic', 'dim'])(f)}\n`));
  process.exit(0);
}
