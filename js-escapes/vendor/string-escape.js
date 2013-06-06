/*! http://mths.be/stringescape v0.1.5 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var hasKey = function(object, key) {
		return hasOwnProperty.call(object, key);
	};

	var extend = function(destination, source) {
		if (!source) {
			return destination;
		}
		var key;
		for (key in source) {
			if (hasOwnProperty.call(source, key)) {
				destination[key] = source[key];
			}
		}
		return destination;
	};

	/*--------------------------------------------------------------------------*/

	var cache = {
		// http://es5.github.com/x7.html#x7.8.4
		// Table 4 — String Single Character Escape Sequences
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\v': '\\x0B', // In IE < 9, '\v' == 'v'
		'\f': '\\f',
		'\r': '\\r',
		'\\': '\\\\',
		'"': '\\"',
		'\'': '\\\''
	};

	var regexAnyCodeUnit = /[\s\S]/g;
	var regexOctalDigit = /[0-7]/g;
	var regexWhitelist = /[\x20\x21\x23-\x26\x28-\x5B\x5D-\x7E]/;

	var stringEscape = function(string, options) {
		// Handle options
		var defaults = {
			'escapeEverything': false,
			'quotes': 'single',
			'wrap': false
		};
		options = extend(defaults, options);
		if (options.quotes != 'single' && options.quotes != 'double') {
			options.quotes = 'single';
		}
		var quote = options.quotes == 'double' ? '"' : '\'';

		// Loop over each code unit in the string and escape it
		var index = -1;
		var length = string.length;
		var result = '';
		while (++index < length) {
			var character = string.charAt(index);
			if (!options.escapeEverything) {
				if (regexWhitelist.test(character)) {
					// It’s a printable ASCII character that is not `"`, `'` or `\`,
					// so don’t escape it.
					result += character;
					continue;
				}
				if (character == '"') {
					result += quote == character ? '\\"' : character;
					continue;
				}
				if (character == '\'') {
					result += quote == character ? '\\\'' : character;
					continue;
				}
			}
			if (character == '\0' && !regexOctalDigit.test(string.charAt(index + 1))) {
				result += '\\0';
				continue;
			}
			if (hasKey(cache, character)) {
				result += cache[character];
				continue;
			}
			var charCode = character.charCodeAt(0);
			var hexadecimal = charCode.toString(16).toUpperCase();
			var longhand = hexadecimal.length > 2;
			result += cache[character] = '\\' + (longhand ? 'u' : 'x') +
				('0000' + hexadecimal).slice(longhand ? -4 : -2);
			continue;
		}
		if (options.wrap) {
			result = quote + result + quote;
		}
		return result;
	};

	stringEscape.version = '0.1.5';

	/*--------------------------------------------------------------------------*/

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return stringEscape;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = stringEscape;
		} else { // in Narwhal or RingoJS v0.7.0-
			extend(freeExports, stringEscape);
		}
	} else { // in Rhino or a web browser
		root.stringEscape = stringEscape;
	}

}(this));
