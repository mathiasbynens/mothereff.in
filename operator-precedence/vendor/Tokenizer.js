/*!
 * Tokenizer for JavaScript / ECMAScript 5
 * (c) Peter van der Zee, qfox.nl
 */

/**
 * @param {Object} inp
 */
window.Tokenizer = function(inp){
	this.inp = inp||'';
	// replace all other line terminators with \n (leave \r\n in tact though). we should probably remove the shadowInp when finished...
	// only replace \r if it is not followed by a \n else \r\n would become \n\n causing a double newline where it is just a single
	this.shadowInp = (inp||'').replace(Tokenizer.regexNormalizeNewlines, '\n');
	this.pos = 0;
	this.line = 0;
	this.column = 0;
	this.cache = {};
	
	this.errorStack = [];
	
	this.wtree = [];
	this.btree = [];
	
//	this.regexWhiteSpace = Tokenizer.regexWhiteSpace;
	this.regexLineTerminator = Tokenizer.regexLineTerminator; // used in fallback
	this.regexAsciiIdentifier = Tokenizer.regexAsciiIdentifier;
	this.hashAsciiIdentifier = Tokenizer.hashAsciiIdentifier;
//	this.regexHex = Tokenizer.regexHex;
	this.hashHex = Tokenizer.hashHex
	this.regexUnicodeEscape = Tokenizer.regexUnicodeEscape;
	this.regexIdentifierStop = Tokenizer.regexIdentifierStop;
	this.hashIdentifierStop = Tokenizer.hashIdentifierStop;
//	this.regexPunctuators = Tokenizer.regexPunctuators;
	this.regexNumber = Tokenizer.regexNumber;
	this.regexNewline = Tokenizer.regexNewline;
	
	this.regexBig = Tokenizer.regexBig;
	this.regexBigAlt = Tokenizer.regexBigAlt;
	
	this.tokenCount = 0;
	this.tokenCountNoWhite = 0;
	
	this.Unicode = window.Unicode;
	
	// if the Parser throws an error. it will set this property to the next match
	// at the time of the error (which was not what it was expecting at that point) 
	// and pass on an "error" match. the error should be scooped on the stack and 
	// this property should be returned, without looking at the input...
	this.errorEscape = null;
};

