'use strict';
var fileFilter = require('../');

var sinon = require('sinon');
var chai = require('chai');

chai.use(require('chai-string'));

var assert = chai.assert;

it(
	'should ',
	function() {
		assert.strictEqual(fileFilter('belgian'), 'BEST BEER EVAR!');
	}
);