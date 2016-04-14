# shot-put

> CLI tool to watch desktop for files of a given extension and automatically move them to a given directory

[![Build Status](https://travis-ci.org/kevmannn/shot-put.svg?branch=master)](https://travis-ci.org/kevmannn/shot-put)

## Install

```console
npm install --global shot-put
```

## Usage

Watch desktop for `ext` files and move them to `dir` (dir is relative to your home dir):
```console
shot-put <ext dir>
```

Flag files (of type `ext`) that should never be moved:
```console
shot-put <ext dir> --preserve=file.png
```

## License

MIT © [Kevin Donahue](https://twitter.com/recur_excur)
