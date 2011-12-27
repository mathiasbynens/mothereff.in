(function(window, document) {

	var pre = document.getElementsByTagName('pre')[0],
	    code = document.getElementsByTagName('code')[0],
	    textarea = document.getElementsByTagName('textarea')[0],
	    checkbox = document.getElementsByTagName('input')[0],
	    permalink = document.getElementById('permalink'),
	    // http://mathiasbynens.be/notes/localstorage-pattern
	    storage = (function() {
	    	try {
	    		var storage = window.localStorage,
	    		    uid = new Date;
	    		storage.setItem(uid, uid);
	    		return storage.getItem(uid) == uid && storage;
	    	} catch(e) {}
	    }()),
	    cache = {
	    	// http://es5.github.com/#x7.8.4
	    	// Table 4 — String Single Character Escape Sequences
	    	'\b': '\\b',
	    	'\t': '\\t',
	    	'\n': '\\n',
	    	'\v': '\\v',
	    	'\f': '\\f',
	    	'\r': '\\r',
	    	// escape double quotes, \u2028, and \u2029 too, as they break input
	    	'\"': '\\\"',
	    	'\u2028': '\\u2028',
	    	'\u2029': '\\u2029',
	    	// we’re wrapping the string in single quotes, so escape those too
	    	'\'': '\\\''
	    };

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	// https://gist.github.com/1243213
	function unicodeEscape(str) {
		return str.replace(/[\s\S]/g, function(character) {
			var charCode = character.charCodeAt(),
			    hexadecimal = charCode.toString(16),
			    longhand = hexadecimal.length > 2,
			    escape;
			if (checkbox.checked && /[ -&(-~]/.test(character)) {
				// it’s a printable ASCII character (or `'`); don’t escape it
				return character;
			}
			if (cache[character]) {
				return cache[character];
			}
			escape = cache[character] = '\\' + (longhand ? 'u' : 'x') + ('0000' + hexadecimal).slice(longhand ? -4 : -2);
			return escape;
		});
	}

	function update() {
		var value = textarea.value;
		try {
			text(code, '\'' + unicodeEscape((1,eval)('"' + value.replace(/[\n\u2028\u2029"']/g, function(chr) {
				return cache[chr];
			}) + '"')) + '\'');
			pre.className = '';
		} catch (e) {
			pre.className = 'fail';
		}
		if (storage) {
			storage.jsEscapeText = value;
			if (checkbox.checked) {
				storage.jsEscapeCheckbox = true;
			} else {
				storage.removeItem('jsEscapeCheckbox');
			}
		}
		permalink.hash = +checkbox.checked + encodeURIComponent(textarea.value);
	}

	textarea.onkeyup = checkbox.onchange = update;
	textarea.oninput = function() {
		textarea.onkeyup = null;
		update();
	};


	if (storage) {
		storage.jsEscapeText && (textarea.value = storage.jsEscapeText);
		storage.jsEscapeCheckbox && (checkbox.checked = true);
		update();
	}

	window.onhashchange = function() {
		location.hash.charAt(1) == '0' && (checkbox.checked = false);
		textarea.value = decodeURIComponent(location.hash.slice(2));
		update();
	};

	if (location.hash) {
		window.onhashchange();
	}


}(this, document));

// Google Analytics
var _gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t),
	    s = d.getElementsByTagName(t)[0];
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));