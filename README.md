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

fileFilter(['file-filter', 'file1.txt', 'duplicateFile1.txt', 'file2.txt']).then(results => {
	// results => {strict: {...}, loose: {...}, unprocessed: {...}}
});
```

## CLI

```
$ npm install --global file-filter
```

```
$ file-filter --help

  Filter a list of files to only the unique files, based on content

  Usage
    $ file-filter [input]
    $ [input] | file-filter

  Options
    -i Invert the results so that it shows you only the duplicates. Default: false
    -s Append the summary about the number of unique files and duplicates. Default: false
    -S Show only the summary about the number of unique files and duplicates. Default: false
    -W By default, the comparisons ignore whitespace. This makes it so that it respects whitespace differences. Default: false
  Examples
    $ file-filter file1.txt duplicateFile1.txt file2.txt
    file1.txt
    file2.txt

  # Assuming we're in a directory that has the same files as above
    $ ls | file-filter
    file1.txt
    file2.txt
```


## API

### fileFilter(input)

Returns a Promise that resolves to an object of objects, containing the results of the comparisons.

The object returned is structured like so:
```js
	{
		// Strict contains the result of a strict comparison
		strict: {
			uniques: [...], // Array of strings of the unique filenames
			duplicates: [...], // Array of strings of the duplicate filenames
			files: [{name, hash, content}, ...] // Array of objects containing file name, the file hash and content used for the comparison
		},

		// Loose contains the result, but it ignores all whitespace in the comparison
		loose: {
			uniques: [...],
			duplicates: [...],
			files: [...]
		},

		// Unprocessed contains two arrays, one for any directories and one for anything else that was passed in but can't be read for whatever reason.
		unprocessed: {
			dirs: [...],
			misc: [...]
		}
	}
```

#### input

*Required*
Type: `string|Array`

This is the list of files to filter. It can be an array of files, or a newline separated string.


## License

MIT © [Nate Cavanaugh](http://alterform.com)

[npm-image]: https://img.shields.io/npm/v/file-filter.svg?style=flat-square
[npm-url]: https://npmjs.org/package/file-filter
[travis-image]: https://img.shields.io/travis/natecavanaugh/file-filter/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/natecavanaugh/file-filter
[coveralls-image]: https://img.shields.io/coveralls/natecavanaugh/file-filter/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/natecavanaugh/file-filter?branch=master