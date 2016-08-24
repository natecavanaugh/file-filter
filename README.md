# file-filter
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Filter a list of files to including only the unique files, based on content


## Install

```
$ npm install --save file-filter
```


## Usage

```js
var fileFilter = require('file-filter');

fileFilter('belgian');
//=> BEST BEER EVAR!
```

## CLI

```
$ npm install --global file-filter
```
```
$ file-filter --help

  Usage
    file-filter [input]

  Example
    file-filter
    BEER!

    file-filter belgian
    BEST BEER EVAR!

  Options
    --foo Lorem ipsum. Default: false
```


## API

### fileFilter(input, [options])

#### input

*Required*
Type: `string`

Lorem ipsum.

#### options

##### foo

Type: `boolean`
Default: `false`

Lorem ipsum.


## License

MIT © [Nate Cavanaugh](http://alterform.com)

[npm-image]: https://img.shields.io/npm/v/file-filter.svg?style=flat-square
[npm-url]: https://npmjs.org/package/file-filter
[travis-image]: https://img.shields.io/travis/natecavanaugh/file-filter/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/natecavanaugh/file-filter
[coveralls-image]: https://img.shields.io/coveralls/natecavanaugh/file-filter/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/natecavanaugh/file-filter?branch=master