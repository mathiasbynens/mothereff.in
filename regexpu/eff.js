(function(window, document) {

	var textareas = document.getElementsByTagName('textarea');
	var es6 = textareas[0];
	var es5 = textareas[1];
	var regexpu = window.regexpu = require('regexpu');
	var run = document.getElementById('run');
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
		var value = es6.value;
		var transpiled;
		var isError = false;
		try {
			transpiled = regexpu.transpileCode(value);
		} catch (exception) {
			isError = true;
		}
		if (isError) {
			es6.className = es5.className = 'invalid';
			es5.value = '// Error during transpilation.';
		} else {
			es6.className = es5.className = '';
			es5.value = transpiled;
		}
		permalink.hash = encode(value);
		storage && (storage.regexpu = value);
	};

	run.onclick = function(event) {
		event.preventDefault();
		eval(es5.value);
	};

	es6.oninput = update;

	if (storage) {
		storage.regexpu && (es6.value = storage.regexpu);
		update();
	}

	window.onhashchange = function() {
		es6.value = decodeURIComponent(location.hash.slice(1));
		update();
	};

	if (location.hash) {
		window.onhashchange();
	}

}(this, document));

// Google Analytics
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d) {
	var g = d.createElement('script');
	var s = d.scripts[0];
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document));
