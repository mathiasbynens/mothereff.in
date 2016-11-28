(function(window, document) {

	var input = document.getElementsByTagName('div')[0];
	var checkbox = document.getElementsByTagName('input')[0];
	var quotes = document.getElementsByTagName('b');
	var marks = document.getElementsByTagName('mark');
	var css = marks[0];
	var js = marks[1];
	var qsa = marks[2];
	var empty = document.getElementById('empty');
	var emptyComment = document.getElementById('empty-comment');
	var permalink = document.getElementById('permalink');
	var example = document.getElementById('example');
	var whitespace = document.getElementById('whitespace');
	var supplements = document.getElementById('supplementary-characters');
	var jsCache = {
		// http://es5.github.com/#x7.8.4
		// Table 4 — String Single Character Escape Sequences
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\v': '\\x0B', // In IE < 9, '\v' == 'v'
		'\f': '\\f',
		'\r': '\\r',
		// escape double quotes, \u2028, and \u2029 too, as they break input
		'\"': '\\\"',
		'\u2028': '\\u2028',
		'\u2029': '\\u2029',
		// we’re wrapping the string in single quotes, so escape those too
		'\'': '\\\'',
		'\\': '\\\\'
	};
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

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function forEach(array, fn) {
		var length = array.length;
		while (length--) {
			fn(array[length]);
		}
	}

	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	// https://mathiasbynens.be/notes/css-escapes
	function cssEscape(string, escapeNonASCII) {
		// Based on `ucs2decode` from https://mths.be/punycode
		var firstChar = string.charAt(0);
		var output = '';
		var counter = 0;
		var length = string.length;
		var value;
		var character;
		var charCode;
		var surrogatePairCount = 0;
		var extraCharCode; // low surrogate

		while (counter < length) {
			character = string.charAt(counter++);
			charCode = character.charCodeAt();
			// if it’s a non-ASCII character and those need to be escaped
			if (escapeNonASCII && (charCode < 0x20 || charCode > 0x7E)) {
				if ((charCode & 0xF800) == 0xD800) {
					surrogatePairCount++;
					extraCharCode = string.charCodeAt(counter++);
					if ((charCode & 0xFC00) != 0xD800 || (extraCharCode & 0xFC00) != 0xDC00) {
						throw Error('UCS-2(decode): illegal sequence');
					}
					charCode = ((charCode & 0x3FF) << 10) + (extraCharCode & 0x3FF) + 0x10000;
				}
				value = '\\' + charCode.toString(16).toUpperCase() + ' ';
			} else {
				// `\r` is already tokenized away at this point by the HTML parser.
				// `:` can be escaped as `\:`, but that fails in IE < 8.
				if (/[\t\n\v\f:]/.test(character)) {
					value = '\\' + charCode.toString(16).toUpperCase() + ' ';
				} else if (/[ !"#$%&'()*+,./;<=>?@\[\\\]^`{|}~]/.test(character)) {
					value = '\\' + character;
				} else {
					value = character;
				}
			}
			output += value;
		}

		if (/^_/.test(output)) { // Prevent IE6 from ignoring the rule altogether.
			output = '\\_' + output.slice(1);
		}
		if (/^-[\d]/.test(output)) {
			output = '\\-' + output.slice(1);
		}
		if (/\d/.test(firstChar)) {
			output = '\\3' + firstChar + ' ' + output.slice(1);
		}

		return {
			'surrogatePairCount': surrogatePairCount,
			'output': output
		};
	}

	function doubleSlash(str) {
		return str.replace(/['\n\u2028\u2029\\]/g, function(chr) {
			return jsCache[chr];
		});
	}

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function update(event) {
		// \r\n and \r become \n in the tokenizer as per HTML5
		var value = text(input).replace(/\r\n?/g, '\n');
		var cssValue;
		var surrogatePairCount;
		var qsaValue;
		var jsValue;
		if (!value) {
			empty.className = emptyComment.className = 'show';
			qsaValue = cssValue = '[id=""]';
			jsValue = '';
			surrogatePairCount = 0;
		} else {
			empty.className = emptyComment.className = ''; // hide
			var escapeResult = cssEscape(value, checkbox.checked);
			cssValue = '#' + escapeResult.output;
			surrogatePairCount = escapeResult.surrogatePairCount;
			// IE 8 can handle leading underscores; no point in escaping them here:
			qsaValue = doubleSlash(cssValue.replace(/^#\\_/, '#_'));
			// https://mths.be/etago
			jsValue = (checkbox.checked ? jsesc(value) : doubleSlash(value)).replace(/<\/script/g, '<\\/script');
		}
		var link = '#' + (+checkbox.checked) + encode(value);
		whitespace.className = /\s/.test(value) ? 'show' : '';
		supplements.className = surrogatePairCount ? 'show' : '';
		forEach(quotes, function(el) {
			text(el, ~value.indexOf('"') ? '\'' : '"');
		});
		text(css, cssValue);
		text(qsa, qsaValue);
		text(js, jsValue);
		permalink.href = link;
		storage && (storage.cssEscapes = value);
		example.href = 'data:text/html;charset=utf-8,' + encodeURIComponent('<!DOCTYPE html><title>Mothereffing CSS escapes example</title><style>pre{background:#eee;padding:.5em}.test{display:none}' + cssValue + '{display:block}.pass{background:lime}.fail{background:red}</style><h1><a href="https://mothereff.in/css-escapes' + link + '">Mothereffing CSS escapes</a> example</h1><pre><code>' + value.replace(/</g, '&lt;') + '</code></pre><p id="' + value.replace(/"/g, '&quot;') + '" class=test>If you can read this, the escaped CSS selector worked. </p>' + (surrogatePairCount ? '<p>Standard CSS character escape sequences for supplementary Unicode characters aren’t supported in older versions of WebKit. <strong>This test case will fail in those browsers.</strong> It’s better to leave these characters unescaped.</p>' : '') + '<script>var el=document.getElementsByTagName(\'p\')[0];try{document.getElementById(\'' + jsValue + '\').innerHTML += \' <code>document.getElementById</code> worked.\';document.querySelector(\'' + qsaValue + '\').innerHTML+=\' <code>document.querySelector</code> worked.\';el.className=\'pass\'}catch(e){el.innerHTML=\'FAIL\';el.className=\'fail\'}<\/script>');
	}

	// https://mathiasbynens.be/notes/oninput
	input.onkeyup = checkbox.onchange = update;
	input.oninput = function() {
		this.onkeyup = null;
		update();
	};

	input.onpaste = function(event) {
		event.preventDefault();
		var text = event.clipboardData.getData('text/plain').trim();
		document.execCommand('insertText', false, text);
	};

	if (storage && storage.cssEscapes) {
		text(input, storage.cssEscapes);
		update();
	}

	window.onhashchange = function() {
		location.hash.charAt(1) == '1' && (checkbox.checked = true);
		text(input, decodeURIComponent(location.hash.slice(2)));
	};
	if (location.hash) {
		window.onhashchange();
		update();
	}

	input.focus();

}(this, document));

// Optimized Google Analytics snippet: https://mths.be/aab */
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t);
	var s = d.getElementsByTagName(t)[0];
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
