# shot-put

> CLI tool to watch desktop for files of a given extension and automatically move them to a given directory

[![Build Status](https://travis-ci.org/kevmannn/shot-put.svg?branch=master)](https://travis-ci.org/kevmannn/shot-put)

## Install

```console
npm install --global shot-put
```

## Usage

Watch desktop for `ext` files and move them to `dir` (`dir` is relative to your user home):
```console
shot-put <ext dir>
```

### Options
Prevent specific files from ever being moved:
```console
shot-put <ext dir> --preserve="<filenames>"
```

### Examples
```console
shot-put .png /desktop/ideas/space
shot-put .js /documents/scripts
shot-put .py /documents/scripts --preserve="i.py j.py"
```

## License

MIT © [Kevin Donahue](https://twitter.com/recur_excur)
