(function(window, document) {

	var textarea = document.getElementsByTagName('textarea')[0],
	    characters = document.getElementById('characters'),
	    bytes = document.getElementById('bytes'),
	    permalink = document.getElementById('permalink'),
	    regexNumberGroup = /(?=(?:\d{3})+$)(?!\b)/g,
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

	// Taken from http://mths.be/punycode
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function formatNumber(number, unit) {
		return String(number).replace(regexNumberGroup, ',') + ' ' + unit + (number == 1 ? '' : 's');
	}

	function update() {
		var value = textarea.value.replace(/\r\n/g, '\n'),
		    encodedValue = encode(value),
		    byteCount = utf8.encode(value).length, // https://mths.be/utf8js
		    characterCount = ucs2decode(value).length;
		characters.innerHTML = formatNumber(characterCount, 'character');
		bytes.innerHTML = formatNumber(byteCount, 'byte');
		permalink.hash = encodedValue;
		storage && (storage.byteCountText = value);
	};

	// http://mathiasbynens.be/notes/oninput
	textarea.onkeyup = update;
	textarea.oninput = function() {
		textarea.onkeyup = null;
		update();
	};

	if (storage) {
		storage.byteCountText && (textarea.value = storage.byteCountText);
		update();
	}

	window.onhashchange = function() {
		textarea.value = decodeURIComponent(location.hash.slice(1));
		update();
	};

	if (location.hash) {
		window.onhashchange();
	}

}(this, document));

// Google Analytics
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t),
	    s = d.getElementsByTagName(t)[0];
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
