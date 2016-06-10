#!/usr/bin/env node
'use strict';
const path = require('path');
const meow = require('meow');
const chalkForm = require('chalk-form');
const log = require('single-line-log').stdout;
const shotPut = require('./');

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
const destStr = chalkForm(['green', 'bold'])(cli.input[1]);

const write = str => process.stdout.write(str);

shotPut.ps.on('watch', src => {
  sourceStr = chalkForm(['dim'])(src);
  write(`watching ${sourceStr} for new ${chalkForm(['bold', 'cyan'])(cli.input[0])} files..\n`);
})

shotPut.ps.on('moved', file => {
  log(`..moved ${chalkForm(['italic', 'dim'])(file)}\n`);
  // promptRename(file);
})

shotPut.watch(cli.input[0], cli.input[1], cli.flags)
  .then(info => {
    const numMovedStr = chalkForm(['cyan', 'bold'])(`${info.moved.length} ${cli.input[0]}`);

    if (process.env.FORK) {
      process.send({ movedFiles: info.moved, preservedFiles: info.preserved });
    }
    
    write(`\n\nmoved ${numMovedStr} file${info.moved.length === 1 ? '' : 's'} from ${sourceStr} to ${destStr}:\n`);

    info.moved.forEach(f => write(`  ${chalkForm(['italic', 'dim'])(f)}\n`));
    process.exit(0);
  })
  .catch(err => {
    process.stderr.write(err);
  })

function promptRename(file) {
  write(`> rename ${file} (y/n) ?  `);

  process.stdin.setRawMode(true);
  process.stdin.on('readable', initRename.bind(null, file, process.stdin.read()));
}

function initRename(filename, ynInput) {
  const negation = new Set(['\u0003']);
  const resolution = new Set(['\r', '\t', 121, 89]);

  if (ynInput === null || negation.indexOf(ynInput) !== -1) return false;

  write('>\n');
  process.stdin.on('readable', () => {
    shotPut.rename(process.stdin.read(), err => {})
  })
}
