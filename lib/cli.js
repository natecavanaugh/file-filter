#!/usr/bin/env node

'use strict';

var meow = require('meow');
var _ = require('lodash');
var fileFilter = require('./');

var getStdin = require('get-stdin');

var cli = meow({
	help: [
		'Usage',
		'  $ file-filter [input]',
		'  $ [input] | file-filter',
		'',
		'Options',
		'  -i Invert the results so that it shows you only the duplicates. Default: false',
		'  -s Append the summary about the number of unique files and duplicates. Default: false',
		'  -S Show only the summary about the number of unique files and duplicates. Default: false',
		'  -W By default, the comparisons ignore whitespace. This makes it so that it respects whitespace differences. Default: false',
		'Examples',
		'  $ file-filter file1.txt duplicateFile1.txt file2.txt',
		'  file1.txt',
		'  file2.txt',
		'',
		'# Assuming we\'re in a directory that has the same files as above',
		'  $ ls | file-filter',
		'  file1.txt',
		'  file2.txt',
		''
	]
});

const FLAGS = cli.flags;

var TTY_OUTPUT = process.stdout.isTTY;

getStdin().then(
	function(stdin) {
		return fileFilter(stdin || cli.input.join('\n'));
	}
).then(
	function(results) {
		var [strict, loose, unprocessed] = results;

		var source = FLAGS.W ? strict : loose;

		var {uniques, duplicates} = source;

		var message = uniques;

		if (FLAGS.i) {
			message = duplicates;
		}

		var dirs = Object.keys(unprocessed.dirs);
		var misc = Object.keys(unprocessed.misc);

		if (FLAGS.s || FLAGS.S) {
			var str = `There are ${uniques.length} unique file(s) and ${duplicates.length} duplicate(s)`;

			if (dirs.length || misc.length) {
				var addendum = [];
				var word = '';

				if (dirs.length) {
					word = dirs.length !== 1 ? 'directories' : 'directory';
					addendum.push(`${dirs.length} ${word}`);
				}

				if (misc.length) {
					word = misc.length !== 1 ? 'files' : 'file';
					addendum.push(`${misc.length} ${word}`);
				}

				if (addendum.length) {
					str += '\n' + addendum.join(' and ') + ' could not be processed';
				}
				else {
					addendum = '';
				}
			}

			if (FLAGS.s && TTY_OUTPUT) {
				message.push(str);
			}
			else if (FLAGS.S) {
				message = [str];
			}
		}

		return message.join('\n');
	}
)
.catch(
	function(err) {
		console.log('There was an error reading one or all of the files');
		console.log(err);
		return '';
	}
)
.then(console.log.bind(console));