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
	CONTRACTION: {k:"CONTRACTION", r:/^([a-z]+-[a-z]+)[\W]/i},
	WORD: {k:"WORD", r:/^([a-z']+)[\W]/i},
	FLOAT: {k:"FLOAT", r:/^([0-9]+\.[0-9]+)[\W]/i},
	NUMBER: {k:"NUMBER", r:/^([0-9]+)[\W]/},
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
/*function log(str) {
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
	var sentence = "<font style='color:lightgrey;'>" + "[DEPTH " + depth + "] " + "</font>";
	var symbols = struct.getStructure();
	for (var i = 0; i < symbols.length; i++) {
		if (symbols[i].token == SenSym.BRACKETQUOTE || symbols[i].token == SenSym.QUOTATION) {
			if (maxdepth < 0 || depth < maxdepth) {
				sentence += outputStructure(symbols[i].value, depth + 1);
			}
		} else if (symbols[i].token == SenSym.TOKEN && symbols[i].value.token == Tok.EOL) {
			sentence += "<font style='color:blue;'>" + " [EOL] " + "</font>";
		} else {
			if (symbols[i].token == SenSym.TOKEN) {
				var t = symbols[i].value.token;
				if (t == Tok.WORD || t == Tok.CONTRACTION) {
					sentence += "<font style='color:green;'>" + symbols[i].value.value + "</font>";
				} else if (t == Tok.NUMBER || t == Tok.FLOAT) {
					sentence += "<font style='color:darkblue;'>" + symbols[i].value.value + "</font>";
				} else {
					sentence += symbols[i].value.value;
				}
			} else if (symbols[i].token == SenSym.URL) {
				sentence += "<u>" + symbols[i].value.value + "</u>";
			} else {
				sentence += symbols[i].value.value;
			}
		}
	}
	sentence += "<font style='color:lightgrey;'>" + "[/DEPTH " + depth + "]" + "</font>";
	if (depth == 0) log(sentence);
	return sentence;
}
*/

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
		//log("Next 10 characters: \"" + this.string.substr(0, 10) + "\"");
		this.string = oldstr;
	}
	
	this.construct_url = function(offset) {
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

            // Initilisation of some variables //
            var prev, next, next2;
            prev = next = next2 = null;
			
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
			
            // EOL may just be PDF continuation //
            } else if (tok.token == Tok.EOL) {
				// Last symbol //
				if (!this.safe(1)) {
					ss.addSymbol(SenSym.TOKEN, tok);
					continue;
				}
				
				// Previous Symbols //
				if (this.safe(-2)) prev = this.tokens.getToken(TokenCounter.get() - 2);

                // Check last line finished //
                if (prev && (prev.token == Tok.PERIOD || prev.token == Tok.EXCLAMATION || prev.token == Tok.QUESTION)) {
				    ss.addSymbol(SenSym.TOKEN, tok);
                } else {
                    ss.addSymbol(SenSym.TOKEN, new Token(Tok.SPACE, " "));
                }

			// Other Symbol, like a normal word, number, or punctuation etc //
			} else {
				ss.addSymbol(SenSym.TOKEN, tok);
			}
		}
		return ss;	// Finished token set
	}
	
	this.count_words = function(ss) {
		ss = ss.getStructure();
		var count = new Array();
		for (var i = 0; i < ss.length; i++) {
			if (ss[i].token == SenSym.TOKEN) {
				var t = ss[i].value;
				if (t.token == Tok.WORD || t.token == Tok.CONTRACTION) {
                    if (count.hasOwnProperty(t.value)) count[t.value]++;
                    else count[t.value] = 1;
				}
			} else if (ss[i].token == SenSym.BRACKETQUOTE || ss[i].token == SenSym.QUOTATION) {
				// Go deeper
                var c = this.count_words(ss[i].value);
                for (k in c) {
                    if (!c.hasOwnProperty(k)) continue;
                    if (!count.hasOwnProperty(k)) count[k] = 0;
                    count[k] += c[k];
                }
			} else {
				// URL's, EOL's, etc
			}
		}
		
		return count;
	}
	
	this.score_sentences = function(ss, counts) {
		var ss = ss.getStructure();
        var scores = new Array();
        var s = 0;
        scores[s] = {score:0, length:0, sentence: "", number:s};
		
		for (var i = 0; i < ss.length; i++) {
			// Score each sentence - store info on sentences (start/end)
            var t = ss[i].value;
            if (ss[i].token == SenSym.TOKEN && (t.token == Tok.WORD || t.token == Tok.CONTRACTION)) {
                scores[s].score += counts[t.value];
                scores[s].length++;
				scores[s].sentence += t.value;
            } else if (ss[i].token == SenSym.QUOTATION) {
                var subscore = this.score_sentences(t, counts);
				var numwords = Object.keys(subscore).reduce(function(sum, k) {return sum + subscore[k].length;}, 0);
				
				// Add quotation words to sentence //
				scores[s].length += numwords;
				for (var j = 0; j < subscore.length; j++) {
					scores[s].score += subscore[j].score;
					scores[s].sentence += subscore[j].sentence;
				}
            } else if (t.token == Tok.EOL || i + 1 == ss.length) {
                if (i + 1 < ss.length) {
                    s++;
                    scores[s] = {score:0, length:0, sentence: "", number:s};
                }
            } else if (ss[i].token == SenSym.BRACKETQUOTE) {
				// Do nothing - don't include it in summary.
			} else {
				scores[s].sentence += t.value;
			}
		}

        return scores;
	}

	this.summarize = function(numsentences, sentences, includeHeading) {
		if (numsentences < 1) return "";
		
		var first = sentences[0].sentence;
	
		var sorted = sentences.sort(function(a, b) {return (a.score/a.length) - (b.score/b.length)});	// sort on normalised value
		for (var i = 0; i < sorted.length; i++) {
			if (sorted[i].length <= 3) sorted.shift();
		}
		
		if (numsentences > sorted.length) numsentences = sorted.length;
		if (sorted.length == 0) return "";
		
		sorted = sorted.splice(0, numsentences);
		var chrono = sorted.sort(function(a, b) {return (a.number - b.number)});	// sort on normalised value
		
		var s = "";
		for (i = 0; i < chrono.length; i++) {
			if (i == 0 && includeHeading && chrono[i].number != 0) {
				s += first.replace(/^\s*(.*?)\s*$/,"$1");
				chrono.pop();
				continue;
			}
			
			if (i > 0 && (chrono[i - 1].number + 1) == chrono[i].number) s += " ";
			else if (i > 0) s += "<br/>";
			s += chrono[i].sentence.replace(/^\s*(.*?)\s*$/,"$1");
		}
		
		return s;
	}

	this.getSummary = function(text, percent, min, max, includeHeading) {
		this.setString(text);
		this.tokenize();
		var structure = this.sentence_tokenize();
		//outputStructure(structure, 0, -1);
		var counts = this.count_words(structure);
		var scores = this.score_sentences(structure, counts);
		
		var numsentences = Math.ceil(percent * scores.length);
		if (min) numsentences = Math.max(numsentences, min);
		if (max) numsentences = Math.min(numsentences, max);
		
		var summary = this.summarize(numsentences, scores, includeHeading);
		return summary;
	}
}
