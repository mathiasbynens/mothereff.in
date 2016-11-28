(function(window, document, toASCII, toUnicode) {

	var decoded = document.getElementById('decoded');
	var encoded = document.getElementById('encoded');
	var permalink = document.getElementById('permalink');
	var invalid = document.getElementById('invalid');
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

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function update() {
		var element;
		var value;
		var result;
		if (this == decoded) {
			element = encoded;
			value = text(decoded);
			result = toASCII(value.toLowerCase());
			text(element, result);
			permalink.href = '#' + encode(value);
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

	// https://mathiasbynens.be/notes/oninput
	decoded.onkeyup = encoded.onkeyup = update;
	decoded.oninput = encoded.oninput = function() {
		decoded.onkeyup = encoded.onkeyup = null;
		update.call(this);
	};

	decoded.onpaste = encoded.onpaste = function(event) {
		event.preventDefault();
		var text = event.clipboardData.getData('text/plain').trim();
		document.execCommand('insertText', false, text);
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
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t);
	var s = d.getElementsByTagName(t)[0];
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
