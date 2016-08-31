'use strict';
var fileFilter = require('../lib');
var _ = require('lodash');
var path = require('path');

var sinon = require('sinon');
var chai = require('chai');

chai.use(require('chai-string'));

var assert = chai.assert;

var pathCreator = _.partial(_.ary(path.join, 3), __dirname, 'fixtures');

var getFiles = function() {
	var args = _.flattenDeep(arguments);

	return args.map(
		function(item, index) {
			return path.join(__dirname, 'fixtures', item);
		}
	);
};

var files = getFiles(_.times(2, function(n) {
	n += 1;
	return ['unique_' + n + '.txt', 'dupe_' + n + '.txt'];
}));

it(
	'can be instantiated or called directly',
	function() {
		var filesArr = getFiles('unique_1.txt', 'dupe_1.txt');

		var direct = fileFilter([]);
		var instance = new fileFilter([]);

		assert.isTrue('then' in direct, 'fileFilter() is not a promise/thenable');
		assert.isTrue('then' in instance, 'new fileFilter() is not a promise/thenable');
	}
);

it(
	'should only accept arrays or newline separated strings',
	function(done) {
		var filesArr = getFiles('unique_1.txt', 'dupe_1.txt');

		fileFilter().then(
			function(results) {

			}
		).catch(
			function(err) {
				assert.equal(err.message, fileFilter._ERR_INVALID_ARGS);

				done();
			}
		);
	}
);

it(
	'should show unique files',
	function(done) {
		fileFilter(files.join('\n')).then(
			function(results) {
				var uniqueFiles = results[0].uniques;

				assert.equal(uniqueFiles.length, 2);
				assert.isFalse(uniqueFiles.some(function(n) {
					return path.basename(n).indexOf('dupe_') === 0;
				}));
			}
		)
		.done(done, done);
	}
);

it(
	'should show duplicate files',
	function(done) {
		fileFilter(files.join('\n')).then(
			function(results) {
				var duplicateFiles = results[0].duplicates;

				assert.equal(duplicateFiles.length, 2);
				assert.isFalse(duplicateFiles.some(function(n) {
					return path.basename(n).indexOf('unique_') === 0;
				}));
			}
		)
		.done(done, done);
	}
);

it(
	'should consider whitespace in comparing files',
	function(done) {
		var files = getFiles('unique_3.txt', 'dupe_with_spaces_3.txt');

		fileFilter(files.join('\n')).then(
			function(results) {
				var strict = results[0];

				var loose = results[1];

				assert.equal(loose.uniques.length, 1);
				assert.equal(loose.duplicates.length, 1);
				assert.equal(strict.uniques.length, 2);
				assert.equal(strict.duplicates.length, 0);

				assert.isFalse(loose.uniques.some(function(n) {
					return path.basename(n).indexOf('dupe_') === 0;
				}));

				var REGEX_FILE_CHECK = /^(?:unique|dupe)_/;

				assert.isTrue(strict.uniques.every(function(n) {
					return REGEX_FILE_CHECK.test(path.basename(n));
				}));
			}
		)
		.done(done, done);
	}
);

it(
	'should ignore invalid files and directories',
	function(done) {
		fileFilter(['invalid_file.js', __dirname]).then(
			function(results) {
				assert.equal(results[0].allFiles.length, 0);
				assert.equal(results[0].uniques.length, 0);
				assert.equal(results[0].duplicates.length, 0);

				var unprocessed = results[2];
				var dirKeys = Object.keys(unprocessed.dirs);
				var miscKeys = Object.keys(unprocessed.misc);

				assert.equal(dirKeys.length, 1);
				assert.equal(miscKeys.length, 1);

				assert.equal(dirKeys[0], __dirname);
				assert.equal(miscKeys[0], 'invalid_file.js');
			}
		)
		.done(done, done);
	}
);