(function(window, document) {

	var input = document.getElementsByTagName('div')[0],
	    quotes = document.getElementsByTagName('b'),
	    marks = document.getElementsByTagName('mark'),
	    css = marks[0],
	    js = marks[1],
	    qsa = marks[2],
	    permalink = document.getElementById('permalink'),
	    example = document.getElementById('example'),
	    whitespace = document.getElementById('whitespace'),
	    escaped = {
	    	"'":      "\\'",
	    	'\\':     '\\\\',
	    	'\n':     '\\n',
	    	'\u2028': '\\u2028',
	    	'\u2029': '\\u2029'
	    },
	    // http://mathiasbynens.be/notes/localstorage-pattern
	    storage = (function() {
	    	try {
	    		var storage = window.localStorage,
	    		    uid = new Date;
	    		storage.setItem(uid, uid);
	    		return storage.getItem(uid) == uid && storage;
	    	} catch(e) {}
	    }());

	function forEach(array, fn) {
		var length = array.length;
		while (length--) {
			fn(array[length]);
		}
	}

	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	// http://mathiasbynens.be/notes/html5-id-class#css
	function cssEscape(str) {
		var firstChar = str.charAt(0),
		    result = '';
		if (/^-+$/.test(str)) {
			return '\\-' + str.slice(1);
		}
		if (/^--/.test(str)) {
			result = '\\-';
			str = str.slice(1);
		}
		if (/\d/.test(firstChar)) {
			result = '\\3' + firstChar + ' ';
			str = str.slice(1);
		}
		result += map(str.split(''), function(chr) {
			if (/[\t\n\v\f]/.test(chr)) {
				return '\\' + chr.charCodeAt().toString(16) + ' ';
			}
			return (/[ !"#$%&'()*+,./:;<=>?@\[\\\]^_`{|}~]/.test(chr) ? '\\' : '') + chr;
		}).join('');
		return result;
	}

	function doubleSlash(str) {
		return str.replace(/['\n\u2028\u2029\\]/g, function(chr) {
			return escaped[chr];
		});
	}

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function update(event) {
		// \r\n and \r become \n in the tokenizer as per HTML5
		var value = text(input).replace(/\r\n?/g, '\n'),
		    cssValue = '#' + cssEscape(value),
		    qsaValue = doubleSlash(cssValue),
		    jsValue = doubleSlash(value).replace(/<\/script/g, '<\\/script'), // http://mths.be/etago
		    link = '#' + encodeURIComponent(value);
		whitespace.style.display = /\s/.test(value) ? 'block' : 'none';
		forEach(quotes, function(el) {
			text(el, ~value.indexOf('"') ? '\'' : '"');
		});
		text(css, cssValue);
		text(qsa, qsaValue);
		text(js, jsValue);
		permalink.href = link;
		storage && (storage.cssEscapes = value);
		example.href = 'data:text/html;charset=utf-8,' + encodeURIComponent('<!DOCTYPE html><title>Mothereffing CSS escapes example</title><style>pre{background:#eee;padding:.5em}p{display:none}' + cssValue + '{display:block}</style><h1><a href="http://mothereff.in/css-escapes#' + link + '">Mothereffing CSS escapes</a> example</h1><pre><code>' + value.replace(/</g, '&lt;') + '</code></pre><p id="' + value.replace(/"/g, '&quot;') + '">If you can read this, the escaped CSS selector worked. </p><script>document.getElementById(\'' + jsValue + '\').innerHTML += \' <code>document.getElementById</code> worked.\';document.querySelector(\'' + qsaValue + '\').innerHTML+=\' <code>document.querySelector</code> worked.\'<\/script>');
	}

	input.onkeyup = update;
	input.oninput = function() {
		this.onkeyup = null;
		update();
	};

	if (storage && storage.cssEscapes) {
		text(input, storage.cssEscapes);
		update();
	}

	window.onhashchange = function() {
		text(input, decodeURIComponent(location.hash.slice(1)));
	};
	if (location.hash) {
		window.onhashchange();
		update();
	}

	input.focus();

}(this, document));

/*! Optimized Google Analytics snippet: http://mths.be/aab */
window._gaq = [['_setAccount', 'UA-6065217-60'], ['_trackPageview']];
(function(d, t) {
	var g = d.createElement(t),
	    s = d.getElementsByTagName(t)[0];
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));