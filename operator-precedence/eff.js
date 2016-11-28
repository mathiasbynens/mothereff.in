(function(window, document) {

	var a = document.getElementById('a');
	var b = document.getElementById('b');
	var permalink = document.getElementById('permalink');
	var output = document.getElementById('output');
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

	function text(el, str) {
		if (str == null) {
			return el.innerText || el.textContent;
		}
		el.innerText != null && (el.innerText = str);
		el.textContent != null && (el.textContent = str);
	}

	function parse(value) {
		try {
			var zeon = new Zeon(value, Zeon.getNewConfig());
			zeon.parse();
			zeon.startProcess();
			zeon.disambiguate();
			// TODO: check zeon.hasError
			return zeon.btree.map(function(t) {
				return t.value;
			}).join('');
		} catch(e) {}
	}

	function update() {
		var textA = text(a);
		var textB = text(b);
		var ok = parse(textA) == parse(textB);
		output.className = ok ? 'pass' : 'fail';
		output.innerHTML = ok ? 'Yep.' : 'Nope.';
		permalink.href = '#' + encode(textA + '@' + textB);
	}

	// https://mathiasbynens.be/notes/oninput
	a.onkeyup = b.onkeyup = update;
	a.oninput = b.oninput = function() {
		a.onkeyup = b.onkeyup = null;
		update();
	};

	a.onpaste = b.onpaste = function(event) {
		event.preventDefault();
		var text = event.clipboardData.getData('text/plain').trim();
		document.execCommand('insertText', false, text);
	};

	if (storage) {
		storage.a && text(a, storage.a);
		storage.b && text(b, storage.b);
		update();
	}

	a.focus();
	a.onkeyup.call(a);

	window.onhashchange = function() {
		var parts = location.hash.slice(1).split('%40');
		if (parts.length == 1 || parts.length == 2) {
			text(a, decodeURIComponent(parts[0]));
			text(b, decodeURIComponent(parts[parts.length == 2 ? 1 : 0]));
			update();
		}
	};

	if (location.hash) {
		window.onhashchange();
	}

}(this, document));
