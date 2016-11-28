(function(window, document) {

	var textareas = document.getElementsByTagName('textarea');
	var decoded = textareas[0];
	var encoded = textareas[1];
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

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function decode(string) {
		return decodeURIComponent(string.replace(/\+/g, ' '));
	}

	function update() {
		var decodedString;
		var result;
		if (this == encoded) { // URL-decode the input
			try {
				encoded.className = decoded.className = '';
				result = decode(encoded.value);
				decoded.value = decodedString = result;
			} catch (exception) {
				decoded.value = 'ERROR: invalid input';
				encoded.className = decoded.className = 'invalid';
				decodedString = '';
			}
		} else { // URL-encode the input
			encoded.className = decoded.className = '';
			decodedString = decoded.value;
			result = encode(decodedString);
			encoded.value = result;
		}
		permalink.hash = encode(decodedString);
		storage && (storage.urlEncoded = decodedString);
	};

	// https://mathiasbynens.be/notes/oninput
	decoded.onkeyup = encoded.onkeyup = update;
	decoded.oninput = encoded.oninput = function() {
		decoded.onkeyup = encoded.onkeyup = null;
		update.call(this);
	};

	if (storage) {
		storage.urlEncoded && (decoded.value = storage.urlEncoded);
		update();
	}

	window.onhashchange = function() {
		decoded.value = decodeURIComponent(location.hash.slice(1));
		update();
	};

	if (location.hash) {
		window.onhashchange();
	}

}(this, document));

// Google Analytics
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t);
	var s = d.getElementsByTagName(t)[0];
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
