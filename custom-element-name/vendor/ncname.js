'use strict';
var xmlChars = require('xml-char-classes');

function getRange(re) {
	return re.toString().slice(2).slice(0, -2);
}

// http://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-NCName
module.exports = new RegExp('^[' + getRange(xmlChars.letter) + '_][' + getRange(xmlChars.letter) + getRange(xmlChars.digit) + '\\.\\-_' + getRange(xmlChars.combiningChar) + getRange(xmlChars.extender) + ']*$');
