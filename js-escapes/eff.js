(function(window, document, evil) {

	var pre = document.getElementsByTagName('pre')[0];
	var code = document.getElementsByTagName('code')[0];
	var textarea = document.getElementsByTagName('textarea')[0];
	var inputs = document.getElementsByTagName('input');
	var checkboxOnlyASCII = inputs[0];
	var checkboxOutputJSON = inputs[1];
	var checkboxES6 = inputs[2];
	var checkboxStringBody = inputs[3];
	var permalink = document.getElementById('permalink');
	// https://mathiasbynens.be/notes/localstorage-pattern
	var storage = (function() {
		var uid = new Date;
		var storage;
		var result;
		try {
			(storage = window.localStorage).setItem(uid, uid);
			result = storage.getItem(uid) == uid;
			storage.removeItem(uid);
			return result && storage;
		} catch (exception) {}
	}());
	var cache = {
		'\n': '\\n',
		'\"': '\\\"',
		'\u2028': '\\u2028',
		'\u2029': '\\u2029',
		'\'': '\\\''
	};

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	// Unescape ES6 Unicode code point escapes
	// https://mathiasbynens.be/notes/javascript-escapes#unicode-code-point
	// This is for browsers who support ES3/ES5 but haven’t implemented the new
	// ES6 escape sequences yet.
	function unescapeES6(string) {
		return string.replace(/\\u\{([a-fA-F0-9]{1,6})\}/g, function($0, $1) {
			var codePoint = parseInt($1, 16);
			return String.fromCodePoint(codePoint);
		});
	}

	function update() {
		var value = textarea.value.replace(/\\\n/g, ''); // LineContinuation
		var result;
		try {
			if (checkboxStringBody.checked) {
				result = evil(
					'"'
					+ unescapeES6(value).replace(/[\n\u2028\u2029"']/g, function(chr) {
						return cache[chr];
					})
					.replace(/\\v/g, '\x0B') // In IE < 9, '\v' == 'v'; this normalizes the input
					+ '"'
				);
			} else {
				result = value;
			}
			result = jsesc(result, {
				'quotes': checkboxOutputJSON.checked ? 'double' : 'single',
				'wrap': true,
				'escapeEverything': !checkboxOnlyASCII.checked,
				'json' : checkboxOutputJSON.checked,
				'es6': checkboxES6.checked && !checkboxOutputJSON.checked
			});
			text(
				code,
				result
			);
			pre.className = '';
		} catch (e) {
			pre.className = 'fail';
		}
		if (storage) {
			storage.jsEscapeText = value;
			if (checkboxOnlyASCII.checked) {
				storage.jsEscapeOnlyASCII = true;
			} else {
				storage.removeItem('jsEscapeOnlyASCII');
			}
			if (checkboxOutputJSON.checked) {
				storage.jsEscapeOutputJSON = true;
			} else {
				storage.removeItem('jsEscapeOutputJSON');
			}
			if (checkboxStringBody.checked) {
				storage.jsEscapeStringBody = true;
			} else {
				storage.removeItem('jsEscapeStringBody');
			}
		}
		checkboxES6.disabled = checkboxOutputJSON.checked;
		permalink.hash = +checkboxOnlyASCII.checked + encode(textarea.value);
	}

	// https://mathiasbynens.be/notes/oninput
	textarea.onkeyup = checkboxOnlyASCII.onchange = checkboxOutputJSON.onchange = checkboxES6.onchange = checkboxStringBody.onchange = update;
	textarea.oninput = function() {
		textarea.onkeyup = null;
		update();
	};

	pre.ondblclick = function() {
		var selection = window.getSelection();
		var range = document.createRange();
		range.selectNodeContents(pre);
		selection.removeAllRanges();
		selection.addRange(range);
	};

	if (storage) {
		storage.jsEscapeText && (textarea.value = storage.jsEscapeText);
		storage.jsEscapeOnlyASCII && (checkboxOnlyASCII.checked = true);
		storage.jsEscapeOutputJSON && (checkboxOutputJSON.checked = true);
		storage.jsEscapeStringBody && (checkboxStringBody.checked = true);
		update();
	}

	window.onhashchange = function() {
		var hash = location.hash;
		hash.charAt(1) == '0' && (checkboxOnlyASCII.checked = false);
		textarea.value = decodeURIComponent(hash.slice(2));
		update();
	};

	if (location.hash) {
		window.onhashchange();
	}

}(this, document, eval));

// Google Analytics
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t);
	var s = d.getElementsByTagName(t)[0];
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
