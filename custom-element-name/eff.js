(function(window, document) {

	var input = document.getElementsByTagName('input')[0];
	var valid = window.valid;
	var message = window.message;
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
		} catch(exception) {}
	}());
	var stringFromCharCode = String.fromCharCode;

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function update() {
		var value = input.value;
		var result = validate(value);
		if (result.isValid) {
			validate(value);
			valid.className = 'show';
			if (result.message) {
				input.className = 'warning';
				// Note: the use of `innerHTML` is intended and safe in this case,
				// since we fully control the error messages.
				message.innerHTML = '<em>However</em>, as a best practice, ' + result.message;
				message.className = 'show';
			} else {
				input.className = 'valid';
				message.className = 'hide';
			}
		} else {
			message.innerHTML = result.message;
			message.className = 'show';
			valid.className = 'hide';
			input.className = 'invalid';
		}
		permalink.hash = encode(value);
		storage && (storage.customElementName = value);
	}

	// https://mathiasbynens.be/notes/oninput
	input.onkeyup = update;
	input.oninput = function() {
		input.onkeyup = null;
		update();
	};

	if (storage) {
		storage.customElementName && (input.value = storage.customElementName);
		update();
	}

	window.onhashchange = function() {
		input.value = decodeURIComponent(location.hash.slice(1));
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
