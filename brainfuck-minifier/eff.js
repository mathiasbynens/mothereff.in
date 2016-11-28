(function(window, document) {

	var textarea = document.getElementsByTagName('textarea')[0];
	var characters = document.getElementById('characters');
	var pre = document.getElementsByTagName('pre')[0];
	var output = document.getElementById('output');
	var permalink = document.getElementById('permalink');
	var dds = document.getElementsByTagName('dd');
	var before = dds[0];
	var after = dds[1];
	var ratio = dds[2];
	var regexNotBrainfuck = /[^\+\-<>\[\],\.]/g;
	var regexNumberGroup = /(?=(?:\d{3})+$)(?!\b)/g;
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
	var characterReferences;

	// Taken from https://mths.be/punycode
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

	function formatNumber(number, unit) {
		return (number == 0 ? '0' : String(number).replace(regexNumberGroup, ',')) + ' ' + unit + (number == 1 ? '' : 's');
	}

	function charCount(string) {
		return ucs2decode(string).length;
	}

	function byteCount(string) {
		return ~-encodeURI(string).split(/%..|./).length; // https://gist.github.com/1010324
	}

	function update() {
		var value = textarea.value,
		    result = value.replace(regexNotBrainfuck, ''),
		    originalCharacterCount = charCount(value),
		    originalByteCount = byteCount(value),
		    resultingByteCount = byteCount(result); // byte and character counts are the same at this point
		text(output, result || '[no output]');
		pre.className = resultingByteCount ? '' : 'fail';
		text(before, formatNumber(originalByteCount, 'byte') + (originalCharacterCount == originalByteCount ? '' : ' (assuming UTF-8); ' + formatNumber(originalCharacterCount, 'character')));
		text(after, formatNumber(resultingByteCount, 'byte'));
		text(ratio, (originalByteCount ? ((originalByteCount - resultingByteCount) / originalByteCount * 100) : 0).toFixed(2) + '%');

		permalink.hash = encode(value);
		storage && (storage.brainfuck = value);
	};

	// https://mathiasbynens.be/notes/oninput
	textarea.onkeyup = update;
	textarea.oninput = function() {
		textarea.onkeyup = null;
		update();
	};

	if (storage) {
		storage.brainfuck && (textarea.value = storage.brainfuck);
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
	var g = d.createElement(t);
	var s = d.getElementsByTagName(t)[0];
	g.src = 'https://www.google-analytics.com/ga.js';
	s.parentNode.insertBefore(g, s);
}(document, 'script'));
