'use strict';

var Promise = require('bluebird');

var _ = require('lodash');
var fs = Promise.promisifyAll(require('fs'));
var md5 = require('md5');

module.exports = function(paths) {
	if (typeof paths !== 'string') {
		throw new Error('paths passed to file-filter should be a string of files')
	}

	paths = paths.split(/\r?\n/).filter(value => !!value);

	const HASH_UNIQUE = {};
	const HASH_DUPES = {};
	const ALL_FILES = [];
	const HASH_UNIQUE_ALT = {};
	const HASH_DUPES_ALT = {};
	const ALL_FILES_ALT = [];
	const UNPROCESSED = [{}, {}];

	return Promise.filter(
		paths,
		function(item, index) {
			return fs.statAsync(item)
					.then(
						function(stat) {
							var file = stat.isFile();

							if (!file) {
								UNPROCESSED[0][item] = {code: 'EISDIR'};
							}

							return file;
						}
					)
					.catch(
						function(err) {
							var type = err.code === 'EISDIR' ? 0 : 1;

							UNPROCESSED[type][item] = err;

							return false;
						}
					);
		}
	)
	.map(n => fs.readFileAsync(n, 'utf8'))
	.each(
		function(item, index) {
			var contents = item;

			var fileHash = md5(item);

			var hasHash = HASH_UNIQUE[fileHash];

			var fileName = paths[index];

			if (!hasHash) {
				HASH_UNIQUE[fileHash] = fileName;
			}
			else {
				HASH_DUPES[fileName] = fileHash;
			}

			ALL_FILES.push(
				{
					fileName,
					fileHash,
					content: item
				}
			);

			item = item.replace(/\s/g, '');

			var altFileHash = md5(item);

			hasHash = HASH_UNIQUE_ALT[altFileHash];

			if (!hasHash) {
				HASH_UNIQUE_ALT[altFileHash] = fileName;
			}
			else {
				HASH_DUPES_ALT[fileName] = altFileHash;
			}

			ALL_FILES_ALT.push(
				{
					fileName,
					altFileHash
				}
			);
		}
	)
	.then(
		function(files) {
			return [
				{
					allFiles: ALL_FILES,
					uniques: _.values(HASH_UNIQUE),
					duplicates: _.keys(HASH_DUPES),
				},
				{
					allFiles: ALL_FILES_ALT,
					uniques: _.values(HASH_UNIQUE_ALT),
					duplicates: _.keys(HASH_DUPES_ALT)
				},
				{
					dirs: UNPROCESSED[0],
					misc: UNPROCESSED[1]
				}
			];
		}
	);
};