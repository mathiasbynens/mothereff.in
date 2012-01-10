(function(window, document) {

	var pre = document.getElementsByTagName('pre')[0],
	    code = document.getElementsByTagName('code')[0],
	    textarea = document.getElementsByTagName('textarea')[0],
	    checkboxes = document.getElementsByTagName('input'),
	    serif = checkboxes[0],
	    italic = checkboxes[1],
	    bold = checkboxes[2],
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
	    switchObj;

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function replace(string, lowercaseCode, type) {
		return string.replace(regexAlpha, function(character) {
				var charCode = character.charCodeAt(),
				    isUppercase = charCode < 97,
				    typeRef = switchObj[type];
				return typeRef[character] || (typeRef[character] = stringFromCharCode(0xd835, charCode + lowercaseCode + (isUppercase ? 6 : 0)));
			});
	}

	switchObj = {
		'': function(result, type) {
			return result;
		},
		'serif': function(result, type) {
			// There are no mathematical serif characters that aren’t also bold, italicized or formatted in a way
			return result;
		},
		'serif-italic': function(result, type) {
			return replace(result, 0xdbed, type);
		},
		'serif-bold': function(result, type) {
			return replace(result, 0xdbb9, type);
		},
		'serif-italic-bold': function(result, type) {
			return replace(result, 0xdc21, type);
		},
		'italic': function(result, type) {
			return replace(result, 0xddc1, type);
		},
		'italic-bold': function(result, type) {
			return replace(result, 0xddf5, type);
		},
		'bold': function(result, type) {
			return replace(result, 0xdbb9, type);
		}
	};

	// `h` is kind of in a weird place
	switchObj['serif-italic'].h = '\ud835\ude29';

	function update() {
		var value = textarea.value,
		    result = value,
		    settings = [];

		serif.checked && settings.push('serif');
		italic.checked && settings.push('italic');
		bold.checked && settings.push('bold');

		serif.disabled = !italic.checked && !bold.checked;

		settings = settings.join('-');
		console.log(settings);

		result = (switchObj[settings])(result, settings);

		text(code, result);
		if (storage) {
			storage.twitalicsText = value;
		}
		permalink.hash = encodeURIComponent(textarea.value);
	}

	textarea.onkeyup = serif.onchange = italic.onchange = bold.onchange = update;
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