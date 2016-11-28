(function(window, document) {

	var textareas = document.getElementsByTagName('textarea');
	var decoded = textareas[0];
	var encoded = textareas[1];
	var checkboxes = document.getElementsByTagName('input');
	var encodeSpecialOnly = checkboxes[0];
	var useNamedReferences = checkboxes[1];
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
	var stringFromCharCode = String.fromCharCode;

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function update() {
		var shouldDecode = this == encoded;
		var value;
		if (shouldDecode) {
			value = he.decode(encoded.value);
			decoded.value = value;
		} else {
			value = he.encode(decoded.value, {
				'encodeEverything': !encodeSpecialOnly.checked,
				'useNamedReferences': useNamedReferences.checked
			});
			encoded.value = value;
		}
		value = decoded.value;
		permalink.hash = encode(value);
		storage && (storage.he = value);
	};

	// https://mathiasbynens.be/notes/oninput
	decoded.onkeyup = encoded.onkeyup = encodeSpecialOnly.onchange = useNamedReferences.onchange = update;
	decoded.oninput = encoded.oninput = encodeSpecialOnly.onchange = useNamedReferences.onchange = function() {
		decoded.onkeyup = encoded.onkeyup = null;
		update.call(this);
	};

	if (storage) {
		storage.he && (decoded.value = storage.he);
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
