#!/usr/bin/env node
'use strict';

var cli = require('../lib/cli');

cli.run()
.catch(
	function(err) {
		console.log('There was an error reading one or all of the files');
		console.log(err);
		return '';
	}
)
.then(console.log.bind(console));