Tokenizer.prototype = {
	inp:null,
	shadowInp:null,
	pos:null,
	line:null,
	column:null,
	cache:null,
	errorStack:null,
	
	wtree: null, // contains whitespace (spaces, comments, newlines)
	btree: null, // does not contain any whitespace tokens.
	
	regexLineTerminator:null,
	regexAsciiIdentifier:null,
	hashAsciiIdentifier:null,
	hashHex:null,
	regexUnicodeEscape:null,
	regexIdentifierStop:null,
	hashIdentifierStop:null,
	regexNumber:null,
	regexNewline:null,
	regexBig:null,
	regexBigAlt:null,
	tokenCount:null,
	tokenCountNoWhite:null,
	
	Unicode:null,
	
	// storeCurrentAndFetchNextToken(bool, false, false true) to get just one token
	storeCurrentAndFetchNextToken: function(noRegex, returnValue, stack, _dontStore){
		var regex = !noRegex; // TOFIX :)
		var pos = this.pos;
		var inp = this.inp;
		var shadowInp = this.shadowInp;
		var matchedNewline = false;
		do {
			if (!_dontStore) {
				++this.tokenCount;
				stack.push(returnValue);
				// did the parent Parser throw up?
				if (this.errorEscape) {
					returnValue = this.errorEscape;
					this.errorEscape = null;
					return returnValue;
				}
			}
			_dontStore = false;
		
			if (pos >= inp.length) {
				returnValue = {start:inp.length,stop:inp.length,name:12/*EOF*/};
				break; 
			}
			var returnValue = null;
		
			var start = pos;
			var chr = inp[pos];
	
			//							1 ws							2 lt				   3 scmt 4 mcmt 5/6 str 7 nr     8 rx  9 punc
			//if (true) {
				// substring method (I think this is faster..)
				var part2 = inp.substring(pos,pos+4);
				var part = this.regexBig.exec(part2);
			//} else {
			//	// non-substring method (lastIndex)
			//	// this method does not need a substring to apply it
			//	this.regexBigAlt.lastIndex = pos;
			//	var part = this.regexBigAlt.exec(inp);
			//}
			
			if (part[1]) { //this.regexWhiteSpace.test(chr)) { // SP, TAB, VT, FF, NBSP, BOM (, TOFIX: USP)
				++pos;
				returnValue = {start:start,stop:pos,name:9/*WHITE_SPACE*/,line:this.line,col:this.column,isWhite:true};
				++this.column;
			} else if (part[2]) { //this.regexLineTerminator.test(chr)) { // LF, CR, LS, PS
				var end = pos+1;
				if (chr=='\r' && inp[pos+1] == '\n') ++end; // support crlf=>lf
				returnValue = {start:pos,stop:end,name:10/*LINETERMINATOR*/,line:this.line,col:this.column,isWhite:true};
				pos = end;
				// mark newlines for ASI
				matchedNewline = true;
				++this.line;
				this.column = 0;
				returnValue.hasNewline = 1;
			} else if (part[3]) { //chr == '/' && inp[pos+1] == '/') {
				pos = shadowInp.indexOf('\n',pos);
				if (pos == -1) pos = inp.length;
				returnValue = {start:start,stop:pos,name:7/*COMMENT_SINGLE*/,line:this.line,col:this.column,isComment:true,isWhite:true};
				this.column = returnValue.stop;
			} else if (part[4]) { //chr == '/' && inp[pos+1] == '*') {
				var newpos = inp.indexOf('*/',pos);
				if (newpos == -1) {
					newpos = shadowInp.indexOf('\n', pos);
					if (newpos < 0) pos += 2;
					else pos = newpos;
					returnValue = {start:start,stop:pos,name:14/*error*/,value:inp.substring(start, pos),line:this.line,col:this.column,isComment:true,isWhite:true,tokenError:true,error:Tokenizer.Error.UnterminatedMultiLineComment};
					this.errorStack.push(returnValue);
				} else {
					pos = newpos+2;
					returnValue = {start:start,stop:pos,name:8/*COMMENT_MULTI*/,value:inp.substring(start, pos),line:this.line,col:this.column,isComment:true,isWhite:true};
	
					// multi line comments are also reason for asi, but only if they contain at least one newline (use shadow input, because all line terminators would be valid...)
					var shadowValue = shadowInp.substring(start, pos);
					var i = 0, hasNewline = 0;
					while (i < (i = shadowValue.indexOf('\n', i+1))) {
						++hasNewline;
					}
					if (hasNewline) {
						matchedNewline = true;
						returnValue.hasNewline = hasNewline;
						this.line += hasNewline;
						this.column = 0;
					} else {
						this.column = returnValue.stop;
					}
				}
			} else if (part[5]) { //chr == "'") {
				// old method
				//console.log("old method");
				
				var hasNewline = 0;
				do {
					// process escaped characters
					while (pos < inp.length && inp[++pos] == '\\') {
						if (shadowInp[pos+1] == '\n') ++hasNewline;
						++pos;
					}
					if (this.regexLineTerminator.test(inp[pos])) {
						returnValue = {start:start,stop:pos,name:14/*error*/,value:inp.substring(start, pos),isString:true,tokenError:true,error:Tokenizer.Error.UnterminatedDoubleStringNewline};
						this.errorStack.push(returnValue);
						break;
					}
				} while (pos < inp.length && inp[pos] != "'");
				if (returnValue) {} // error
				else if (inp[pos] != "'") {
					returnValue = {start:start,stop:pos,name:14/*error*/,value:inp.substring(start, pos),isString:true,tokenError:true,error:Tokenizer.Error.UnterminatedDoubleStringOther};
					this.errorStack.push(returnValue);
				} else {
					++pos;
					returnValue = {start:start,stop:pos,name:5/*STRING_SINGLE*/,isPrimitive:true,isString:true};
					if (hasNewline) {
						returnValue.hasNewline = hasNewline;
						this.line += hasNewline;
						this.column = 0;
					} else {
						this.column += (pos-start);
					}
				}				
			} else if (part[6]) { //chr == '"') {
				var hasNewline = 0;
				// TODO: something like this: var regexmatch = /([^\']|$)+/.match();
				do {
					// process escaped chars
					while (pos < inp.length && inp[++pos] == '\\') {
						if (shadowInp[pos+1] == '\n') ++hasNewline;
						++pos;
					}
					if (this.regexLineTerminator.test(inp[pos])) {
						returnValue = {start:start,stop:pos,name:14/*error*/,value:inp.substring(start, pos),isString:true,tokenError:true,error:Tokenizer.Error.UnterminatedSingleStringNewline};
						this.errorStack.push(returnValue);
						break;
					}
				} while (pos < inp.length && inp[pos] != '"');
				if (returnValue) {}
				else if (inp[pos] != '"') {
					returnValue = {start:start,stop:pos,name:14/*error*/,value:inp.substring(start, pos),isString:true,tokenError:true,error:Tokenizer.Error.UnterminatedSingleStringOther};
					this.errorStack.push(returnValue);
				} else {
					++pos;
					returnValue = {start:start,stop:pos,name:6/*STRING_DOUBLE*/,isPrimitive:true,isString:true};
					if (hasNewline) {
						returnValue.hasNewline = hasNewline;
						this.line += hasNewline;
						this.column = 0;
					} else {
						this.column += (pos-start);
					}
				}
			} else if (part[7]) { //(chr >= '0' && chr <= '9') || (chr == '.' && inp[pos+1] >= '0' && inp[pos+1] <= '9')) {
				var nextPart = inp.substring(pos, pos+30);
				var match = nextPart.match(this.regexNumber);
				if (match[2]) { // decimal
					var value = match[2];
					var parsingOctal = value[0] == '0' && value[1] && value[1] != 'e' && value[1] != 'E' && value[1] != '.';
					if (parsingOctal) {
						returnValue = {start:start,stop:pos,name:14/*error*/,isNumber:true,isOctal:true,tokenError:true,error:Tokenizer.Error.IllegalOctalEscape,value:value};
						this.errorStack.push(returnValue);
					} else {
						returnValue = {start:start,stop:start+value.length,name:4/*NUMERIC_DEC*/,isPrimitive:true,isNumber:true,value:value};
					}
				} else if (match[1]) { // hex
					var value = match[1];
					returnValue = {start:start,stop:start+value.length,name:3/*NUMERIC_HEX*/,isPrimitive:true,isNumber:true,value:value};
				} else {
					throw 'unexpected parser errror... regex fail :(';
				}
				
				if (value.length < 300) {
					pos += value.length;
				} else {
					// old method of parsing numbers. only used for extremely long number literals (300+ chars).
					// this method does not require substringing... just memory :)
					var tmpReturnValue = this.oldNumberParser(pos, chr, inp, returnValue, start, Tokenizer);
					pos = tmpReturnValue[0];
					returnValue = tmpReturnValue[1];
				}
			} else if (regex && part[8]) { //chr == '/') { // regex cannot start with /* (would be multiline comment, and not make sense anyways). but if it was /* then an earlier if would have eated it. so we only check for /
				var twinfo = []; // matching {[( info
				var found = false;
				var parens = [];
				var nonLethalError = null;
				while (++pos < inp.length) {
					chr = shadowInp[pos];
					// parse RegularExpressionChar
					if (chr == '\n') {
						returnValue = {start:start,stop:pos,name:14/*error*/,tokenError:true,errorHasContent:true,error:Tokenizer.Error.UnterminatedRegularExpressionNewline};
						this.errorStack.push(returnValue);
						break; // fail
					} else if (chr == '/') {
						found = true;
						break;
					} else if (chr == '?' || chr == '*' || chr == '+') {
						nonLethalError = Tokenizer.Error.NothingToRepeat;
					} else if (chr == '^') {
						if (
							inp[pos-1] != '/' && 
							inp[pos-1] != '|' && 
							inp[pos-1] != '(' &&
							!(inp[pos-3] == '(' && inp[pos-2] == '?' && (inp[pos-1] == ':' || inp[pos-1] == '!' || inp[pos-1] == '='))
						) {
							nonLethalError = Tokenizer.Error.StartOfMatchShouldBeAtStart;
						}
					} else if (chr == '$') {
						if (inp[pos+1] != '/' && inp[pos+1] != '|' && inp[pos+1] != ')') nonLethalError = Tokenizer.Error.DollarShouldBeEnd;
					} else if (chr == '}') {
						nonLethalError = Tokenizer.Error.MissingOpeningCurly;
					} else { // it's a "character" (can be group or class), something to match
						// match parenthesis
						if (chr == '(') {
							parens.push(pos-start);
						} else if (chr == ')') {
							if (parens.length == 0) {
								nonLethalError = {start:start,stop:pos,name:14/*error*/,tokenError:true,error:Tokenizer.Error.RegexNoOpenGroups};
							} else {
								var twin = parens.pop();
								var now = pos-start;
								twinfo[twin] = now;
								twinfo[now] = twin;
							}
						}
						// first process character class
						if (chr == '[') {
							var before = pos-start;
							while (++pos < inp.length && shadowInp[pos] != '\n' && inp[pos] != ']') {
								// only newline is not allowed in class range
								// anything else can be escaped, most of it does not have to be escaped...
								if (inp[pos] == '\\') {
									if (shadowInp[pos+1] == '\n') break;
									else ++pos; // skip next char. (mainly prohibits ] to be picked up as closing the group...)
								}
							} 
							if (inp[pos] != ']') {
								returnValue = {start:start,stop:pos,name:14/*error*/,tokenError:true,error:Tokenizer.Error.ClosingClassRangeNotFound};
								this.errorStack.push(returnValue);
								break;
							} else {
								var after = pos-start;
								twinfo[before] = after;
								twinfo[after] = before;
							}
						} else if (chr == '\\' && shadowInp[pos+1] != '\n') {
							// is ok anywhere in the regex (match next char literally, regardless of its otherwise special meaning)
							++pos;
						}
						
						// now process repeaters (+, ? and *)
						
						// non-collecting group (?:...) and positive (?=...) or negative (?!...) lookahead
						if (chr == '(') {
							if (inp[pos+1] == '?' && (inp[pos+2] == ':' || inp[pos+2] == '=' || inp[pos+2] == '!')) {
								pos += 2;
							}
						}
						// matching "char"
						else if (inp[pos+1] == '?') ++pos;
						else if (inp[pos+1] == '*' || inp[pos+1] == '+') {
							++pos;
							if (inp[pos+1] == '?') ++pos; // non-greedy match
						} else if (inp[pos+1] == '{') {
							pos += 1;
							var before = pos-start;
							// quantifier:
							// - {n}
							// - {n,}
							// - {n,m}
							if (!/[0-9]/.test(inp[pos+1])) {
								nonLethalError = Tokenizer.Error.QuantifierRequiresNumber;
							}
							while (++pos < inp.length && /[0-9]/.test(inp[pos+1]));
							if (inp[pos+1] == ',') {
								++pos;
								while (pos < inp.length && /[0-9]/.test(inp[pos+1])) ++pos;
							}
							if (inp[pos+1] != '}') {
								nonLethalError = Tokenizer.Error.QuantifierRequiresClosingCurly;
							} else {
								++pos;
								var after = pos-start;
								twinfo[before] = after;
								twinfo[after] = before;
								if (inp[pos+1] == '?') ++pos; // non-greedy match
							}
						}
					}
				}
				// if found=false, fail right now. otherwise try to parse an identifiername (that's all RegularExpressionFlags is..., but it's constructed in a stupid fashion)
				if (!found || returnValue) {
					if (!returnValue) {
						returnValue = {start:start,stop:pos,name:14/*error*/,tokenError:true,error:Tokenizer.Error.UnterminatedRegularExpressionOther};
						this.errorStack.push(returnValue);
					}
				} else {
					// this is the identifier scanner, for now
					do ++pos;
					while (pos < inp.length && this.hashAsciiIdentifier[inp[pos]]); /*this.regexAsciiIdentifier.test(inp[pos])*/ 
	
					if (parens.length) {
						// nope, this is still an error, there was at least one paren that did not have a matching twin
						if (parens.length > 0) returnValue = {start:start,stop:pos,name:14/*error*/,tokenError:true,error:Tokenizer.Error.RegexOpenGroup};
						this.errorStack.push(returnValue);
					} else if (nonLethalError) {
						returnValue = {start:start,stop:pos,name:14/*error*/,errorHasContent:true,tokenError:true,error:nonLethalError};
						this.errorStack.push(returnValue);
					} else {
						returnValue = {start:start,stop:pos,name:1/*REG_EX*/,isPrimitive:true};
					}				
				}
				returnValue.twinfo = twinfo;
			} else {
				// note: operators need to be ordered from longest to smallest. regex will take care of the rest.
				// no need to worry about div vs regex. if looking for regex, earlier if will have eaten it
				//var result = this.regexPunctuators.exec(inp.substring(pos,pos+4));
				
				// note: due to the regex, the single forward slash might be caught by an earlier part of the regex. so check for that.
				var result = part[8] || part[9];
				if (result) {
					//result = result[1];
					returnValue = {start:pos,stop:pos+=result.length,name:11/*PUNCTUATOR*/,value:result};
				} else {
					var found = false;
					// identifiers cannot start with a number. but if the leading string would be a number, another if would have eaten it already for numeric literal :)
					while (pos < inp.length) {
						var c = inp[pos];
	
						if (this.hashAsciiIdentifier[c]) ++pos; //if (this.regexAsciiIdentifier.test(c)) ++pos;
						else if (c == '\\' && this.regexUnicodeEscape.test(inp.substring(pos,pos+6))) pos += 6; // this is like a \uxxxx
						// ok, now test unicode ranges...
						// basically this hardly ever happens so there's little risk of this hitting performance
						// however, if you do happen to have used them, it's not a problem. the parser will support it :)
						else if (this.Unicode) { // the unicode is optional.
							// these chars may not be part of identifier. i want to try to prevent running the unicode regexes here...
							if (this.hashIdentifierStop[c] /*this.regexIdentifierStop.test(c)*/) break;
							// for most scripts, the code wont reach here. which is good, because this is going to be relatively slow :)
							var Unicode = this.Unicode; // cache
							if (!(
									// these may all occur in an identifier... (pure a specification compliance thing :)
									Unicode.Lu.test(c) || Unicode.Ll.test(c) || Unicode.Lt.test(c) || Unicode.Lm.test(c) || 
									Unicode.Lo.test(c) || Unicode.Nl.test(c) || Unicode.Mn.test(c) || Unicode.Mc.test(c) ||
									Unicode.Nd.test(c) || Unicode.Pc.test(c) || Unicode.sp.test(c)
							)) break; // end of match.
							// passed, next char
							++pos;
						} else break; // end of match.
			
						found = true;
					}
		
					if (found) {
						returnValue = {start:start,stop:pos,name:2/*IDENTIFIER*/,value:inp.substring(start,pos)};
						if (returnValue.value == 'undefined' || returnValue.value == 'null' || returnValue.value == 'true' || returnValue.value == 'false') returnValue.isPrimitive = true;
					} else {
						if (inp[pos] == '`') {
							returnValue = {start:start,stop:pos+1,name:14/*error*/,tokenError:true,error:Tokenizer.Error.BacktickNotSupported};
							this.errorStack.push(returnValue);
						} else if (inp[pos] == '\\') {
							if (inp[pos+1] == 'u') {
								returnValue = {start:start,stop:pos+1,name:14/*error*/,tokenError:true,error:Tokenizer.Error.InvalidUnicodeEscape};
								this.errorStack.push(returnValue);
							} else {
								returnValue = {start:start,stop:pos+1,name:14/*error*/,tokenError:true,error:Tokenizer.Error.InvalidBackslash};
								this.errorStack.push(returnValue);
							}
						} else {
							returnValue = {start:start,stop:pos+1,name:14/*error*/,tokenError:true,error:Tokenizer.Error.Unknown,value:c};
							this.errorStack.push(returnValue);
							// try to skip this char. it's not going anywhere.
						}
						++pos;
					}
				}
			}
			
			if (returnValue) {
				// note that ASI's are slipstreamed in here from the parser since the tokenizer cant determine that
				// if this part ever changes, make sure you change that too :)
				returnValue.tokposw = this.wtree.length;
				this.wtree.push(returnValue);
				if (!returnValue.isWhite) {
					returnValue.tokposb = this.btree.length;
					this.btree.push(returnValue);
				} 
			}
			
			
		} while (stack && returnValue && returnValue.isWhite); // WHITE_SPACE LINETERMINATOR COMMENT_SINGLE COMMENT_MULTI
		++this.tokenCountNoWhite;
		
		this.pos = pos;
	
		if (matchedNewline) returnValue.newline = true;
		return returnValue;
	},
	addTokenToStreamBefore: function(token, match){
		var wtree = this.wtree;
		var btree = this.btree;
		if (match.name == 12/*asi*/) {
			token.tokposw = wtree.length;
			wtree.push(token);
			token.tokposb = btree.length;
			btree.push(token);
		} else {
			token.tokposw = match.tokposw;
			wtree[token.tokposw] = token;
			match.tokposw += 1;
			wtree[match.tokposw] = match;

			if (match.tokposb) {
				token.tokposb = match.tokposb;
				btree[token.tokposb] = token;
				match.tokposb += 1;
				btree[match.tokposb] = match;
			}
		}
	},
	oldNumberParser: function(pos, chr, inp, returnValue, start, Tokenizer){
		++pos;
		// either: 0x 0X 0 .3
		if (chr == '0' && (inp[pos] == 'x' || inp[pos] == 'X')) {
			// parsing hex
			while (++pos < inp.length && this.hashHex[inp[pos]]); // this.regexHex.test(inp[pos]));
			returnValue = {start:start,stop:pos,name:3/*NUMERIC_HEX*/,isPrimitive:true,isNumber:true};
		} else {
			var parsingOctal = chr == '0' && inp[pos] >= '0' && inp[pos] <= '9';
			// parsing dec
			if (chr != '.') { // integer part
				while (pos < inp.length && inp[pos] >= '0' && inp[pos] <= '9') ++pos;
				if (inp[pos] == '.') ++pos;
			}
			// decimal part
			while (pos < inp.length && inp[pos] >= '0' && inp[pos] <= '9') ++pos;
			// exponent part
			if (inp[pos] == 'e' || inp[pos] == 'E') {
				if (inp[++pos] == '+' || inp[pos] == '-') ++pos;
				var expPosBak = pos;
				while (pos < inp.length && inp[pos] >= '0' && inp[pos] <= '9') ++pos;
				if (expPosBak == pos) {
					returnValue = {start:start,stop:pos,name:14/*error*/,tokenError:true,error:Tokenizer.Error.NumberExponentRequiresDigits};
					this.errorStack.push(returnValue);
				}
			}
			if (returnValue.name != 14/*error*/) {
				if (parsingOctal) {
					returnValue = {start:start,stop:pos,name:14/*error*/,isNumber:true,isOctal:true,tokenError:true,error:Tokenizer.Error.IllegalOctalEscape};
					this.errorStack.push(returnValue);
					console.log("foo")
				} else {
					returnValue = {start:start,stop:pos,name:4/*NUMERIC_DEC*/,isPrimitive:true,isNumber:true};
				}
			}
		}
		return [pos, returnValue];
	},
	tokens: function(arrx){
		arrx = arrx || [];
		var n = 0;
		var last;
		var stack = [];
		while ((last = this.storeCurrentAndFetchNextToken(!arrx[n++], false, false, true)) && last.name != 12/*EOF*/) stack.push(last);
		return stack;
	}
};

