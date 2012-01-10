(function(window, document) {

	var pre = document.getElementsByTagName('pre')[0],
	    code = document.getElementsByTagName('code')[0],
	    textarea = document.getElementsByTagName('textarea')[0],
	    checkboxes = document.getElementsByTagName('input'),
	    italic = checkboxes[0],
	    bold = checkboxes[1],
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
	    stringFromCharCode = String.fromCharCode,
	    cache = {
	    	'italic': {
	    		// `h` is kind of in a weird place
	    		'h': '\ud835\ude29'
	    	},
	    	'bold': {},
	    	'both': {}
	    };

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function replace(string, lowercaseCode, uppercaseCode, type) {
		return string.replace(/[a-zA-Z]/g, function(character) {
				var charCode = character.charCodeAt(),
				    isUppercase = charCode < 97;
				return cache[type][character] || (cache[type][character] = stringFromCharCode(0xd835, (isUppercase ? uppercaseCode : lowercaseCode) + charCode));
			})
	}

	function update() {
		var value = textarea.value,
		    result = value;
		if (italic.checked && bold.checked) {
			result = replace(result, 0xdc21, 0xdc27, 'both');
		} else if (italic.checked) {
			result = replace(result, 0xdbed, 0xdbf3, 'italic');
		} else if (bold.checked) {
			result = replace(result, 0xdbb9, 0xdbbf, 'bold');
		}
		text(code, result);
		if (storage) {
			storage.twitalicsText = value;
		}
		permalink.hash = encodeURIComponent(textarea.value);
	}

	textarea.onkeyup = italic.onchange = bold.onchange = update;
	textarea.oninput = function() {
		textarea.onkeyup = null;
		update();
	};

	if (storage) {
		storage.twitalicsText && (textarea.value = storage.twitalicsText);
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
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));