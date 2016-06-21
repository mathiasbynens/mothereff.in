(function() {

var regex = /^[a-z](?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*-(?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;

var isPotentialCustomElementName = function(string) {
	return regex.test(string);
};

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
		return 'The supplied element name is reserved and can’t be used.\nSee <a href=https://html.spec.whatwg.org/multipage/scripting.html#valid-custom-element-name>the specification</a>.';
	}
}

function hasWarning(name) {
	if (/^polymer-/i.test(name)) {
		return 'custom element names should not start with <code>polymer-</code>.\nSee <a href=http://webcomponents.github.io/articles/how-should-i-name-my-element>“How should I name my element?”</a>.';
	}

	if (/^x-/i.test(name)) {
		return 'custom element names should not start with <code>x-</code>.\nSee <a href=http://webcomponents.github.io/articles/how-should-i-name-my-element>“How should I name my element?”</a>.';
	}

	if (/^ng-/i.test(name)) {
		return 'custom element names should not start with <code>ng-</code>.\nSee <a href=http://docs.angularjs.org/guide/directive#creating-directives>“How to create an AngularJS directive”</a>.';
	}

	if (/^xml/i.test(name)) {
		return 'custom element names should not start with <code>xml</code>.';
	}

	if (/^[^a-z]/i.test(name)) {
		return 'the first character should be in the range <code>[a-zA-Z]</code>. Otherwise, this element name is only valid in XHTML, not in HTML.';
	}

	if (/[^a-z0-9]$/i.test(name)) {
		return 'custom element names should not end with a non-alpha character.';
	}

	if (/[\.]/.test(name)) {
		return 'custom element names should not contain a dot character (<code>.</code>) as it would need to be escaped in a CSS selector.';
	}

	if (/[^\x20-\x7E]/.test(name)) {
		return 'custom element names should not contain non-ASCII characters.';
	}

	if (/--/.test(name)) {
		return 'custom element names should not contain consecutive hyphens.';
	}

	if (/[^a-z0-9]{2}/i.test(name)) {
		return 'custom element names should not contain consecutive non-alpha characters.';
	}
}

window.validate = function (name) {
	var errMsg = hasError(name);

	return {
		isValid: !errMsg,
		message: errMsg || hasWarning(name)
	};
};

}());
