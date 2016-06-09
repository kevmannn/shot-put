#!/usr/bin/env node
'use strict';

const path = require('path');
const meow = require('meow');
const chalkForm = require('chalk-form');
const log = require('single-line-log').stdout;
const shotPut = require('./');

const cli = meow(`
  Usage:
    $ shot-put <ext dir> Watch desktop for 'ext' files and move them to 'dir'

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

const input = cli.input;
const flags = cli.flags;

let sourceStr = '';
const dest = chalkForm(['green', 'bold'])(input[1]);

const write = str => process.stdout.write(str);

if (process.env.FORK) {
  process.nextTick(() => process.kill(process.pid, 'SIGINT'));
}

shotPut.ps.on('watch', src => {
  sourceStr = chalkForm(['dim'])(src);
  write(`watching ${sourceStr} for new ${chalkForm(['bold', 'cyan'])(input[0])} files..\n`);
})

shotPut.ps.on('moved', file => {
  log(`..moved ${chalkForm(['italic', 'dim'])(file)}\n`);
})

shotPut.watch(input[0], input[1], flags)
  .then(info => {
    const numMovedStr = chalkForm(['cyan', 'bold'])(`${info.moved.length} ${input[0]}`);

    if (process.env.FORK) {
      process.send({ movedFiles: info.moved, preservedFiles: info.preserved });
    }
    
    write(`\n\nmoved ${numMovedStr} file${info.moved.length === 1 ? '' : 's'} from ${sourceStr} to ${dest}:\n`);

    info.moved.forEach(f => write(`  ${chalkForm(['italic', 'dim'])(f)}\n`));
    process.exit(0);
  })
  .catch(err => {
    process.stderr.write(chalkForm(['red', 'bold'])(err));
  })
