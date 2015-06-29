// https://gist.github.com/mathiasbynens/6334847
// Note: run `npm install` first!

var regenerate = require('regenerate');
var template = require('lodash.template');

// Which Unicode version should be used?
var version = '8.0.0';

// Set up a shorthand function to import Unicode data.
var get = function(what) {
	return require('unicode-' + version + '/' + what + '/code-points');
};

// Get the Unicode properties needed to construct the ES6 regex.
var ID_Start = get('properties/ID_Start');
var ID_Continue = get('properties/ID_Continue');

var compileRegex = template('/^(?:<%= identifierStart %>)(?:<%= identifierPart %>)*$/');

var generateES6Regex = function() {
	// https://mths.be/es6#sec-identifier-names-static-semantics-early-errors
	// http://unicode.org/reports/tr31/#Default_Identifier_Syntax
	// https://bugs.ecmascript.org/show_bug.cgi?id=2717#c0
	var identifierStart = regenerate(ID_Start)
		// Note: this already includes `Other_ID_Start`. http://git.io/wRCAfQ
		.add(
			'$',
			'_'
		);
	var identifierPart = regenerate(ID_Continue)
		// Note: this already includes `Other_ID_Continue`. http://git.io/wRCAfQ
		.add(
			'$',
			'_',
			'\u200C',
			'\u200D'
		);

	var regex = compileRegex({
		'identifierStart': identifierStart.toString(),
		'identifierPart': identifierPart.toString()
	});
	return regex;
};

console.log(generateES6Regex());
