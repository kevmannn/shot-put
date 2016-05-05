#!/usr/bin/env node
'use strict';

const meow = require('meow');
const chalk = require('chalk');
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

// TODO: ..
if (process.env.FORK) {
  setTimeout(() => {
    process.kill(process.pid, 'SIGINT');
  }, 0)
}

return shotPut.watch(input[0], input[1], flags)
  .then(info => {
    const q = chalk.cyan(chalk.bold(`${info.moved.length}`));
    const d = chalk.green(chalk.bold(`${input[1]}`));

    process.stdout.write(`\nmoved ${q} ${input[0]} file${info.moved.length === 1 ? '' : 's'} to ${d}: \n`);
    info.moved.forEach(file => console.log('  ' + chalk.italic(file)));

    if (process.env.FORK) {
      process.send({ movedFiles: info.moved, preservedFiles: info.preserved });
    }

    process.exit(0);
  })
  .catch(err => {
    process.stderr.write(chalk.red(err));
  })
