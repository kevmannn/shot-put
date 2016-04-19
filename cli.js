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

return shotPut.watch(input[0], input[1], flags)
  .then(info => {

    process.stdout.write(chalk.cyan(`\nmoved ${info.moved.length} ${input[0]} file${info.moved.length === 1 ? '' : 's'} to ${input[1]}: \n`));
    info.moved.forEach(file => console.log(chalk.magenta(file)));

    process.exit(0);
  })
