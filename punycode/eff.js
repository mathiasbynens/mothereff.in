(function(window, document, toASCII, toUnicode) {

	var decoded = document.getElementById('decoded'),
	    encoded = document.getElementById('encoded'),
	    permalink = document.getElementById('permalink'),
	    invalid = document.getElementById('invalid'),
	    // http://mathiasbynens.be/notes/localstorage-pattern
	    storage = (function() {
	    	try {
	    		var storage = window.localStorage,
	    		    uid = new Date;
	    		storage.setItem(uid, uid);
	    		return storage.getItem(uid) == uid && storage;
	    	} catch(e) {}
	    }());

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function update() {
		var element,
		    value,
		    result;
		if (this == decoded) {
			element = encoded;
			value = text(decoded);
			result = toASCII(value);
			text(element, result);
			permalink.href = '#' + encodeURIComponent(value);
		} else {
			element = decoded;
			value = text(encoded);
			if (/^[a-zA-Z0-9-\.]*$/.test(value)) {
				result = toUnicode(value);
				permalink.href = '#' + encodeURIComponent(result);
				text(element, result);
				this.className = null;
				invalid.style.display = 'none';
			} else {
				this.className = 'fail';
				invalid.style.display = 'block';
			}
		}
	};

	decoded.onkeyup = encoded.onkeyup = update;
	decoded.oninput = encoded.oninput = function() {
		decoded.onkeyup = encoded.onkeyup = null;
		update.call(this);
	};

	if (storage) {
		storage.decoded && text(decoded, storage.decoded);
		storage.encoded && text(encoded, storage.encoded);
		update();
	}

	decoded.focus();
	decoded.onkeyup.call(decoded);

	window.onhashchange = function() {
		text(decoded, decodeURIComponent(location.hash.slice(1)));
		update.call(decoded);
	};

	if (location.hash) {
		window.onhashchange();
	}

}(this, document, punycode.toASCII, punycode.toUnicode));

// Google Analytics
var _gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t),
	    s = d.getElementsByTagName(t)[0];
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));