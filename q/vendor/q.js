/*! https://mths.be/q v1.0.0 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code, and use
	// it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	// https://tools.ietf.org/html/rfc2047#section-4.2
	var stringFromCharCode = String.fromCharCode;
	var decode = function(input) {
		return input
			// Decode `_` into a space. This is character-encoding-independent;
			// see https://tools.ietf.org/html/rfc2047#section-4.2, item 2.
			.replace(/_/g, ' ')
			// Decode escape sequences of the form `=XX` where `XX` is any
			// combination of two hexidecimal digits. For optimal compatibility,
			// lowercase hexadecimal digits are supported as well. See
			// https://tools.ietf.org/html/rfc2045#section-6.7, note 1.
			.replace(/=([a-fA-F0-9]{2})/g, function($0, $1) {
				var codePoint = parseInt($1, 16);
				return stringFromCharCode(codePoint);
			});
	};

	var regexUnsafeSymbols = /[\0-\x1F"-\),\.:-@\[-\^`\{-\uFFFF]/g;
	var encode = function(string) {
		// Note: this assumes the input is already encoded into octets (e.g. using
		// UTF-8), and that the resulting octets are within the extended ASCII
		// range.
		return string
			// Encode symbols that are definitely unsafe (i.e. unsafe in any context).
			.replace(regexUnsafeSymbols, function(symbol) {
				if (symbol > '\xFF') {
					throw RangeError(
						'`q.encode()` expects extended ASCII input only. Don\u2019t ' +
						'forget to encode the input first using a character encoding ' +
						'like UTF-8.'
					);
				}
				var codePoint = symbol.charCodeAt(0);
				var hexadecimal = codePoint.toString(16).toUpperCase();
				return '=' + ('0' + hexadecimal).slice(-2);
			})
			// Encode spaces as `_`, as it’s shorter than `=20`.
			.replace(/\x20/g, '_');
	};

	var q = {
		'encode': encode,
		'decode': decode,
		'version': '1.0.0'
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return q;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = q;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in q) {
				q.hasOwnProperty(key) && (freeExports[key] = q[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.q = q;
	}

}(this));
