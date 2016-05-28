#!/usr/bin/env node
'use strict';

const path = require('path');
const meow = require('meow');
const chalk = require('chalk');
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

if (input.length < 2 || input.some(arg => typeof arg !== 'string')) {
  process.stderr.write(`Invoked with invalid ext and dir. Type 'shotPut --help' for examples\n`);
  process.exit(1);
}

if (process.env.FORK) {
  process.nextTick(() => {
    process.kill(process.pid, 'SIGINT');
  })
}

const chalkForm = methods => {
  return str => methods.reduce((p, c) => chalk[c](p), str);
}

shotPut.ps.on('watch', () => {
  process.stdout.write(`watching ${path.sep}desktop for new ${chalk.bold(input[0])} files..\n`);
})

shotPut.ps.on('moved', file => {
  log(`..moved ${chalkForm(['italic', 'dim'])(file)}\n`);
})

shotPut.watch(input[0], input[1], flags)
  .then(info => {
    const numMoved = chalkForm(['cyan', 'bold'])(info.moved.length + '');
    const dest = chalkForm(['green', 'bold'])(input[1]);
    const str = `\n\nmoved ${numMoved} ${input[0]} file${info.moved.length === 1 ? '' : 's'} to ${dest}:\n`;

    process.stdout.write(str);

    info.moved.forEach(file => process.stdout.write(`  ${chalkForm(['italic', 'dim'])(file)}\n`));

    if (process.env.FORK) {
      process.send({ movedFiles: info.moved, preservedFiles: info.preserved });
    }

    process.exit(0);
  })
  .catch(err => {
    process.stderr.write(chalk.red(err));
  })
