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
	'should show unique files',
	function(done) {
		fileFilter(files.join('\n')).then(
			function(results) {
				var uniqueFiles = results[0].uniques;

				assert.equal(uniqueFiles.length, 2);
				assert.isFalse(uniqueFiles.some(function(n) {
					return path.basename(n).indexOf('dupe_') === 0;
				}));

				done();
			}
		);
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

				done();
			}
		);
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
				done();
			}
		);
	}
);

// it(
// 	'should accept input from stdin',
// 	function(done) {
// 		assert.strictEqual(fileFilter('belgian'), 'BEST BEER EVAR!');
// 	}
// );

// it(
// 	'should accept arguments from parameters',
// 	function(done) {
// 		assert.strictEqual(fileFilter('belgian'), 'BEST BEER EVAR!');
// 	}
// );

// it(
// 	'should show a summary after a file list',
// 	function(done) {
// 		assert.strictEqual(fileFilter('belgian'), 'BEST BEER EVAR!');
// 	}
// );

// it(
// 	'should show only a summary',
// 	function(done) {
// 		assert.strictEqual(fileFilter('belgian'), 'BEST BEER EVAR!');
// 	}
// );