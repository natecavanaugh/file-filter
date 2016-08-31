'use strict';
var fileFilter = require('../lib');
var sub = require('string-sub');

var mockStdin = require('mock-stdin');

var cli = require('../lib/cli');

var _ = require('lodash');
var path = require('path');

var sinon = require('sinon');
var chai = require('chai');

chai.use(require('chai-string'));

var Promise = require('bluebird');

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

describe(
	'CLI',
	function() {
		var argv = _.clone(process.argv);

		it(
			'should accept input from stdin',
			function(done) {
				var stdin = process.stdin;

				var originalTTY = stdin.isTTY;

				stdin.isTTY = false;

				var instance = new cli.CLI();

				stdin.push(files.join('\n'));

				stdin.emit('end');

				assert.isDefined(instance.start);

				instance.run().then(
					function(results) {
						var res = results.split(/\n/);

						assert.equal(res.length, 2);
						assert.match(res[0], /unique_1.txt$/);
						assert.match(res[1], /unique_2.txt$/);
					}
				)
				.done(done, done);

				stdin.isTTY = originalTTY;
			}
		);

		it(
			'should accept arguments from parameters',
			function(done) {
				process.argv = argv.slice(0, 2).concat(files);

				var instance = new cli.CLI();

				instance.run().then(
					function(results) {
						var res = results.split(/\n/);

						assert.equal(res.length, 2);
						assert.match(res[0], /unique_1.txt$/);
						assert.match(res[1], /unique_2.txt$/);

						process.argv = argv;
					}
				)
				.done(done, done);
			}
		);

		it(
			'should show a summary after a file list',
			function(done) {
				var args = argv.slice(0, 2).concat(files);

				args.push('-s');

				process.argv = args;

				var instance = new cli.CLI();

				instance.run().then(
					function(results) {
						var res = results.split(/\n/);

						assert.equal(res.length, 3);
						assert.match(res[0], /unique_1.txt$/);
						assert.match(res[1], /unique_2.txt$/);
						assert.equal(res[2], 'There are 2 unique files and 2 duplicates');

						process.argv = argv;
					}
				)
				.done(done, done);
			}
		);

		it(
			'should not show a summary when sent to another command',
			function(done) {
				var args = argv.slice(0, 2).concat(files);

				args.push('-s');

				process.argv = args;

				process.stdout.isTTY = false;

				var instance = new cli.CLI();

				instance.run().then(
					function(results) {
						var res = results.split(/\n/);

						assert.equal(res.length, 2);
						assert.match(res[0], /unique_1.txt$/);
						assert.match(res[1], /unique_2.txt$/);

						process.argv = argv;
					}
				)
				.done(done, done);
			}
		);

		it(
			'should show only a summary',
			function(done) {
				var args = argv.slice(0, 2).concat(files);

				args.push('-S');

				process.argv = args;

				var instance = new cli.CLI();

				instance.run().then(
					function(results) {
						var res = results.split(/\n/);

						assert.equal(res.length, 1);
						assert.equal(res[0], 'There are 2 unique files and 2 duplicates');

						process.argv = argv;
					}
				)
				.done(done, done);
			}
		);

		it(
			'should show a summary of invalid entries',
			function(done) {
				var args = argv.slice(0, 2).concat(files, __dirname, 'invalid_file.js');

				args.push('-S');

				var subStr = _.partial(sub, 'invalid_file_{0}.txt');

				var directories = ['../lib', '../node_modules', './fixtures'].map(_.unary(path.join.bind(path, __dirname)));

				var promises = _.times(3).map(
					function(item, index) {
						index += 1;

						var dirs = _.slice(directories, 0, index);

						process.argv = args.concat(dirs, _.times(index, subStr));

						var instance = new cli.CLI();

						return instance.run().then(
							function(results) {
								var res = results.split(/\n/);

								assert.equal(res.length, 2);
								assert.equal(res[0], 'There are 2 unique files and 2 duplicates');

								var dirWord = dirs.length !== 1 ? 'directories' : 'directory';
								var fileWord = (index + 1) !== 1 ? 'files' : 'file';

								assert.equal(res[1], sub('{0} {2} and {1} {3} could not be processed', dirs.length, index + 1, dirWord, fileWord));
							}
						);
					}
				);

				promises = promises.concat(
					[directories[0], 'invalid_file_1.txt'].map(
						function(item, index) {
							process.argv = args.slice(0, 4).concat(item, '-S');

							var instance = new cli.CLI();

							return instance.run().then(
								function(results) {
									var res = results.split(/\n/);

									var type = item.indexOf('.txt') > -1 ? 'file' : 'directory';

									assert.equal(res[1], sub('1 {0} could not be processed', type));
								}
							);
						}
					)
				);

				Promise.all(promises).done(_.ary(done, 0), done);

				process.argv = argv;
			}
		);

		it(
			'should show duplicates',
			function(done) {
				var args = argv.slice(0, 2).concat(files);

				args.push('-i');

				process.argv = args;

				var instance = new cli.CLI();

				instance.run().then(
					function(results) {
						var res = results.split(/\n/);

						assert.equal(res.length, 2);
						assert.match(res[0], /dupe_1.txt$/);
						assert.match(res[1], /dupe_2.txt$/);

						process.argv = argv;
					}
				)
				.done(done, done);
			}
		);

		it(
			'should allow for strict space checking',
			function(done) {
				var args = argv.slice(0, 2).concat(getFiles('unique_3.txt', 'dupe_with_spaces_3.txt'));

				args.push('-W');

				process.argv = args;

				var instance = new cli.CLI();

				instance.run().then(
					function(results) {
						var res = results.split(/\n/);

						assert.equal(res.length, 2);
						assert.match(res[0], /unique_3.txt$/);
						assert.match(res[1], /dupe_with_spaces_3.txt$/);

						process.argv = argv;
					}
				)
				.done(done, done);
			}
		);
	}
);