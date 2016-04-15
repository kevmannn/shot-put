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
    'Examples:',
    '  shot-put .png /desktop/ideas/space',
    '  shot-put .js /desktop/ideas/js --preserve=index.js'
  ]
})

const flags = cli.flags;

if (cli.input.length < 2) {
  process.stderr.write(`Invoked without ext and dir. Type 'shotPut --help' for examples\n`);
  process.exit(0);
}

shotPut.watch(cli.input[0], cli.input[1], flags);

process.on('SIGINT', () => {

  process.stdout.write(chalk.cyan(`\nmoved ${shotPut.movedFiles.length} ${cli.input[0]} file${shotPut.movedFiles.length === 1 ? '' : 's'} to ${cli.input[1]}: \n`));
  shotPut.movedFiles.forEach(file => console.log(chalk.magenta(file)));

  process.exit(0);
})
