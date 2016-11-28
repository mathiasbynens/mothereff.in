(function(window, document) {

	var textareas = document.getElementsByTagName('textarea');
	var decoded = textareas[0];
	var encoded = textareas[1];
	var radios = document.getElementsByTagName('input');
	var use24 = radios[0];
	var use26 = radios[1];
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

	function update() {
		var shouldDecode = this == encoded;
		var value;
		var options = use24.checked ? null : {
			'alphabet': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
		};
		if (shouldDecode) {
			value = bacon.decode(encoded.value, options);
			decoded.value = value;
		} else {
			value = bacon.encode(decoded.value, options);
			encoded.value = value;
		}
		value = decoded.value;
		permalink.hash = encode(value);
		storage && (storage.bacon = value);
	};

	// https://mathiasbynens.be/notes/oninput
	decoded.onkeyup = encoded.onkeyup = use24.onchange = use26.onchange = update;
	decoded.oninput = encoded.oninput = use24.onchange = use26.onchange = function() {
		decoded.onkeyup = encoded.onkeyup = null;
		update.call(this);
	};

	if (storage) {
		storage.bacon && (decoded.value = storage.bacon);
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
	var g = d.createElement(t),
	    s = d.getElementsByTagName(t)[0];
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
