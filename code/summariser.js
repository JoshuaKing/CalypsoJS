// Attempt at porting to Javascript //

function Summariser() {
	// Parameters //
	this.string = "";
	this.s_array = new Array();
	this.s_importance = new Array();
	this.response = "";
	
	this.setString = function(strings) {
		this.string = strings;
	}
	
	this.getString = function() {
		return this.string;
	}
	
	this.remove_brackets = function() {
		first = 0;
		last = 0;
		deleting = 0;
		this.string = this.string.replace(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/g, "");
		this.string = this.string.replace(/\(.*?\)/g, "");	// replace contents of parenthesis
		this.string = this.string.replace(/{.*?}/g, "");	// replace contents of curly braces
		this.string = this.string.replace(/\[.*?\]/g, "");	// replace contents of square braces
		this.string = this.string.replace(/\n/, "<br>");
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
			this.response += this.s_array[rated[i]].replace(/\[([0-9]):([0-9])\]/, "$1.$2") + "<br/>"; 	// add decimal points back in
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
