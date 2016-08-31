'use strict';

var Promise = require('bluebird');

var _ = require('lodash');
var fs = Promise.promisifyAll(require('fs'));
var md5 = require('md5');

function FileFilter(paths) {
	if (!(this instanceof FileFilter)) {
		return new FileFilter(paths);
	}

	return this.processFiles(paths);
}

FileFilter.prototype = {
	filterFiles: function(item, index) {
		return fs.statAsync(item).bind(this).then(
			function(stat) {
				var file = stat.isFile();

				if (!file) {
					this._markAsUnprocessed(item, {code: 'EISDIR'});
				}

				return file;
			}
		)
		.catch(
			function(err) {
				this._markAsUnprocessed(item, err);

				return false;
			}
		);
	},

	getContents: function() {
		return this.getValidFiles().map(_.bind(_.ary(fs.readFileAsync, 2), fs, _, 'utf8'));
	},

	getValidFiles: function() {
		return Promise.resolve(this._paths).bind(this).filter(this.filterFiles);
	},

	indexFiles: function(results) {
		var HASH_UNIQUE = this._HASH_UNIQUE;
		var HASH_DUPES = this._HASH_DUPES;
		var HASH_UNIQUE_ALT = this._HASH_UNIQUE_ALT;
		var HASH_DUPES_ALT = this._HASH_DUPES_ALT;
		var ALL_FILES = this._ALL_FILES;
		var ALL_FILES_ALT = this._ALL_FILES_ALT;

		var paths = this._paths;

		return results.forEach(
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
		);
	},

	processFiles: Promise.method(
		function(paths) {
			if (!Array.isArray(paths)) {
				if (typeof paths === 'string') {
					paths = paths.split(/\r?\n/);
				}
				else {
					throw new Error(FileFilter._ERR_INVALID_ARGS);
				}
			}

			paths = paths.filter(
				function(item, index) {
					return _.isString(item) && !!_.trim(item);
				}
			);

			this._paths = paths;

			var ALL_FILES = [];
			var ALL_FILES_ALT = [];
			var HASH_DUPES = {};
			var HASH_DUPES_ALT = {};
			var HASH_UNIQUE = {};
			var HASH_UNIQUE_ALT = {};
			var UNPROCESSED = [{}, {}];

			this._ALL_FILES = ALL_FILES;
			this._ALL_FILES_ALT = ALL_FILES_ALT;
			this._HASH_DUPES = HASH_DUPES;
			this._HASH_DUPES_ALT = HASH_DUPES_ALT;
			this._HASH_UNIQUE = HASH_UNIQUE;
			this._HASH_UNIQUE_ALT = HASH_UNIQUE_ALT;
			this._UNPROCESSED = UNPROCESSED;

			return this.getContents().then(this.indexFiles).then(
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
		}
	),

	_markAsUnprocessed: function(filePath, err) {
		var type = err.code === 'EISDIR' ? 0 : 1;

		this._UNPROCESSED[type][filePath] = err;
	}
};

FileFilter._ERR_INVALID_ARGS = 'The paths argument should be either an array or a newline separated string.';

FileFilter.constructor = FileFilter;

module.exports = FileFilter;