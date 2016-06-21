'use strict';
var isPotentialCustomElementName = require('is-potential-custom-element-name');

// https://html.spec.whatwg.org/multipage/scripting.html#valid-custom-element-name
var reservedNames = [
	'annotation-xml',
	'color-profile',
	'font-face',
	'font-face-src',
	'font-face-uri',
	'font-face-format',
	'font-face-name',
	'missing-glyph'
];

function hasError(name) {
	if (!name) {
		return 'Missing element name.';
	}

	if (/[A-Z]/.test(name)) {
		return 'Custom element names must not contain uppercase ASCII characters.';
	}

	if (name.indexOf('-') === -1) {
		return 'Custom element names must contain a hyphen. Example: unicorn-cake';
	}

	if (/^\d/i.test(name)) {
		return 'Custom element names must not start with a digit.';
	}

	if (/^-/i.test(name)) {
		return 'Custom element names must not start with a hyphen.';
	}

	// https://html.spec.whatwg.org/multipage/scripting.html#prod-potentialcustomelementname
	if (!isPotentialCustomElementName(name)) {
		return 'Invalid element name.';
	}

	if (reservedNames.indexOf(name) !== -1) {
		return 'The supplied element name is reserved and can\'t be used.\nSee: https://html.spec.whatwg.org/multipage/scripting.html#valid-custom-element-name';
	}
}

function hasWarning(name) {
	if (/^polymer-/i.test(name)) {
		return 'Custom element names should not start with `polymer-`.\nSee: http://webcomponents.github.io/articles/how-should-i-name-my-element';
	}

	if (/^x-/i.test(name)) {
		return 'Custom element names should not start with `x-`.\nSee: http://webcomponents.github.io/articles/how-should-i-name-my-element/';
	}

	if (/^ng-/i.test(name)) {
		return 'Custom element names should not start with `ng-`.\nSee: http://docs.angularjs.org/guide/directive#creating-directives';
	}

	if (/^xml/i.test(name)) {
		return 'Custom element names should not start with `xml`.';
	}

	if (/^[^a-z]/i.test(name)) {
		return 'This element name is only valid in XHTML, not in HTML. First character should be in the range a-z.';
	}

	if (/[^a-z0-9]$/i.test(name)) {
		return 'Custom element names should not end with a non-alpha character.';
	}

	if (/[\.]/.test(name)) {
		return 'Custom element names should not contain a dot character as it would need to be escaped in a CSS selector.';
	}

	if (/[^\x20-\x7E]/.test(name)) {
		return 'Custom element names should not contain non-ASCII characters.';
	}

	if (/--/.test(name)) {
		return 'Custom element names should not contain consecutive hyphens.';
	}

	if (/[^a-z0-9]{2}/i.test(name)) {
		return 'Custom element names should not contain consecutive non-alpha characters.';
	}
}

module.exports = function (name) {
	var errMsg = hasError(name);

	return {
		isValid: !errMsg,
		message: errMsg || hasWarning(name)
	};
};
