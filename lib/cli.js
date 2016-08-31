var _ = require('lodash');
var getStdin = require('get-stdin');
var Promise = require('bluebird');
var meow = require('meow');
var pluralize = require('pluralize');
var sub = require('string-sub');

var fileFilter = require('./');

var getCLI = function() {
	return meow({
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
};

var getWord = function(arr, word) {
	if (arguments.length > 2 && _.isString(arguments[2])) {
		word = _.slice(arguments, 1);
	}

	if (_.isArray(word)) {
		word = word.map(
			function(item, index) {
				return getWord(arr, item);
			}
		);
	}
	else if (arr.length !== 1) {
		word = pluralize(word);
	}

	return word;
};

function CLI(config) {
	config = config || {};

	this._cli = config.cli || getCLI();

	this.start = this._init();
}

CLI.prototype = {
	run: function() {
		return Promise.resolve(this.start).bind(this).then(
			function(inputs) {
				return fileFilter(inputs);
			}
		).then(this._process);
	},

	_init: function() {
		var instance = this;

		var cli = instance._cli;

		return getStdin().then(
			function(stdin) {
				var input = cli.input;

				var inputs = input;

				if (stdin) {
					stdin = stdin.split('\n');

					inputs = stdin.concat(input);
				}
				else {
					stdin = [];
				}

				cli.input = inputs;

				instance.input = input;
				instance.inputs = inputs;
				instance.stdin = stdin;

				return inputs;
			}
		);
	},

	_getSummary: function(files, unprocessed, source) {
		var flags = this._cli.flags;

		if (flags.s || flags.S) {
			var dirs = Object.keys(unprocessed.dirs);
			var misc = Object.keys(unprocessed.misc);

			var duplicates = source.duplicates;
			var uniques = source.uniques;

			var uniqWords = getWord(uniques, 'is', 'file');
			var dupeWords = getWord(duplicates, 'duplicate');

			var str = sub('There {0} {2} unique {1} and {3} {4}', uniqWords[0], uniqWords[1], uniques.length, duplicates.length, dupeWords);

			if (dirs.length || misc.length) {
				var addendum = [];
				var word = '';

				if (dirs.length) {
					word = dirs.length !== 1 ? 'directories' : 'directory';

					addendum.push(sub('{0} {1}', dirs.length, word));
				}

				if (misc.length) {
					word = misc.length !== 1 ? 'files' : 'file';

					addendum.push(sub('{0} {1}', misc.length, word));
				}

				str += '\n' + addendum.join(' and ') + ' could not be processed';
			}

			if (flags.s && process.stdout.isTTY) {
				files.push(str);
			}
			else if (flags.S) {
				files = [str];
			}
		}

		return files;
	},

	_process: function(results) {
		var instance = this;

		var flags = this._cli.flags;

		var strict = results[0];
		var loose = results[1];
		var unprocessed = results[2];

		var source = flags.W ? strict : loose;

		var uniques = source.uniques;
		var duplicates = source.duplicates;

		var files = !flags.i ? uniques : duplicates;

		files = this._getSummary(files, unprocessed, source);

		return files.join('\n');
	}
};

var cliInstance = new CLI();

cliInstance.CLI = cliInstance.constructor = CLI;

cliInstance.getWord = getWord;

module.exports = cliInstance;