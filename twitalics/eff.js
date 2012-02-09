(function(window, document) {

	var pre = document.getElementsByTagName('pre')[0],
	    code = document.getElementsByTagName('code')[0],
	    textarea = document.getElementsByTagName('textarea')[0],
	    checkboxes = document.getElementsByTagName('input'),
	    serif = checkboxes[0],
	    script = checkboxes[1],
	    fraktur = checkboxes[2],
	    italic = checkboxes[3],
	    bold = checkboxes[4],
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
	    regexAlpha = /[a-zA-Z]/g,
	    regexNum = /[0-9]/g,
	    types;

	function encode(string) {
		// URL-encode some more characters to avoid issues when using permalink URLs in Markdown
		return encodeURIComponent(string).replace(/['()_*]/g, function(character) {
			return '%' + character.charCodeAt().toString(16);
		});
	}

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function extend(destination, source) {
		var key;
		for (key in source) {
			// `hasOwnProperty` is overkill here
			destination[key] = source[key];
		}
	}

	function replace(string, lowercaseCode, type) {
		return string.replace(regexAlpha, function(character) {
				var charCode = character.charCodeAt(),
				    isUppercase = charCode < 97,
				    typeRef = types[type];
				return typeRef[character] || (typeRef[character] = stringFromCharCode(0xd835, charCode + lowercaseCode + (isUppercase ? 6 : 0)));
			});
	}

	types = window.types = {
		// `new Number` is needed since we want to add properties to the numbers later (cache)
		'serif-script-italic': new Number(0xdc55),
		'serif-script-italic-bold': new Number(0xdc89),
		'serif-script-fraktur': new Number(0xdcbd),
		'serif-script-fraktur-bold': new Number(0xdd25),
		'serif-italic': new Number(0xdbed),
		'serif-bold': new Number(0xdbb9),
		'serif-italic-bold': new Number(0xdc21),
		'italic': new Number(0xddc1),
		'italic-bold': new Number(0xddf5),
		'bold': new Number(0xdd8d)
	};

	// `h` is kind of in a weird place
	types['serif-italic'].h = '\ud835\ude29';
	// exceptions for ‘script’: http://www.w3.org/TR/xml-entity-names/script.html
	extend(types['serif-script-italic'], {
		'B': '\u212c',
		'E': '\u2130',
		'F': '\u2131',
		'H': '\u210b',
		'I': '\u2110',
		'L': '\u2112',
		'M': '\u2133',
		'R': '\u211b',
		'e': '\u212f',
		'g': '\u210a',
		'o': '\u2134'
	});
	// missing characters in non-bold Fraktur script:
	extend(types['serif-script-fraktur'], {
		'C': '\ud835\udd6e',
		'H': '\ud835\udd73',
		'I': '\ud835\udd74',
		'R': '\ud835\udd7d',
		'Z': '\ud835\udd85'
	})

	function update() {
		var value = textarea.value,
		    result = value,
		    settings = [];

		if (fraktur.checked) {
			serif.checked = script.checked = script.disabled = serif.disabled = italic.disabled = true;
			italic.checked = false;
			settings.push('serif-script-fraktur');
		} else if (script.checked) {
			serif.checked = serif.disabled = italic.checked = italic.disabled = true;
			script.disabled = false;
			settings.push('serif-script-italic');
		} else {
			serif.checked && settings.push('serif');
			script.checked && settings.push('script');
			italic.checked && settings.push('italic');
			serif.disabled = !(italic.checked || bold.checked || fraktur.checked);
			italic.disabled = script.disabled = false;
		}
		bold.checked && settings.push('bold');
		settings = settings.join('-');

		if (settings && settings != 'serif') {
			// There are no mathematical serif characters that aren’t also bold, italicized or formatted in a way
			result = replace(result, types[settings], settings);
		}

		text(code, result);

		if (storage) {
			storage.twitalicsText = value;
		}
		permalink.hash = encode(textarea.value);
	}

	textarea.onkeyup = script.onchange = fraktur.onchange = serif.onchange = italic.onchange = bold.onchange = update;
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