//#ifdef TEST_SUITE
Tokenizer.escape = function(s){
	return s.replace(/\n/g,'\\n').replace(/\t/g,'\\t').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\uFFFF/g, '\\uFFFF').replace(/\s/g, function(s){
		// replace whitespace as is...
		var ord = s.charCodeAt(0).toString(16);
		switch (ord.length) {
			case 1: ord = '000'+ord; break;
			case 2: ord = '00'+ord; break;
			case 3: ord = '0'+ord; break;
		}
		return '\\u'+ord;
	});
};
Tokenizer.tests = function(){
	return [
		[4 ,'var abc;', 'Variable without assignment'],
		[8 ,'var abc = 5;', 'Variable with assignment'],
		[1 ,'/* */', 'Multiline comment'],
		[1 ,'/** **/', 'Double star multiline comment'],
		[13,'var f = function(){;};', 'variable function expression'],
		[4 ,'hi; // moo', 'single line comment'],
		[6 ,'a + b;', 'addition'],
		[1 ,'\'a\'', 'single string literal'],
		[1 ,'\'a\\n\'', 'single string literal with escaped return'],
		[1 ,'"a"', 'double string literal'],
		[1 ,'"a\\n"', 'double string literal with escaped return'],
		[1 ,'500', 'int literal'],
		[1 ,'500.', 'float literal w/o decimals'],
		[1 ,'500.432', 'float literal with decimals'],
		[1 ,'.432432', 'float literal w/o int'],
		[7 ,'(a,b,c)', 'parens and comma'],
		[7 ,'[1,2,abc]', 'array literal'],
		[13,'{a:1,"b":2,c:c}', 'object literal'],
		[9 ,'var x;\nvar y;', 'two lines'],
		[13,'var x;\nfunction n(){ }', 'function def'],	
		[14,'var x;\nfunction n(abc){ }', 'function def with arg'],	
		[17,'var x;\nfunction n(abc, def){ }', 'function def with args'],
		[11,'function n(){ "hello"; }', 'function def with body'],
		[2 ,'/a/;', 'regex literal', [true,false]],
		[2 ,'/a/b;', 'regex literal with flag', [true,true]],
		[3 ,'++x;', 'prefix increment'],
		[3 ,' / /;', "regex preceeded by whitespace", [true,true,false]],
		[5 ,'/ / / / /', "classic regex case", [true,false,false,true,true]],

		// from my parser test suite

		[4 ,"var abc;", "Regular variable statement w/o assignment"],
		[8 ,"var abc = 5;", "Regular variable statement with assignment"],
		[2 ,"/* */;", "Multiline comment"],
		[2 ,'/** **/;', 'Double star multiline comment'],
		[13,"var f = function(){;};", "Function expression in var assignment"],
		[6 ,'hi; // moo\n;', 'single line comment'],
		[4 ,'var varwithfunction;', 'Dont match keywords as substrings'], // difference between `var withsomevar` and `"str"` (local search and lits)
		[6 ,'a + b;', 'addition'],
		[2 ,"'a';", 'single string literal'],
		[2 ,"'a\\n';", 'single string literal with escaped return'],
		[2 ,'"a";', 'double string literal'],
		[2 ,'"a\\n";', 'double string literal with escaped return'],
		[2 ,'"var";', 'string is a keyword'],
		[2 ,'"variable";', 'string starts with a keyword'],
		[2 ,'"somevariable";', 'string contains a keyword'],
		[2 ,'"somevar";', 'string ends with a keyword'],
		[2 ,'500;', 'int literal'],
		[2 ,'500.;', 'float literal w/o decimals'],
		[2 ,'500.432;', 'float literal with decimals'],
		[2 ,'.432432;', 'float literal w/o int'],
		[8 ,'(a,b,c);', 'parens and comma'],
		[8 ,'[1,2,abc];', 'array literal'],
		[12,'var o = {a:1};', 'object literal unquoted key'],
		[12,'var o = {"b":2};', 'object literal quoted key'], // opening curly may not be at the start of a statement...
		[12,'var o = {c:c};', 'object literal keyname is identifier'],
		[20,'var o = {a:1,"b":2,c:c};', 'object literal combinations'],
		[9 ,'var x;\nvar y;', 'two lines'],
		[14,'var x;\nfunction n(){; }', 'function def'],
		[15,'var x;\nfunction n(abc){; }', 'function def with arg'],	
		[18,'var x;\nfunction n(abc, def){ ;}', 'function def with args'],
		[11,'function n(){ "hello"; }', 'function def with body'],	
		[6 ,'/a/ / /b/;', 'regex div regex',[true,true,false,false,true,false]],
		[6 ,'a/b/c;', 'triple division looks like regex'],
		
		// line terminators
		[1 ,'\r\n', 'crlf should be one newline'],
		[1 ,'\r', 'cr should be one newline'],
		[1 ,'\n', 'crlf should be one newline'],
		[5 ,'\u000D\u000A\u000A\u2028\u2029\u000D', 'all valid line terminators'],
		
		// whitespace (could use a more thorough check)
		[8, 'a \t\u000B\u000C\u00A0\uFFFFb'],
		
		// http://code.google.com/p/es-lab/source/browse/trunk/tests/parser/parsertests.js?r=86
		// http://code.google.com/p/es-lab/source/browse/trunk/tests/parser/parsertests.js?r=430
		
		// first tests for the lexer, should also parse as program (when you append a semi)
		
		// comments
		[4 ,'//foo!@#^&$1234\nbar;', 'single line comment'],
		[2 ,'/* abcd!@#@$* { } && null*/;', 'single line multi line comment'],
		[2 ,'/*foo\nbar*/;','multi line comment'],
		[2 ,'/*x*x*/;','multi line comment with *'],
		[2 ,'/**/;','empty comment'],
		// identifiers
		[2 ,"x;",'1 identifier'],
		[2 ,"_x;",'2 identifier'],
		[2 ,"xyz;",'3 identifier'],
		[2 ,"$x;",'4 identifier'],
		[2 ,"x$;",'5 identifier'],
		[2 ,"_;",'6 identifier'],
		[2 ,"x5;",'7 identifier'],
		[2 ,"x_y;",'8 identifier'],
		[4 ,"x+5;",'9 identifier'],
		[2 ,"xyz123;",'10 identifier'],
		[2 ,"x1y1z1;",'11 identifier'],
		[2 ,"foo\\u00D8bar;",'12 identifier unicode escape'],
		[2, "f\u00D8\u00D8bar;",'13 identifier unicode embedded'],
		// numbers
		[2 ,"5;", '1 number'],
		[2 ,"5.5;", '2 number'],
		[2 ,"0;", '3 number'],
		[2 ,"0.0;", '4 number'],
		[2 ,"0.001;", '5 number'],
		[2 ,"1.e2;", '6 number'],
		[2 ,"1.e-2;", '7 number'],
		[2 ,"1.E2;", '8 number'],
		[2 ,"1.E-2;", '9 number'],
		[2 ,".5;", '10 number'],
		[2 ,".5e3;", '11 number'],
		[2 ,".5e-3;", '12 number'],
		[2 ,"0.5e3;", '13 number'],
		[2 ,"55;", '14 number'],
		[2 ,"123;", '15 number'],
		[2 ,"55.55;", '16 number'],
		[2 ,"55.55e10;", '17 number'],
		[2 ,"123.456;", '18 number'],
		[4 ,"1+e;", '20 number (additive expression)'],
		[2 ,"0x01;", '22 number'],
		[2 ,"0XCAFE;", '23 number'],
		[2 ,"0x12345678;", '24 number'],
		[2 ,"0x1234ABCD;", '25 number'],
		[2 ,"0x0001;", '26 number'],
		// strings
		[2 ,"\"foo\";", '1 string'],
		[2 ,"\'foo\';", '2 string'],
		[2 ,"\"x\";", '3 string'],
		[2 ,"\'\';", '4 string'],
		[2 ,"\"foo\\tbar\";", '5 string'],
		[2 ,"\"!@#$%^&*()_+{}[]\";", '6 string'],
		[2 ,"\"/*test*/\";", '7 string'],
		[2 ,"\"//test\";", '8 string'],
		[2 ,"\"\\\\\";", '9 string'],
		[2 ,"\"\\u0001\";", '10 string'],
		[2 ,"\"\\uFEFF\";", '11 string'],
		[2 ,"\"\\u10002\";", '12 string'],
		[2 ,"\"\\x55\";", '13 string'],
		[2 ,"\"\\x55a\";", '14 string'],
		[2 ,"\"a\\\\nb\";", '15 string'],
		[1 ,'";"', '16 string: semi in a string'],
		[2 ,'"a\\\nb";', '17 string: line terminator escape'],
		[4 ,"'\\\\'+ ''", '18 string: escape caused a problem'],
		// literals
		[2 ,"null;", "null"],
		[2 ,"true;", "true"],
		[2 ,"false;", "false"],
		// regex
		[2 ,"/a/;", "1 regex",[true,true]],
		[2 ,"/abc/;", "2 regex",[true,true]],
		[2 ,"/abc[a-z]*def/g;", "3 regex",[true,true]],
		[2 ,"/\\b/;", "4 regex",[true,true]],
		[2 ,"/[a-zA-Z]/;", "5 regex",[true,true]],
		
		// program tests (for as far as they havent been covered above)
		
		// regexp
		[2 ,"/foo(.*)/g;", "another regexp",[true,false]],
		// arrays
		[3 ,"[];", "1 array"],
		[6 ,"[   ];", "2 array"],
		[4 ,"[1];", "3 array"],
		[6 ,"[1,2];", "4 array"],
		[8, "[1,2,,];", "5 array"],
		[8, "[1,2,3];", "6 array"],
		[11,"[1,2,3,,,];", "7 array"],
		
		// objects
		[3 ,"{};", "1 object"],
		[8 ,"({x:5});", "2 object"],
		[12,"({x:5,y:6});", "3 object"],
		[9 ,"({x:5,});", "4 object"],
		[8 ,"({if:5});", "5 object"],
		[17,"({ get x() {42;} });", "6 object"],
		[18,"({ set y(a) {1;} });", "7 object"],
		// member expression
		[4 ,"o.m;", "1 member expression"],
		[5 ,"o['m'];", "2 member expression"],
		[8 ,"o['n']['m'];", "3 member expression"],
		[6 ,"o.n.m;", "4 member expression"],
		[4 ,"o.if;", "5 member expression"],
		// call and invoke expressions
		[4 ,"f();", "1 call/invoke expression"],
		[5 ,"f(x);", "2 call/invoke expression"],
		[7 ,"f(x,y);", "3 call/invoke expression"],
		[6 ,"o.m();", "4 call/invoke expression"],
		[5 ,"o['m'];", "5 call/invoke expression"],
		[7 ,"o.m(x);", "6 call/invoke expression"],
		[8 ,"o['m'](x);", "7 call/invoke expression"],
		[9 ,"o.m(x,y);", "8 call/invoke expression"],
		[10,"o['m'](x,y);", "9 call/invoke expression"],
		[8 ,"f(x)(y);", "10 call/invoke expression"],
		[6 ,"f().x;", "11 call/invoke expression"],
		
		// eval
		[5 ,"eval('x');", "1 eval"],
		[7 ,"(eval)('x');", "2 eval"],
		[9 ,"(1,eval)('x');", "3 eval"],
		[7 ,"eval(x,y);", "4 eval"],
		// new expression
		[6 ,"new f();", "1 new expression"],
		[4 ,"new o;", "2 new expression"],
		[6 ,"new o.m;", "3 new expression"],
		[9 ,"new o.m(x);", "4 new expression"],
		[11,"new o.m(x,y);", "5 new expression"],
		// prefix/postfix
		[3 ,"++x;", "1 pre/postfix"],
		[3 ,"x++;", "2 pre/postfix"],
		[3 ,"--x;", "3 pre/postfix"],
		[3 ,"x--;", "4 pre/postfix"],
		[4 ,"x ++;", "5 pre/postfix"],
		[6 ,"x /* comment */ ++;", "6 pre/postfix"],
		[6 ,"++ /* comment */ x;", "7 pre/postfix"],
		// unary operators
		[4 ,"delete x;", "1 unary operator"],
		[4 ,"void x;", "2 unary operator"],
		[4 ,"+ x;", "3 unary operator"],
		[3 ,"-x;", "4 unary operator"],
		[3 ,"~x;", "5 unary operator"],
		[3 ,"!x;", "6 unary operator"],
		// meh
		[5 ,"new Date++;", "new date ++"],
		[4 ,"+x++;", " + x ++"],
		// expression expressions
		[6 ,"1 * 2;", "1 expression expressions"],
		[6 ,"1 / 2;", "2 expression expressions"],
		[6 ,"1 % 2;", "3 expression expressions"],
		[6 ,"1 + 2;", "4 expression expressions"],
		[6 ,"1 - 2;", "5 expression expressions"],
		[6 ,"1 << 2;", "6 expression expressions"],
		[6 ,"1 >>> 2;", "7 expression expressions"],
		[6 ,"1 >> 2;", "8 expression expressions"],
		[10,"1 * 2 + 3;", "9 expression expressions"],
		[8 ,"(1+2)*3;", "10 expression expressions"],
		[8 ,"1*(2+3);", "11 expression expressions"],
		[4 ,"x<y;", "12 expression expressions"],
		[4 ,"x>y;", "13 expression expressions"],
		[4 ,"x<=y;", "14 expression expressions"],
		[4 ,"x>=y;", "15 expression expressions"],
		[6 ,"x instanceof y;", "16 expression expressions"],
		[6 ,"x in y;", "17 expression expressions"],
		[4 ,"x&y;", "18 expression expressions"],
		[4 ,"x^y;", "19 expression expressions"],
		[4 ,"x|y;", "20 expression expressions"],
		[6 ,"x+y<z;", "21 expression expressions"],
		[6 ,"x<y+z;", "22 expression expressions"],
		[6 ,"x+y+z;", "23 expression expressions"],
		[6 ,"x+y<z;", "24 expression expressions"],
		[6 ,"x<y+z;", "25 expression expressions"],
		[6 ,"x&y|z;", "26 expression expressions"],
		[4 ,"x&&y;", "27 expression expressions"],
		[4 ,"x||y;", "28 expression expressions"],
		[6 ,"x&&y||z;", "29 expression expressions"],
		[6 ,"x||y&&z;", "30 expression expressions"],
		[8 ,"x<y?z:w;", "31 expression expressions"],
		// assignment
		[6 ,"x >>>= y;", "1 assignment"],
		[6 ,"x <<= y;", "2 assignment"],
		[6 ,"x = y;", "3 assignment"],
		[6 ,"x += y;", "4 assignment"],
		[6 ,"x /= y;", "5 assignment"],
		// comma
		[5 ,"x, y;", "comma"],
		// block
		[3 ,"{};", "1 block"],
		[5 ,"{x;};", "2 block"],
		[7 ,"{x;y;};", "3 block"],
		// vars
		[4 ,"var x;", "1 var"],
		[6 ,"var x,y;", "2 var"],
		[10,"var x=1,y=2;", "3 var"],
		[8 ,"var x,y=2;", "4 var"],
		// empty
		[1 ,";", "1 empty"],
		[2 ,"\n;", "2 empty"],
		// expression statement
		[2 ,"x;", "1 expression statement"],
		[2 ,"5;", "2 expression statement"],
		[4 ,"1+2;", "3 expression statement"],
		// if
		[13,"if (c) x; else y;", "1 if statement"],
		[8 ,"if (c) x;", "2 if statement"],
		[14,"if (c) {} else {};", "3 if statement"],
		[19,"if (c1) if (c2) s1; else s2;", "4 if statement"],
		// while
		[11,"do s; while (e);", "1 while statement"],
		[15,"do { s; } while (e);", "2 while statement"],
		[8 ,"while (e) s;", "3 while statement"],
		[13,"while (e) { s; };", "4 while statement"],
		// for
		[8 ,"for (;;) ;", "1 for statement"],
		[12,"for (;c;x++) x;", "2 for statement"],
		[15,"for (i;i<len;++i){};", "3 for statement"],
		[20,"for (var i=0;i<len;++i) {};", "4 for statement"],
		[18,"for (var i=0,j=0;;){};", "5 for statement"],
		//["for (x in b; c; u) {};", "6 for statement"],
		[21,"for ((x in b); c; u) {};", "7 for statement"],
		[10,"for (x in a);", "8 for statement"],
		[14,"for (var x in a){};", "9 for statement"],
		[17,"for (var x=5 in a) {};", "10 for statement"],
		[23,"for (var x = a in b in c) {};", "11 for statement"],
		[29,"for (var x=function(){a+b;}; a<b; ++i) some;", "11 for statement, testing for parsingForHeader reset with the function"],
		[48,"for (var x=function(){for (x=0; x<15; ++x) alert(foo); }; a<b; ++i) some;", "11 for statement, testing for parsingForHeader reset with the function"],
		// flow statements
		[2 ,"continue;", "1 flow statement"],
		[4 ,"continue label;", "2 flow statement"],
		[2 ,"break;", "3 flow statement"],
		[4 ,"break somewhere;", "4 flow statement"],
		[5 ,"continue /* comment */ ;", "5 flow statement"],
		[4 ,"continue \n;", "6 flow statement"],
		[2 ,"return;", "7 flow statement"],
		[4 ,"return 0;", "8 flow statement"],
		[10,"return 0 + \n 1;", "9 flow statement"],
		// with
		[8 ,"with (e) s;", "with statement"],
		// switch
		[18,"switch (e) { case x: s; };", "1 switch statement"],
		[34,"switch (e) { case x: s1;s2; default: s3; case y: s4; };", "2 switch statement"],
		[32,"switch (e) { default: s1; case x: s2; case y: s3; };", "3 switch statement"],
		[16,"switch (e) { default: s; };", "4 switch statement"],
		[26,"switch (e) { case x: s1; case y: s2; };", "5 switch statement"],
		// labels
		[6 ,"foo : x;", " flow statement"],
		// throw
		[4 ,"throw x;", "1 throw statement"],
		[5 ,"throw x\n;", "2 throw statement"],
		// try catch finally
		[22,"try { s1; } catch (e) { s2; };", "1 trycatchfinally statement"],
		[18,"try { s1; } finally { s2; };", "2 trycatchfinally statement"],
		[31,"try { s1; } catch (e) { s2; } finally { s3; };", "3 trycatchfinally statement"],
		// debugger
		[2 ,"debugger;", "debuger statement"],
		// function decl
		[19,"function f(x) { e; return x; };", "1 function declaration"],
		[16,"function f() { x; y; };", "2 function declaration"],
		[23,"function f(x,y) { var z; return x; };", "3 function declaration"],
		// function exp
		[18,"(function f(x) { return x; });", "1 function expression"],
		[12,"(function empty() {;});", "2 function expression"],
		[13,"(function (x) {; });", "3 function expression"],
		// program
		[17,"var x; function f(){;}; null;", "1 program"],
		[2 ,";;", "2 program"],
		[12,"{ x; y; z; }", "3 program"],
		[17,"function f(){ function g(){;}};", "4 program"],
		[7 ,"x;\n/*foo*/\n	;", "5 program"],
	
		// asi
		[6 ,"continue \n foo;", "1 asi"],
		[6 ,"break \n foo;", "2 asi"],
		[4 ,"return\nfoo;", "3 asi"],
		[16,"var x; { 1 \n 2 } 3", "4 asi"],
		[7 ,"ab 	 /* hi */\ncd", "5 asi"],
		[3 ,"ab/*\n*/cd", "6 asi (multi line multilinecomment counts as eol)"],
		[6 ,"continue /* wtf \n busta */ foo;", "7 asi illegal with multi line comment"],
		[11,"function f() { s }", "8 asi"],
		[11,"function f() { return }", "9 asi"],
		// use strict
		[9 ,'"use strict"; \'bla\'\n; foo;', "1 directive"],
		[20,'(function() { "use strict"; \'bla\';\n foo; });', "2 directive"],
		[2 ,'"use\\n strict";', "3 directive"],
		[5 ,'foo; "use strict";', "4 directive"],
		
		// tests from http://es5conform.codeplex.com/
		
		[17,'"use strict"; var o = { eval: 42};', "8.7.2-3-1-s: the use of eval as property name is allowed"],
		[12,'({foo:0,foo:1});', 'Duplicate property name allowed in not strict mode'],
		[10,'function foo(a,a){}', 'Duplicate parameter name allowed in not strict mode'],
		[10,'(function foo(eval){})', 'Eval allowed as parameter name in non strict mode'],
		[10,'(function foo(arguments){})', 'Arguments allowed as parameter name in non strict mode'],
		
		// empty programs
		
		[0 ,'', '1 Empty program'],
		[1 ,'// test', '2 Empty program'],
		[2 ,'//test\n', '3 Empty program'],
		[2 ,'\n// test', '4 Empty program'],
		[3 ,'\n// test\n', '5 Empty program'],
		[1 ,'/* */', '6 Empty program'],
		[1 ,'/*\ns,fd\n*/', '7 Empty program'],
		[2 ,'/*\ns,fd\n*/\n', '8 Empty program'],
		[3 ,'  	', '9 Empty program'],
		[8 ,'  /*\nsmeh*/	\n   ', '10 Empty program'],
		
		// trailing whitespace
		
		[3 ,'a  ', '1 Trailing whitespace'],
		[3 ,'a /* something */', '2 Trailing whitespace'],
		[4 ,'a\n	// hah', '3 Trailing whitespace'],
		[2 ,'/abc/de//f', '4 Trailing whitespace',[true,true]],
		[4 ,'/abc/de/*f*/\n	', '5 Trailing whitespace',[true,true,true,true]],
		
		// things the parser tripped over at one point or the other (prevents regression bugs)
		[21,'for (x;function(){ a\nb };z) x;', 'for header with function body forcing ASI'],
		[11,'c=function(){return;return};', 'resetting noAsi after literal'],
		[5 ,'d\nd()', 'asi exception causing token overflow'],
		[14,'for(;;){x=function(){}}', 'function expression in a for header'],
		[10,'for(var k;;){}', 'parser failing due to ASI accepting the incorrect "for" rule'],
		[12,'({get foo(){ }})', 'getter with empty function body'],
		[2 ,'\nreturnr', 'eol causes return statement to ignore local search requirement'],
		[2 ,' / /', '1 whitespace before regex causes regex to fail?',[true,true]],
		[4 ,'/ // / /', '2 whitespace before regex causes regex to fail?',[true,false,false,true]],
		[5 ,'/ / / / /', '3 whitespace before regex causes regex to fail?',[true,false,false,false,true]],
		[6 ,'trimRight = /\\s+$/;', 'some regular expression the tokenizer tripped over at some point',[false,false,false,false,true,false]],
		[14,'trimLeft = /^\\s+/;\n\ttrimRight = /\\s+$/;', 'longest test case of the above',[false,false,false,false,true,false,false,false,false,false,false,false,true,false]],
		[21,'\n\t// Used for trimming whitespace\n\ttrimLeft = /^\\s+/;\n\ttrimRight = /\\s+$/;\t\n','even longer',[false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,true,false,false]],
		[2 ,'/[\\/]/;', 'escaped forward slash inside class group (would choke on fwd slash)', [true,false]],
		[2 ,'/[/]/;', 'just to make sure', [true,false]],
		[25,'this.charsX = Gui.getSize(this.textarea).w / this.fontSize.w;', 'regex mixup?'],
		[9 ,'(x)/ (y);','div followed by space and paren'],
		
		[1 ,'/^(?:\\/(?![*\\n\\/])(?:\\[(?:\\\\.|[^\\]\\\\\\n])*\\]|\\\\.|[^\\[\\/\\\\\\n])+\\/[gim]*)$/', 'tmp', [true]]
		// ({a:b}[ohi].iets()++)
		
	];
};
Tokenizer.testSuite = function(){
	var arr = Tokenizer.tests();
	
	var out = document.createElement('pre');
	document.body.appendChild(out);
	var debug = function(){
		var f = document.createElement('div');
		f.innerHTML = Array.prototype.slice.call(arguments).join(' ');
		out.appendChild(f);
		return arguments[0];
	};

	debug("Running test suite...",arr.length,"tests");
	debug(' ');
	var start = +new Date;
	var ok = 0;
	var fail = 0;
	for (var i=0; i<arr.length; ++i) {
		var result = new Tokenizer(arr[i][1]).tokens(arr[i][3]);
		if (result.length == arr[i][0]) {
			debug('<span class="green">Test '+i+' ok:</span>',arr[i][2]);
			++ok;
		} else {
			debug('<b class="red">Test failed:</span>',arr[i][2],'(found',result.length,'expected',arr[i][0]+')'),console.log(arr[i][2], result);
			++fail;
		}
		debug('<b>'+Tokenizer.escape(arr[i][1])+'</b>');
		debug('<br/>');
	}
	debug("Tokenizer test suite finished ("+(+new Date - start)+' ms). ok:'+ok+', fail:'+fail);
};
//#endif

