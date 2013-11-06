(function(window, document) {

	// Up for a challenge? Golf this down: https://gist.github.com/1020383
	var isUnquotableHTML = function(value) {
	    	return /^[^ \t\n\f\r"'`=<>]+$/.test(value);
	    },
	    isUnquotableCSS = function(value) {
	    	if (!value) return;
	    	// Escapes are valid, so replace them with a valid non-empty string
	    	value = value.replace(/\\([0-9A-Fa-f]{1,6})[ \t\n\f\r]?/g, 'a').replace(/\\./g, 'a');
	    	return !(
	    		/[\u0000-\u002c\u002e\u002f\u003A-\u0040\u005B-\u005E\u0060\u007B-\u009f]/.test(value)
	    		|| /^(?:-?\d|--)/.test(value)
	    	);
	    },
	    getElems = function(tagName) {
	    	var elems = document.getElementsByTagName(tagName);
	    	return {
	    		'html': elems[0],
	    		'css': elems[1]
	    	};
	    },
	    iElems = getElems('i'),
	    preElems = getElems('pre'),
	    markElems = getElems('mark'),
	    input = document.getElementsByTagName('input')[0],
	    permalink = document.getElementById('permalink'),
	    showHide = function(el, bool) {
	    	el.style.display = bool ? 'none' : 'inline';
	    },
	    // http://mathiasbynens.be/notes/localstorage-pattern
	    storage = (function() {
	    	var uid = new Date,
	    	    storage,
	    	    result;
	    	try {
	    		(storage = window.localStorage).setItem(uid, uid);
	    		result = storage.getItem(uid) == uid;
	    		storage.removeItem(uid);
	    		return result && storage;
	    	} catch(e) {}
	    }()),
	    text = function(el, str) {
	    	if (str == null) {
	    		return el.innerText || el.textContent;
	    	}
	    	el.innerText != null && (el.innerText = str);
	    	el.textContent != null && (el.textContent = str);
	    };

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function update() {
		var value = input.value,
		    html = isUnquotableHTML(value),
		    css = isUnquotableCSS(value);
		text(markElems.html, value);
		text(markElems.css, value);
		preElems.html.className = html ? 'valid' : 'invalid';
		preElems.css.className = css ? 'valid' : 'invalid';
		text(iElems.html, html ? 'a valid' : 'an invalid');
		text(iElems.css, css ? 'a valid' : 'an invalid');
		permalink.href = '#' + encode(value);
		storage && (storage.unquotedAttributes = value);
	}

	// http://mathiasbynens.be/notes/oninput
	input.onkeydown = update;
	input.oninput = function() {
		this.onkeydown = null;
		update();
	};

	input.onpaste = function(event) {
		event.preventDefault();
		var text = event.clipboardData.getData('text/plain').trim();
		document.execCommand('insertText', false, text);
	};

	if (storage && storage.unquotedAttributes) {
		input.value = storage.unquotedAttributes;
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

// Optimized Google Analytics snippet: http://mths.be/aab */
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t),
	    s = d.getElementsByTagName(t)[0];
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
