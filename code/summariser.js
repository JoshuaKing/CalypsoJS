function Token(type, value) {
	this.token = type;
	this.value = value;
}

var TokenCounter = new (function() {
	this.count = 0;
	
	this.increment = function() {
		this.count++;
	}
	
	this.get = function() {
		return this.count;
	}
	
	this.reset = function() {
		this.count = 0;
	}
})();

Tok = {
	CONTRACTION: {k:"CONTRACTION", r:/^([a-z]+-[a-z]+)[\W_]/i},
	WORD: {k:"WORD", r:/^([a-z']+)[\W_]/i},
	FLOAT: {k:"FLOAT", r:/^([0-9]+\.[0-9]+)[\W_]/i},
	NUMBER: {k:"NUMBER", r:/^([0-9]+)[\W_]/},
	ALIAS: {k:"ALIAS", r:/^([\w-]+)[\W]/i},
	QUOTE: {k:"QUOTE", r:/^("|''|``)/},
	STARTPAREN: {k:"STARTPAREN", r:/^(\()/},
	ENDPAREN: {k:"ENDPAREN", r:/^(\))/},
	SPACE: {k:"SPACE", r:/^([ ]+)/},
	COMMA: {k:"[,]", r:/^(,)/},
	COLON: {k:"[:]", r:/^(:)/},
	SEMICOLON: {k:"[;]", r:/^(;)/},
	PERIOD: {k:"[.]", r:/^(\.)/},
	EXCLAMATION: {k:"[!]", r:/^(!)/},
	QUESTION: {k:"[?]", r:/^(\?)/},
	SLASH: {k:"SLASH", r:/^(\/)/},
	EOL: {k:"EOL", r:/^([\s]+)/},
	UNKNOWN: {k:"UNKNOWN", v:"UNKNOWN", r:/(.)/},
	GENWORD: {k:"GENERATEDWORD"},
	INVALID: {k:"INVALID", v:"INVALID"}
}

SenSym = {
	QUOTATION: "QUOTATION",
	ODDWORD: "ODDWORD",
	BRACKETQUOTE: "BRACKETQUOTE",
//	URI: "URI",
//	DOMAIN: "DOMAIN",
	URL: "URL",
	TOKEN: "TOKEN",
	END: "ENDOFSENTENCE"
}

function TokenList() {
	this.tokens = new Array();
	
	this.addToken = function(token) {
		this.tokens.push(token);
	}
	
	this.getTokens = function() {
		return this.tokens;
	}
	
	this.getToken = function(pos) {
		return this.tokens[pos];
	}
	
	this.getLength = function() {
		return this.tokens.length;
	}
}

function SentenceStructure() {
	this.paragraph = new Array();
	
	this.addSymbol = function(symbol, value) {
		this.paragraph.push(new Token(symbol, value));
	}
	
	this.getStructure = function() {
		return this.paragraph;
	}
	
	this.contains = function(symbol) {
		for (var i = 0; i < paragraph.length; i++) {
			if (paragraph[i].token == symbol) return true;
		}
		return false;
	}
}

// Remove Later //
function log(str) {
	var d = document.getElementById("summary-debug");
	var br = "<br/>";
	if (d.innerHTML == "") br = "";
	d.innerHTML = d.innerHTML + br + str;
}

function outputTokens(tokens) {
	arr = tokens.getTokens();
	log("Tokens:");
	for (i = 0; i < arr.length; i++) {
		log(arr[i].token.k + ": " + arr[i].value);
	}
	log ("Done.");
}

function outputStructure(struct, depth, maxdepth) {
	var sentence = "[DEPTH " + depth + "] ";
	var symbols = struct.getStructure();
	for (var i = 0; i < symbols.length; i++) {
		if (symbols[i].token == SenSym.BRACKETQUOTE || symbols[i].token == SenSym.QUOTATION) {
			if (maxdepth < 0 || depth < maxdepth) {
				sentence += outputStructure(symbols[i].value, depth + 1);
				sentence += "[/DEPTH " + (depth + 1) + "]";
			}
		} else if (symbols[i].token == SenSym.TOKEN && symbols[i].value.token == Tok.EOL) {
			sentence += " [EOL] ";
		} else {
			sentence += symbols[i].value.value;
		}
	}
	if (depth == 0) log(sentence);
	return sentence;
}

function Summariser() {
	// Parameters //
	this.string = "";
	this.s_array = new Array();
	this.s_importance = new Array();
	this.response = "";
	this.tokens = new TokenList();
	TokenCounter.reset();
	
	this.setString = function(strings) {
		this.string = strings;
	}
	
	this.getString = function() {
		return this.string;
	}
	
	this.match = function(reg) {
		var m = this.string.match(reg);
		if (m != null) return m[1];
		return false;
	}
	
	this.tokenize = function() {
		// Firstly, replace safe HTML entities //
		var oldstr = this.string;
		this.string = this.string.replace(/<\/?br\/?>/gi, "\n");
		this.string = this.string.replace(/<\/p>/gi, "\n");
		
		// Replace any HTML tags left //
		this.string = this.string.replace(/<[^>]*>/g, "");
		this.string = this.string.replace(/[<>]/g, "");
	
		var m = null;
		var done = false;
		
		// Tokenize a word at a time //
		while (!done && this.string.length > 0) {
			done = true;
			m = null;
			
			for (s in Tok) {
				if (m = this.match(Tok[s].r)) {
					this.tokens.addToken(new Token(Tok[s], m));
					done = false;
					break;
				}
			}
			if (!done) this.string = this.string.substr(m.length);
		}
		
		// For debug purposes //
		//outputTokens(this.tokens);
		log("Next 10 characters: \"" + this.string.substr(0, 10) + "\"");
		this.string = oldstr;
	}
	
	this.construct_url = function(offset) {
		/*if (!this.tokens.getToken(offset).value.match(/^https?|ftp$/i)) return false;
		if (this.tokens.getToken(offset + 1).value.token != Tok.COLON) return false;
		if (this.tokens.getToken(offset + 2).value.token != Tok.SLASH) return false;
		if (this.tokens.getToken(offset + 3).value.token != Tok.SLASH) return false;
		*/
		var url = "";
		for (var i = 0; offset + i < this.tokens.getLength(); i++) {
			var val = this.tokens.getToken(offset + i).value;
			if (!val.match(/^[a-z0-9-._~!$&+,;=:%\/?#]+$/i)) break;
			url += val;
		}
		
		var dot = url.indexOf('.');
		if (dot <= 0 || dot >= url.length - 2) return false;
		
		var endToken = this.tokens.getToken(offset + i - 1).token;
		if (endToken == Tok.QUESTION || endToken == Tok.PERIOD || endToken == Tok.EXCLAMATION) {
			return offset + i - 1;
		}
		return offset + i;
	}
	
	this.safe = function(count) {
		if (this.tokens.getLength() == 0) return false;
		if (TokenCounter.get() + count < 0) return false;
		if (TokenCounter.get() + count >= this.tokens.getLength()) return false;
		return true;
	}
	
	this.sentence_tokenize = function(startWith, endby) {
		// Slightly higher level //
		// - Create block quotes
		// - Create bracket quotes
		// - Detect URIs and Domains
		// - Detect which periods to split on
		var startSection = false;
		var ss = new SentenceStructure();
		if (startWith) ss = startWith;
		
		while (TokenCounter.get() < this.tokens.getLength()) {
			var offset = TokenCounter.get();
			var tok = this.tokens.getToken(offset);
			TokenCounter.increment();
			
			// End Token eg. " or ) //
			if (tok.token == endby) {
				ss.addSymbol(SenSym.TOKEN, tok);
				return ss;
			
			// Starting Parenthesis (xyz) //
			} else if (tok.token == Tok.STARTPAREN) {
				var ss2 = new SentenceStructure();
				ss2.addSymbol(SenSym.TOKEN, tok);
				ss.addSymbol(SenSym.BRACKETQUOTE, this.sentence_tokenize(ss2, Tok.ENDPAREN));
			
			// URL to look at //
			} else if (urlsize = this.construct_url(offset)) {
				var url = tok.value;
				for (; TokenCounter.get() < urlsize; TokenCounter.increment())
					url += this.tokens.getToken(TokenCounter.get()).value; 
				ss.addSymbol(SenSym.URL, new Token(Tok.GENWORD, url));
				
				var next = this.tokens.getToken(TokenCounter.get()).token;
				if (next == Tok.PERIOD || next == Tok.QUESTION || next == Tok.QUESTION) {
					ss.addSymbol(SenSym.TOKEN, this.tokens.getToken(TokenCounter.get()));
					ss.addSymbol(SenSym.TOKEN, new Token(Tok.EOL, "GENEOL"));
					TokenCounter.increment();
				}
			
			// Starting Quote "xyz" //
			} else if (tok.token == Tok.QUOTE) {
				var ss2 = new SentenceStructure();
				ss2.addSymbol(SenSym.TOKEN, tok);
				ss.addSymbol(SenSym.QUOTATION, this.sentence_tokenize(ss2, Tok.QUOTE));
			
			// Period (.) - possibilities are endless. //
			} else if (tok.token == Tok.PERIOD) {
				// Previous Symbols //
				if (this.safe(-2)) prev = this.tokens.getToken(TokenCounter.get() - 2);
				
				// Next symbols //
				if (this.safe(0)) next = this.tokens.getToken(TokenCounter.get());
				if (this.safe(1)) next2 = this.tokens.getToken(TokenCounter.get() + 1);
				
				// Period determining //
				if (next && next.token == Tok.EOL) {
					ss.addSymbol(SenSym.TOKEN, tok);
				} else if (prev && prev.value.match(/^[A-Z]+[a-zA-Z]{0,2}$/)) {
					ss.addSymbol(SenSym.TOKEN, tok);
				} else if (next && next.token == Tok.SPACE && next2 && next2.value.match(/^[a-z0-9]/)) {
					ss.addSymbol(SenSym.TOKEN, tok);
				} else {
					ss.addSymbol(SenSym.TOKEN, tok);
					ss.addSymbol(SenSym.TOKEN, new Token(Tok.EOL, "GENEOL"));
				}
			
			// Less-ambiguous question or exclamation mark //
			} else if (tok.token == Tok.QUESTION || tok.token == Tok.EXCLAMATION) {
				ss.addSymbol(SenSym.TOKEN, tok);
				ss.addSymbol(SenSym.TOKEN, new Token(Tok.EOL, "GENEOL"));
			
			// Other Symbol, like a normal word, number, or punctuation etc //
			} else {
				ss.addSymbol(SenSym.TOKEN, tok);
			}
		}
		return ss;	// Finished token set
	}
	
	this.remove_brackets = function() {
		first = 0;
		last = 0;
		deleting = 0;
		this.string = this.string.replace(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/g, "");
		this.string = this.string.replace(/\(.*?\)/g, "");	// replace contents of parenthesis
		this.string = this.string.replace(/{.*?}/g, "");	// replace contents of curly braces
		this.string = this.string.replace(/\[.*?\]/g, "");	// replace contents of square braces
		this.string = this.string.replace(/\n/g, "<br>");
		this.string = this.string.replace(/[<]\/?br\/?[>]/g, ".");
		this.string = this.string.replace(/([^.])[<][/]p[>]/g, "$1.</p>");
		this.string = this.string.replace(/\\/g,"");

		// remove all html //
		this.string = this.string.replace(/<[^>]+(>|$)/g, "");
		// remove any remaining left-over angle brackets, just in case //
		this.string = this.string.replace(/[<>]/g, "");
		
		return this.string;
	}
	
	this.s_split = function() {
		this.string = this.string.replace(/([0-9]+)[.]([0-9]+)/g, "[$1:$2]");	// remove decimal points from being counted
		this.s_array = this.string.split(/[.?!]/);
		seperators = this.string.replace(/[^.!?]/g, '');
		numsentences = this.s_array.length;
		
		// Add separators back in //
		for (i = 0; i < this.s_array.length && i < seperators.length; i++) {
			this.s_array[i] += seperators[i];
		}
		for (j = i; i < numsentences; i++) {
			if (this.s_array[j].match(/[a-zA-Z]+/) == null) this.s_array.splice(j,1);
		}
		
		return numsentences;
	}

	this.map = function(ss) {
		ss = ss.getStructure();
		var count = new Array();
		for (var i = 0; i < ss.length; i++) {
			if (ss[i].token == SenSym.TOKEN) {
				t = ss[i].value;
				if (t.token == Tok.WORD || t.token == Tok.CONTRACTION) {
					if (count[t.value]) count[t.value]++;
					else count[t.value] = 1;
				}
			} else if (ss[i].token == SenSym.BRACKETQUOTE || ss[i].token == SenSym.QUOTATION) {
				// Go deeper
			} else {
				// URL's, EOL's, etc
			}
		}
		
		return count;
	}
	
	this.sentence_reduce(ss, counts) {
		ss = ss.getStructure();
		for (var i = 0; i < ss.length; i++) {
			// Score each sentence - store info on sentences (start/end)
		}
	}
	
	this.reduce = function(words, sent) {
		counts = new Array();
		allWords = new Array();
		
		// Convert to 1D //
		for(var i = 0; i < words.length; i++) {
			allWords = allWords.concat(words[i]);
		}
		
		while (allWords.length > 0) {
			var word = allWords[0];
			var index = 0;
			
			counts[word] = 1;
			allWords.shift();
			while ((index = allWords.indexOf(word)) >= 0) {
				counts[word]++;
				allWords.splice(index, 1);
			}
		}
		
		var scores = new Array();
		for (sentence = 0; sentence < words.length; sentence++) {
			scores[sentence] = 0;
			for (i = 0; i < words[sentence].length; i++) {
				w = words[sentence][i];
				scores[sentence] += counts[w];
			}
		}

		// Sort //
		var sortable = [];
		for (var i = 0; i < words.length; i++) {
			if (words[i].length > 3)
			sortable.push([this.s_array[i], i, scores[i], scores[i] / words[i].length]);
		}
		sortable.sort(function(a, b) {return a[3] - b[3]});	// sort on normalised value
				
		var rated = new Array();
		for (i = 0; i < Math.ceil(sent); i++) {
			rated.push(sortable[i][1]);
		}
		if (words[0].length > 3 && rated.indexOf(0) < 0) {
			rated.pop();
			rated.push(0);
		}
		
		return rated.sort(function(a,b){return a-b});
	}
	
	this.summarise = function(sent) {
		words = new Array();
		sentleng = this.s_array.length;
		if (sentleng > 100)
			sentleng = 100;
		for (i = 0; i < sentleng; i++) {
			this.s_importance[i] = 0;
			words[i] = str_word_count(this.s_array[i], 1);
			for (p = 0; p < words[i].length; p++) {
				words[i][p].replace(/[.!?]/g, "");
			}
		}
		
		/*for (i = 0; i < sentleng; i++) {
			for (p = 0; p < sentleng; p++) {
				for (li = 0; li < words[p].length; li++) {
				    
					if (this.s_array[i].indexOf(words[p][li]) >= 0) {
						this.s_importance[i]++;
					}
				}
			}
		}*/
		if (sent > this.s_array.length) 
			sent = this.s_array.length;
	
		rated = this.reduce(words, sent);
		
		this.response = "";
		for (i = 0; i < rated.length; i++) {
			this.response += this.s_array[rated[i]].replace(/\[([0-9]):([0-9])\]/, "$1.$2");	// add decimal points back in
			if (i < rated.length - 1 && rated[i] == rated[i+1] - 1) {
				this.response += " ";	// The next sentence happens to be the next in paragraph
			} else if (i < rated.length - 1) {
				this.response += "<br/>";	// Sentence or more may separate the two
			}
		}
		return this.response;
	}
}

/* From PHP JS: http://phpjs.org/functions/str_word_count/ */
function str_word_count(str, format, charlist) {
  // http://kevin.vanzonneveld.net
  // +   original by: Ole Vrijenhoek
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
  // +   input by: Bug?
  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
  // +   improved by: Brett Zamir (http://brett-zamir.me)
  // -   depends on: ctype_alpha
  // *     example 1: str_word_count("Hello fri3nd, you're\r\n       looking          good today!", 1);
  // *     returns 1: ['Hello', 'fri', 'nd', "you're", 'looking', 'good', 'today']
  // *     example 2: str_word_count("Hello fri3nd, you're\r\n       looking          good today!", 2);
  // *     returns 2: {0: 'Hello', 6: 'fri', 10: 'nd', 14: "you're", 29: 'looking', 46: 'good', 51: 'today'}
  // *     example 3: str_word_count("Hello fri3nd, you're\r\n       looking          good today!", 1, '\u00e0\u00e1\u00e3\u00e73');
  // *     returns 3: ['Hello', 'fri3nd', 'youre', 'looking', 'good', 'today']
  var len = str.length,
    cl = charlist && charlist.length,
    chr = '',
    tmpStr = '',
    i = 0,
    c = '',
    wArr = [],
    wC = 0,
    assoc = {},
    aC = 0,
    reg = '',
    match = false;

  // BEGIN STATIC
  var _preg_quote = function (str) {
    return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<>\|\:])/g, '\\$1');
  },
    _getWholeChar = function (str, i) { // Use for rare cases of non-BMP characters
      var code = str.charCodeAt(i);
      if (code < 0xD800 || code > 0xDFFF) {
        return str.charAt(i);
      }
      if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        if (str.length <= (i + 1)) {
          throw 'High surrogate without following low surrogate';
        }
        var next = str.charCodeAt(i + 1);
        if (0xDC00 > next || next > 0xDFFF) {
          throw 'High surrogate without following low surrogate';
        }
        return str.charAt(i) + str.charAt(i + 1);
      }
      // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
      if (i === 0) {
        throw 'Low surrogate without preceding high surrogate';
      }
      var prev = str.charCodeAt(i - 1);
      if (0xD800 > prev || prev > 0xDBFF) { // (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        throw 'Low surrogate without preceding high surrogate';
      }
      return false; // We can pass over low surrogates now as the second component in a pair which we have already processed
    };
  // END STATIC
  if (cl) {
    reg = '^(' + _preg_quote(_getWholeChar(charlist, 0));
    for (i = 1; i < cl; i++) {
      if ((chr = _getWholeChar(charlist, i)) === false) {
        continue;
      }
      reg += '|' + _preg_quote(chr);
    }
    reg += ')$';
    reg = new RegExp(reg);
  }

  for (i = 0; i < len; i++) {
    if ((c = _getWholeChar(str, i)) === false) {
      continue;
    }

    match = (c.search(/[^A-Za-z]/) < 0) || (reg && c.search(reg) !== -1) || ((i !== 0 && i !== len - 1) && c === '-') || // No hyphen at beginning or end unless allowed in charlist (or locale)
    (i !== 0 && c === "'"); // No apostrophe at beginning unless allowed in charlist (or locale)
    if (match) {
      if (tmpStr === '' && format === 2) {
        aC = i;
      }
      tmpStr = tmpStr + c;
    }
    if (i === len - 1 || !match && tmpStr !== '') {
      if (format !== 2) {
        wArr[wArr.length] = tmpStr;
      } else {
        assoc[aC] = tmpStr;
      }
      tmpStr = '';
      wC++;
    }
  }

  if (!format) {
    return wC;
  } else if (format === 1) {
    return wArr;
  } else if (format === 2) {
    return assoc;
  }
  throw 'You have supplied an incorrect format';
}
