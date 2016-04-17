#!/usr/bin/env node
'use strict';

const meow = require('meow');
const chalk = require('chalk');
const shotPut = require('./');

const cli = meow({
  help: [
    'Usage:',
    '  $ shot-put <ext dir> Watch desktop for `ext` files and move them to `dir`',
    '',
    'Options:',
    '  --preserve="<filenames>" Prevent specific files from ever being moved',
    '',
    'Examples:',
    '  shot-put .png /desktop/ideas/space',
    '  shot-put .js /documents/scripts',
    '  shot-put .py /documents/scripts --preserve="i.py j.py"'
  ]
})

const input = cli.input;
const flags = cli.flags;

if (input.length < 2 || input.some(arg => typeof arg !== 'string')) {
  process.stderr.write(`Invoked with invalid ext and dir. Type 'shotPut --help' for examples\n`);
  process.exit(1);
}

shotPut.watch(input[0], input[1], flags);

process.on('SIGINT', () => {

  process.stdout.write(chalk.cyan(`\nmoved ${shotPut.movedFiles.length} ${input[0]} file${shotPut.movedFiles.length === 1 ? '' : 's'} to ${input[1]}: \n`));
  shotPut.movedFiles.forEach(file => console.log(chalk.magenta(file)));

  process.exit(0);
})
