(function(window, document) {

	var a = document.getElementById('a'),
	    b = document.getElementById('b'),
	    permalink = document.getElementById('permalink'),
	    output = document.getElementById('output'),
	    storage = (function() {
	    	try {
	    		var storage = window.localStorage;
	    		return storage.getItem && storage;
	    	} catch(e) {}
	    }());

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
		var textA = text(a),
		    textB = text(b),
		    ok = parse(textA) == parse(textB);
		output.className = ok ? 'pass' : 'fail';
		output.innerHTML = ok ? 'Yep.' : 'Nope.';
		permalink.href = '#' + encodeURIComponent(textA + '@' + textB);
	}

	a.onkeyup = b.onkeyup = update;
	a.oninput = b.oninput = function() {
		a.onkeyup = b.onkeyup = null;
		update();
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