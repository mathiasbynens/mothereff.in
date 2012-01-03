(function(window, document) {

	var textarea = document.getElementsByTagName('textarea')[0],
	    characters = document.getElementById('characters'),
	    bytes = document.getElementById('bytes'),
	    permalink = document.getElementById('permalink'),
	    // http://mathiasbynens.be/notes/localstorage-pattern
	    storage = (function() {
	    	try {
	    		var storage = window.localStorage,
	    		    uid = new Date;
	    		storage.setItem(uid, uid);
	    		return storage.getItem(uid) == uid && storage;
	    	} catch(e) {}
	    }());

	// Taken from http://mths.be/punycode
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if ((value & 0xF800) == 0xD800) {
				extra = string.charCodeAt(counter++);
				if ((value & 0xFC00) != 0xD800 || (extra & 0xFC00) != 0xDC00) {
					throw Error('Illegal UCS-2 sequence');
				}
				value = ((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
			}
			output.push(value);
		}
		return output;
	}

	function formatNumber(number, unit) {
		return String(number).replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') + ' ' + unit + (number == 1 ? '' : 's');
	}

	function update() {
		var value = textarea.value.replace(/\r\n/g, '\n'),
		    encodedValue = encodeURI(value),
		    byteCount = ~-encodedValue.split(/%..|./).length, // https://gist.github.com/1010324
		    characterCount = ucs2decode(value).length;
		characters.innerHTML = formatNumber(characterCount, 'character');
		bytes.innerHTML = formatNumber(byteCount, 'byte');
		permalink.hash = encodedValue;
		storage && (storage.byteCountText = value);
	};

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
	g.src = '//www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));