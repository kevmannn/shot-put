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
    '  --preserve=<files> File names (of type ext) to never move',
    '',
    'Examples:',
    '  shot-put .png /desktop/ideas/space',
    '  shot-put .js /desktop/ideas/js --preserve=index.js'
  ]
})

const flags = cli.flags;
shotPut.watch(cli.input[0], cli.input[1], flags);

process.on('SIGINT', () => {

  if (!cli.input[1]) {
    return process.stderr.write(`\nInvoked without a dest. Type shotPut --help for examples`);
  }

  process.stdout.write(chalk.cyan(`\nmoved ${shotPut.movedFiles.length} ${cli.input[0]} file${shotPut.movedFiles.length === 1 ? '' : 's'} to ${cli.input[1]}: \n`));
  shotPut.movedFiles.forEach(file => console.log(chalk.magenta(file)));

  process.exit(0);
})
