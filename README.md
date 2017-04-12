# shot-put

[![Greenkeeper badge](https://badges.greenkeeper.io/kevmannn/shot-put.svg)](https://greenkeeper.io/)

> CLI tool to watch desktop for files of a given extension and automatically move them to a given directory

[![Build Status](https://travis-ci.org/kevmannn/shot-put.svg?branch=master)](https://travis-ci.org/kevmannn/shot-put)

## Install

```console
npm install --global shot-put
```

## Usage

Watch `/desktop` for `ext` files and move them to `dir` (`dir` is relative to your user home):
```console
$ shot-put <ext dir>
```

### Options
* `-p`, `--preserve` - prevent specific files from ever being moved

### Examples
```console
$ shot-put .png /desktop/ideas/space
$ shot-put .js /documents/scripts
$ shot-put .py /documents/scripts --preserve="i.py j.py"
$ shot-put .py /documents/scripts -p="i.py j.py k.py"
```

## License

MIT © [Kevin Donahue](https://twitter.com/nonnontrivial)