Tokenizer.regexWhiteSpace = /[ \t\u000B\u000C\u00A0\uFFFF]/;
Tokenizer.regexLineTerminator = /[\u000A\u000D\u2028\u2029]/;
Tokenizer.regexAsciiIdentifier = /[a-zA-Z0-9\$_]/;
Tokenizer.hashAsciiIdentifier = {_:1,$:1,a:1,b:1,c:1,d:1,e:1,f:1,g:1,h:1,i:1,j:1,k:1,l:1,m:1,n:1,o:1,p:1,q:1,r:1,s:1,t:1,u:1,v:1,w:1,x:1,y:1,z:1,A:1,B:1,C:1,D:1,E:1,F:1,G:1,H:1,I:1,J:1,K:1,L:1,M:1,N:1,O:1,P:1,Q:1,R:1,S:1,T:1,U:1,V:1,W:1,X:1,Y:1,Z:1,0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1};
Tokenizer.regexHex = /[0-9A-Fa-f]/;
Tokenizer.hashHex = {0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,a:1,b:1,c:1,d:1,e:1,f:1,A:1,B:1,C:1,D:1,E:1,F:1};
Tokenizer.regexUnicodeEscape = /u[0-9A-Fa-f]{4}/; // the \ is already checked at usage...
Tokenizer.regexIdentifierStop = /[\>\=\!\|\<\+\-\&\*\%\^\/\{\}\(\)\[\]\.\;\,\~\?\:\ \t\n\\\'\"]/; 
Tokenizer.hashIdentifierStop = {'>':1,'=':1,'!':1,'|':1,'<':1,'+':1,'-':1,'&':1,'*':1,'%':1,'^':1,'/':1,'{':1,'}':1,'(':1,')':1,'[':1,']':1,'.':1,';':1,',':1,'~':1,'?':1,':':1,'\\':1,'\'':1,'"':1,' ':1,'\t':1,'\n':1};
Tokenizer.regexNewline = /\n/g;
//Tokenizer.regexPunctuators = /^(>>>=|===|!==|>>>|<<=|>>=|<=|>=|==|!=|\+\+|--|<<|>>|\&\&|\|\||\+=|-=|\*=|%=|\&=|\|=|\^=|\/=|\{|\}|\(|\)|\[|\]|\.|;|,|<|>|\+|-|\*|%|\||\&|\||\^|!|~|\?|:|=|\/)/;
Tokenizer.Unidocde = window.Unicode;
Tokenizer.regexNumber = /^(?:(0[xX][0-9A-Fa-f]+)|((?:(?:(?:(?:[0-9]+)(?:\.[0-9]*)?))|(?:\.[0-9]+))(?:[eE][-+]?[0-9]{1,})?))/;
Tokenizer.regexNormalizeNewlines = /(\u000D[^\u000A])|[\u2028\u2029]/;

//							1 ws							2 lt				   3 scmt 4 mcmt 5/6 str 7 nr     8 rx  9 punc
Tokenizer.regexBig = /^([ \t\u000B\u000C\u00A0\uFFFF])?([\u000A\u000D\u2028\u2029])?(\/\/)?(\/\*)?(')?(")?(\.?[0-9])?(?:(\/)[^=])?(>>>=|===|!==|>>>|<<=|>>=|<=|>=|==|!=|\+\+|--|<<|>>|\&\&|\|\||\+=|-=|\*=|%=|\&=|\|=|\^=|\/=|\{|\}|\(|\)|\[|\]|\.|;|,|<|>|\+|-|\*|%|\||\&|\||\^|!|~|\?|:|=|\/)?/;
Tokenizer.regexBigAlt = /([ \t\u000B\u000C\u00A0\uFFFF])?([\u000A\u000D\u2028\u2029])?(\/\/)?(\/\*)?(')?(")?(\.?[0-9])?(?:(\/)[^=])?(>>>=|===|!==|>>>|<<=|>>=|<=|>=|==|!=|\+\+|--|<<|>>|\&\&|\|\||\+=|-=|\*=|%=|\&=|\|=|\^=|\/=|\{|\}|\(|\)|\[|\]|\.|;|,|<|>|\+|-|\*|%|\||\&|\||\^|!|~|\?|:|=|\/)?/g;

Tokenizer.Error = {
	UnterminatedSingleStringNewline: {msg:'Newlines are not allowed in string literals'},
	UnterminatedSingleStringOther: {msg:'Unterminated single string'},
	UnterminatedDoubleStringNewline: {msg:'Newlines are not allowed in string literals'},
	UnterminatedDoubleStringOther: {msg:'Unterminated double string'},
	UnterminatedRegularExpressionNewline: {msg:'Newlines are not allowed in regular expressions'},
	NothingToRepeat: {msg:'Used a repeat character (*?+) in a regex without something prior to it to match'},
	ClosingClassRangeNotFound: {msg: 'Unable to find ] for class range'},
	RegexOpenGroup: {msg: 'Open group did not find closing parenthesis'},
	RegexNoOpenGroups: {msg: 'Closing parenthesis found but no group open'},
	UnterminatedRegularExpressionOther: {msg:'Unterminated regular expression'},
	UnterminatedMultiLineComment: {msg:'Unterminated multi line comment'},
	UnexpectedIdentifier: {msg:'Unexpected identifier'},
	IllegalOctalEscape: {msg:'Octal escapes are not valid'},
	Unknown: {msg:'Unknown input'}, // if this happens, my parser is bad :(
	NumberExponentRequiresDigits: {msg:'Numbers with exponents require at least one digit after the `e`'},
	BacktickNotSupported: {msg:'The backtick is not used in js, maybe you copy/pasted from a fancy site/doc?'},
	InvalidUnicodeEscape: {msg:'Encountered an invalid unicode escape, must be followed by exactly four hex numbers'},
	InvalidBackslash: {msg:'Encountered a backslash where it not allowed'},
	StartOfMatchShouldBeAtStart: {msg: 'The ^ signifies the start of match but was not found at a start'},
	DollarShouldBeEnd: {msg: 'The $ signifies the stop of match but was not found at a stop'},
	QuantifierRequiresNumber: {msg:'Quantifier curly requires at least one digit before the comma'},
	QuantifierRequiresClosingCurly: {msg:'Quantifier curly requires to be closed'},
	MissingOpeningCurly: {msg:'Encountered closing quantifier curly without seeing an opening curly'}
};