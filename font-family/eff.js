(function(window, document) {

	var inputs = document.getElementsByTagName('input');
	var input = inputs[0];
	var checkbox = inputs[1];
	var em = document.getElementsByTagName('em')[0];
	var preElems = document.getElementsByTagName('pre');
	var pre1 = preElems[0];
	var pre2 = preElems[1];
	var pre3 = preElems[1];
	var markElems = document.getElementsByTagName('mark');
	var mark1 = markElems[0];
	var mark2 = markElems[1];
	var mark3 = markElems[2];
	var permalink = document.getElementById('permalink');
	var supplements = document.getElementById('supplementary-characters');
	var keyword = document.getElementById('keyword');
	var unquoted = document.getElementById('unquoted');
	var string = document.getElementById('string');
	var regexKeyword = /(?:^|[\t\n\f\r\x20])(?:serif|cursive|fantasy|inherit|initial|default|monospace|sans-serif)(?:$|[\t\n\f\r\x20])/gi;
	// http://www.w3.org/TR/css3-syntax/#whitespace
	var regexWhitespace = /[\t\n\f\r\x20]/g;
	// Match valid unescaped identifier characters (even though they may not be valid at the start of the identifier)
	var regexIdentifierCharacter = /^[a-zA-Z\d\xa0-\uffff_-]+$/;
	// If this regex matches an “identifier”, it’s an invalid one:
	var regexInvalidIdentifier = /^(-?\d|--)/;
	var regexConsecutiveSpaces = /(\\(?:[a-fA-F0-9]{1,6}\x20|\x20))?(\x20{2,})/g;
	var regexTrailingEscape = /\\[a-fA-F0-9]{0,6}\x20$/;
	var regexTrailingSpace = /\x20$/;
	var regexSingleQuote = /'/g;
	var regexLineBreak = /\r\n?/g;
	var regexSimpleEscapeCharacters = /[ !"#$%&'()*+,.\/;<=>?@\[\\\]^`{|}~]/;
	var regexSpaceAtStart = /^\x20/;
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
	var stringFromCharCode = String.fromCharCode;

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

	function each(array, callback) {
		var length = array.length;
		while (length--) {
			if (callback(array[length]) === false) {
				break;
			}
		}
	}

	function makeArray(value, length) {
		var array = [];
		while (length--) {
			array[length] = value;
		}
		return array;
	}

	function quote(string) {
		return '\'' + string.replace(regexSingleQuote, '\\\'') + '\'';
	}

	// https://mathiasbynens.be/notes/css-escapes
	function cssEscape(string, escapeForString) {
		// Based on `ucs2decode` from https://mths.be/punycode
		var firstChar = string.charAt(0);
		var output = '';
		var counter = 0;
		var length = string.length;
		var value;
		var character;
		var charCode;
		var surrogatePairCount = 0;
		var extraCharCode, // low surrogate
		var escapeNonASCII = checkbox.checked;

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
				if (!escapeForString && /[\t\n\v\f:]/.test(character)) {
					value = '\\' + charCode.toString(16) + ' ';
				} else if (!escapeForString && regexSimpleEscapeCharacters.test(character)) {
					value = '\\' + character;
				} else {
					value = character;
				}
			}
			output += value;
		}

		if (!escapeForString) {
			if (/^-[-\d]/.test(output)) {
				output = '\\-' + output.slice(1);
			}
			if (/\d/.test(firstChar)) {
				output = '\\3' + firstChar + ' ' + output.slice(1);
			}
		}

		return {
			'surrogatePairCount': surrogatePairCount,
			'output': output
		};
	}

	function escapeIdentifierSequence(string, escapeForString) {
		var isValid = true;
		var identifiers = string.split(regexWhitespace);
		var index = 0;
		var length = identifiers.length;
		var result = [];
		var string;
		var unescapedString;
		var escapeResult;
		var surrogatePairCount = 0;
		while (index < length) {
			string = identifiers[index++];
			if (string == '') {
				result.push(string);
				continue;
			}
			escapeResult = cssEscape(string, escapeForString);
			if (regexIdentifierCharacter.test(string)) {
				// the font family name part consists of allowed characters exclusively
				if (regexInvalidIdentifier.test(string)) {
					// the font family name part starts with two hyphens, a digit, or a
					// hyphen followed by a digit
					if (index == 1) { // if this is the first item
						result.push(escapeResult.output);
					} else {
						// if it’s not the first item, we can simply escape the space
						// between the two identifiers to merge them into a single
						// identifier rather than escaping the start characters of the
						// second identifier
						escapeForString || (result[index - 2] += '\\');
						result.push(cssEscape(string, true).output);
					}
				} else {
					// the font family name part doesn’t start with two hyphens, a digit,
					// or a hyphen followed by a digit
					result.push(escapeResult.output);
				}
			} else {
				// the font family name part contains invalid identifier characters
				result.push(escapeResult.output);
			}
			if (escapeResult.surrogatePairCount) {
				surrogatePairCount += escapeResult.surrogatePairCount;
			}
		}

		result = result.join(' ');

		if (escapeForString) {
			return result;
		}

		result = result.replace(regexConsecutiveSpaces, function($0, $1, $2) {
			var spaceCount;
			var escapesNeeded;
			var array;
			spaceCount = $2.length;
			escapesNeeded = Math.floor(spaceCount / 2);
			array = makeArray('\\ ', escapesNeeded);
			spaceCount % 2 && (array[escapesNeeded - 1] += '\\ ');
			return ($1 || '') + ' ' + array.join(' ');
		});

		// Escape trailing spaces unless they’re already part of an escape
		if (regexTrailingSpace.test(result) && !regexTrailingEscape.test(result)) {
			result = result.replace(regexTrailingSpace, '\\ ');
		}

		if (regexSpaceAtStart.test(result)) {
			result = '\\ ' + result.slice(1);
		}

		return {
			'output': result,
			'surrogatePairCount': surrogatePairCount
		};
	}

	function update() {
		// \r\n and \r become \n in the tokenizer as per HTML5
		var value = input.value.replace(regexLineBreak, '\n');
		var isKeyword = (regexKeyword.lastIndex = 0, regexKeyword.test(value));
		var escaped;
		var escapedOutput;
		var needsEscaping;
		var escapedString;

		if (isKeyword) {
			text(mark3, quote(value));
			keyword.className = 'show';
			unquoted.className = string.className = 'hide';
		} else {
			escaped = escapeIdentifierSequence(value);
			escapedOutput = escaped.output;
			needsEscaping = escapedOutput != value;
			escapedString = checkbox.checked && escapeIdentifierSequence(value, true);
			supplements.className = escaped.surrogatePairCount ? 'show' : 'hide';
			text(em, value ? 'can' : 'can’t');
			text(mark1, escapedOutput);
			text(mark2, quote(escapedString || value));
			pre1.className = value ? (needsEscaping ? 'warning' : '') : 'fail';
			keyword.className = 'hide';
			unquoted.className = string.className = 'show';
		}

		permalink.hash = (+checkbox.checked) + encode(value);
		storage && (storage.fontFamily = value);
	}

	// https://mathiasbynens.be/notes/oninput
	input.onkeydown = checkbox.onchange = update;
	input.oninput = function() {
		this.onkeydown = null;
		update();
	};

	if (storage && storage.fontFamily) {
		input.value = storage.fontFamily;
		update();
	}

	window.onhashchange = function() {
		location.hash.charAt(1) == '1' && (checkbox.checked = true);
		input.value = decodeURIComponent(location.hash.slice(2));
		update();
	};
	if (location.hash || /#$/.test(location.href)) {
		window.onhashchange();
	}

}(this, document));

// Optimized Google Analytics snippet: https://mths.be/aab */
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t);
	var s = d.getElementsByTagName(t)[0];
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
