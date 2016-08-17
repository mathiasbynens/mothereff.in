(function(window, document) {

	var textareas = document.getElementsByTagName('textarea');
	var es6 = textareas[0];
	var es5 = textareas[1];
	var regexpu = window.regexpu = require('regexpu');
	var inputs = document.getElementsByTagName('input');
	var checkboxDotAllFlag = inputs[0];
	var checkboxUnicodePropertyEscapes = inputs[1];
	var checkboxUseUnicodeFlag = inputs[2];
	var targetLanguage = document.getElementById('target-language');
	var divUseUnicodeFlag = document.getElementsByTagName('div')[2];
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
		var showUnicodeFlagCheckbox = checkboxUnicodePropertyEscapes.checked;
		checkboxUseUnicodeFlag.disabled = !showUnicodeFlagCheckbox;
		var useES6 = showUnicodeFlagCheckbox && checkboxUseUnicodeFlag.checked;
		targetLanguage.textContent = useES6 ? 'ES6' : 'ES5';
		divUseUnicodeFlag.classList.toggle('hide', !showUnicodeFlagCheckbox);
		var value = es6.value;
		var transpiled;
		var isError = false;
		try {
			transpiled = regexpu.transpileCode(value, {
				'dotAllFlag': checkboxDotAllFlag.checked,
				'unicodePropertyEscape': checkboxUnicodePropertyEscapes.checked,
				'useUnicodeFlag': useES6
			});
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
		var params = new URLSearchParams();
		params.set('input', value);
		if (checkboxDotAllFlag.checked) {
			params.set('dotAllFlag', '1');
		}
		if (checkboxUnicodePropertyEscapes.checked) {
			params.set('unicodePropertyEscape', '1');
		}
		if (showUnicodeFlagCheckbox && checkboxUseUnicodeFlag.checked) {
			params.set('useUnicodeFlag', '1');
		}
		permalink.hash = params.toString();
		storage && (storage.regexpu = value);
	};

	run.onclick = function(event) {
		event.preventDefault();
		eval(es5.value);
	};

	es6.oninput = checkboxDotAllFlag.onchange = checkboxUnicodePropertyEscapes.onchange = checkboxUseUnicodeFlag.onchange =  update;

	if (storage) {
		storage.regexpu && (es6.value = storage.regexpu);
		update();
	}

	window.onhashchange = function() {
		var params = new URLSearchParams(location.hash.slice(1));
		checkboxDotAllFlag.checked = JSON.parse(
			params.get('dotAllFlag')
		);
		checkboxUnicodePropertyEscapes.checked = JSON.parse(
			params.get('unicodePropertyEscape')
		);
		checkboxUseUnicodeFlag.checked = JSON.parse(
			params.get('useUnicodeFlag')
		);
		es6.value = params.get('input');
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
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document));
