(function(window, document) {

	var input = document.getElementsByTagName('div')[0],
	    checkbox = document.getElementsByTagName('input')[0],
	    quotes = document.getElementsByTagName('b'),
	    marks = document.getElementsByTagName('mark'),
	    css = marks[0],
	    js = marks[1],
	    qsa = marks[2],
	    permalink = document.getElementById('permalink'),
	    example = document.getElementById('example'),
	    whitespace = document.getElementById('whitespace'),
	    supplements = document.getElementById('supplementary-characters'),
	    jsCache = {
	    	// http://es5.github.com/#x7.8.4
	    	// Table 4 — String Single Character Escape Sequences
	    	'\b': '\\b',
	    	'\t': '\\t',
	    	'\n': '\\n',
	    	'\v': '\\x0b', // In IE < 9, '\v' == 'v'
	    	'\f': '\\f',
	    	'\r': '\\r',
	    	// escape double quotes, \u2028, and \u2029 too, as they break input
	    	'\"': '\\\"',
	    	'\u2028': '\\u2028',
	    	'\u2029': '\\u2029',
	    	// we’re wrapping the string in single quotes, so escape those too
	    	'\'': '\\\'',
	    	'\\': '\\\\'
	    },
	    // http://mathiasbynens.be/notes/localstorage-pattern
	    storage = (function() {
	    	var uid = new Date,
	    	    storage,
	    	    result;
	    	try {
	    		(storage = window.localStorage).setItem(uid, uid);
	    		result = storage.getItem(uid) == uid;
	    		storage.removeItem(uid);
	    		return result && storage;
	    	} catch(e) {}
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

	// http://mathiasbynens.be/notes/css-escapes
	function cssEscape(string, escapeNonASCII) {
		// Based on `ucs2decode` from http://mths.be/punycode
		var firstChar = string.charAt(0),
		    output = '',
		    counter = 0,
		    length = string.length,
		    value,
		    character,
		    charCode,
		    surrogatePairCount = 0,
		    extraCharCode; // low surrogate

		while (counter < length) {
			character = string.charAt(counter++);
			charCode = character.charCodeAt();
			// if it’s a non-ASCII character and those need to be escaped
			if (escapeNonASCII && (charCode < 32 || charCode > 126)) {
				if ((charCode & 0xF800) == 0xD800) {
					surrogatePairCount++;
					extraCharCode = string.charCodeAt(counter++);
					if ((charCode & 0xFC00) != 0xD800 || (extraCharCode & 0xFC00) != 0xDC00) {
						throw Error('UCS-2(decode): illegal sequence');
					}
					charCode = ((charCode & 0x3FF) << 10) + (extraCharCode & 0x3FF) + 0x10000;
				}
				value = '\\' + charCode.toString(16) + ' ';
			} else {
				// \r is already tokenized away at this point
				// `:` can be escaped as `\:`, but that fails in IE < 8
				if (/[\t\n\v\f:]/.test(character)) {
					value = '\\' + charCode.toString(16) + ' ';
				} else if (/[ !"#$%&'()*+,./;<=>?@\[\\\]^`{|}~]/.test(character)) {
					value = '\\' + character;
				} else {
					value = character;
				}
			}
			output += value;
		}

		if (/^_/.test(output)) { // Prevent IE6 from ignoring the rule altogether
			output = '\\_' + output.slice(1);
		}
		if (/^-[-\d]/.test(output)) {
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

	// Taken from mothereff.in/js-escapes
	function jsEscape(str) {
		return str.replace(/[\s\S]/g, function(character) {
			var charCode = character.charCodeAt(),
			    hexadecimal = charCode.toString(16),
			    longhand = hexadecimal.length > 2,
			    escape;
			if (/[\x20-\x26\x28-\x5b\x5d-\x7e]/.test(character)) {
				// it’s a printable ASCII character that is not `'` or `\`; don’t escape it
				return character;
			}
			if (jsCache[character]) {
				return jsCache[character];
			}
			escape = jsCache[character] = '\\' + (longhand ? 'u' : 'x') + ('0000' + hexadecimal).slice(longhand ? -4 : -2);
			return escape;
		});
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
		var value = text(input).replace(/\r\n?/g, '\n'),
		    escapeResult = cssEscape(value, checkbox.checked),
		    cssValue = '#' + escapeResult.output,
		    surrogatePairCount = escapeResult.surrogatePairCount,
		    // IE 8 can handle leading underscores; no point in escaping them here:
		    qsaValue = doubleSlash(cssValue.replace(/^#\\_/, '#_')),
		    jsValue = (checkbox.checked ? jsEscape(value) : doubleSlash(value)).replace(/<\/script/g, '<\\/script'), // http://mths.be/etago
		    link = '#' + (+checkbox.checked) + encode(value);
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
		example.href = 'data:text/html;charset=utf-8,' + encodeURIComponent('<!DOCTYPE html><title>Mothereffing CSS escapes example</title><style>pre{background:#eee;padding:.5em}.test{display:none}' + cssValue + '{display:block}.pass{background:lime}.fail{background:red}</style><h1><a href="http://mothereff.in/css-escapes' + link + '">Mothereffing CSS escapes</a> example</h1><pre><code>' + value.replace(/</g, '&lt;') + '</code></pre><p id="' + value.replace(/"/g, '&quot;') + '" class=test>If you can read this, the escaped CSS selector worked. </p>' + (surrogatePairCount ? '<p>Standard CSS character escape sequences for supplementary Unicode characters aren’t currently supported in WebKit. <strong>This test case will fail in those browsers.</strong> It’s better to leave these characters unescaped.</p>' : '') + '<script>var el=document.getElementsByTagName(\'p\')[0];try{document.getElementById(\'' + jsValue + '\').innerHTML += \' <code>document.getElementById</code> worked.\';document.querySelector(\'' + qsaValue + '\').innerHTML+=\' <code>document.querySelector</code> worked.\';el.className=\'pass\'}catch(e){el.innerHTML=\'FAIL\';el.className=\'fail\'}<\/script>');
	}

	// http://mathiasbynens.be/notes/oninput
	input.onkeyup = checkbox.onchange = update;
	input.oninput = function() {
		this.onkeyup = null;
		update();
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

// Optimized Google Analytics snippet: http://mths.be/aab */
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t),
	    s = d.getElementsByTagName(t)[0];
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));