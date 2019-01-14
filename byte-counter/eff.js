(function(window, document) {

	var textarea = document.getElementsByTagName('textarea')[0];
	var characters = document.getElementById('characters');
	var bytes = document.getElementById('bytes');
	var permalink = document.getElementById('permalink');
	var regexNumberGroup = /(?=(?:\d{3})+$)(?!\b)/g;
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

	function formatNumber(number, unit) {
		return String(number).replace(regexNumberGroup, ',') + ' ' + unit + (number == 1 ? '' : 's');
	}

	function update() {
		var value = textarea.value.replace(/\r\n/g, '\n'),
		    encodedValue = encode(value),
		    byteCount = new Blob([value]).size,
		    characterCount = [...value].length;
		characters.innerHTML = formatNumber(characterCount, 'character');
		bytes.innerHTML = formatNumber(byteCount, 'byte');
		permalink.hash = encodedValue;
		storage && (storage.byteCountText = value);
	};

	// https://mathiasbynens.be/notes/oninput
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
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
