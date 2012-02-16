(function(window, document) {

	var textareas = document.getElementsByTagName('textarea'),
	    ascii = textareas[0],
	    binary = textareas[1],
	    permalink = document.getElementById('permalink'),
	    regexBinaryGroup = /\s*[01]{8}\s*/g,
	    regexAnyCharacter = /[\s\S]/g,
	    regexBinary = /^(\s*[01]{8}\s*)*$/,
	    regexExtendedASCII = /^[\x00-\xff]*$/,
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
	    }()),
	    stringFromCharCode = String.fromCharCode;

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function zeroPad(number) {
		return '00000000'.slice(String(number).length) + number;
	}

	function toASCII(string) {
		return string.replace(regexBinaryGroup, function(group) {
			return stringFromCharCode(parseInt(group, 2));
		});
	}

	function toBinary(string) {
		return string.replace(regexAnyCharacter, function(character) {
			return zeroPad(character.charCodeAt().toString(2)) + ' ';
		});
	}

	function convert(inputElement, regex, fn, outputElement) {
		var value = inputElement.value,
		    result = '';
		if (regex.test(value)) {
			outputElement.value = result = fn(value);
			inputElement.className = outputElement.className = '';
		} else {
			outputElement.value = 'ERROR: invalid input';
			inputElement.className = outputElement.className = 'invalid';
		}
		return inputElement == ascii ? value : result;
	}

	function update() {
		var value = this == binary
			? // convert from binary to extended ASCII
				convert(binary, regexBinary, toASCII, ascii)
			: // convert from extended ASCII to binary
				convert(ascii, regexExtendedASCII, toBinary, binary);
		permalink.hash = encode(value);
		storage && (storage.ascii = value);
	};

	// http://mathiasbynens.be/notes/oninput
	ascii.onkeyup = binary.onkeyup = update;
	ascii.oninput = binary.oninput = function() {
		ascii.onkeyup = binary.onkeyup = null;
		update.call(this);
	};

	if (storage) {
		storage.ascii && (ascii.value = storage.ascii);
		update();
	}

	window.onhashchange = function() {
		ascii.value = decodeURIComponent(location.hash.slice(1));
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