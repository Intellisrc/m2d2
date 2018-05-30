/**
 * jMock 1.0.0
 * This class is a wrapper around Native functions to mimic JQuery for specific and limited number of functions
 * The goal is to provide simple and fastest code.
 * @since 2018-05-10
 * @author A.Lepe (lepe@alepe.com)
 *
 * Initialize with:
 * jMock(function($) { ... });
 */
/**
 * Mock jQuery element
 */
var $ = (function() {
var jO = function(elems) {
	var obj = this;
	if ( !(obj instanceof jO) )  {
		obj = new jO(elems);
		return obj;
	} else {
		obj.elements = elems;
		obj.length =  elems ? (elems.length || 1) : 0;
	}
}
jO.prototype = {
	// --------- Properties -----------
	elements : document,
	length   : 1,
	// --------- Element manipulation: JQuery compatible ------------
	get    : function(index) { return this.elements[index]; },
	eq     : function(index) { return new jO(this.get(index)); },
	parent : function() { return new jO(this.elem().parentElement); },
	clone  : function() { return new jO(this.elem().cloneNode(true)); },
	append : function(html) { this.elem().innerHTML += html; return this; },
	prepend: function(html) { this.elem().innerHTML = html + this.elem().innerHTML; return this; },
	html   : function(html) { if(html == undefined) { return this.elem().innerHTML; } else { this.elem().innerHTML = html; } return this;	},
	outerHTML : function(html) { if(html == undefined) return this.elem().outerHTML; else this.elem().outerHTML = html; return this; },
	text   : function(text) { if(text == undefined) return this.elem().innerText; else this.elem().innerText = text; return this; },
	before : function(elem) { this.elem().parentNode.insertBefore(elem.elements, this.elem()); return this; }, 
	after  : function(elem) { this.elem().parentNode.insertBefore(elem.elements, this.elem().nextSibling); return this; }, 
	attr   : function(attr, val) { if(val == undefined) return this.elem().getAttribute(attr); else this.elem().setAttribute(attr, val); return this; },
	hasAttr: function(attr) { return this.elem().hasAttribute(attr); },
	removeAttr : function(attr) { this.elem().removeAttribute(attr); return this; },
	val    : function(val) { if(val == undefined) return this.elem().value; else this.elem().value = val; return this; },
	find   : function(selector) { return new jO(this.elem().querySelector(selector)); }, //TODO: must be querySelectorAll
	show   : function() { this.elem().style.display = "block"; return this; },
	hide   : function() { this.elem().style.display = "none"; return this;  },
	hasClass : function(cls) { return this.elem().classList.contains(cls); },
	addClass : function(cls) { this.elem().classList.add(cls); return this; },
	removeClass : function(cls) { this.elem().classList.remove(cls); return this; },
	toggleClass : function(cls) { this.elem().classList.toggle(cls); return this; },
	css    : function(key, val) { this.elem().style[key] = val; return this; },
	data   : function(key, val) { if(val == undefined) return this.elem().getAttribute("data-"+key); else this.elem().setAttribute("data-"+key, val); return this; },
	hasData: function(key) { return this.hasAttr("data-"+key); },
	children: function() { return this.elements.length; },
	remove : function() { this.elem().parentElement.removeChild(this.elem()); },
	next   : function() { return new jO(this.elem().nextElementSibling); },
	is     : function(elem) { return this.elem().tagName.toLowerCase() == elem.toLowerCase(); }, //TODO: limited functionality
	each : function(callback){
		if(typeof callback !== 'function') throw new Error('Callback should be a function');
		if(this.length == 1) {
			callback(new jO(this.elements));
		} else if(this.length > 1) {
			for(i = 0; i < this.length; i++){
			  callback(new jO(this.elements[i]));
			}
		}
		return this;
	},
	//------- Not compatible with JQuery ---------------
	isEmpty : function() { return !this.elem().hasChildNodes(); },
	check   : function() { this.elem().checked = true; return this; },
	uncheck : function() { this.elem().checked = false; return this; },
	disable : function() { this.elem().disabled = true; return this; },
	enable  : function() { this.elem().disabled = false; return this; },
	tagName : function() { return this.elem().tagName.toLowerCase(); },
	//------- Private ------------------
	elem    : function() { return this.elements.length == 1 ? this.elements[0] : this.elements;	}
};
/**
 * Mock jQuery Object
 */
var jMock = function(selector) {
	if(selector != undefined) {
		if(typeof selector == "function") { //onReady
			document.addEventListener("DOMContentLoaded", function(event) {
				selector(this);
			});
		} else if(selector instanceof jMock) {
			return selector;
		} else if(selector.trim()[0] == "<") {
			return new jO(htmlToElement(selector));
		} else {
			return new jO(document.querySelectorAll(selector));
		}
	}
}
jMock.extend = function(){
	   for(var i=1; i<arguments.length; i++)
		   for(var key in arguments[i])
			   if(arguments[i].hasOwnProperty(key))
				   arguments[0][key] = arguments[i][key];
	   return arguments[0];
};
jMock = jMock.extend(jMock, {
	// --------- No element related --------------
	isFunction      : function(f) { return typeof f === 'function'; },
	isPlainObject   : function(o) { return typeof o === 'object' &&! Array.isArray(o); },
	isArray         : function(a) { return Array.isArray(a); },
    isNumeric       : function(n) { return !isNaN(parseFloat(n)) && isFinite(n); },
    type            : function(v) { return typeof v; },
	get : function(url, data, callback) {
		var httpRequest = new XMLHttpRequest()
		var dataFunc = data != undefined && $.isFunction(data);
		if(callback == undefined && dataFunc) { callback = data; }
		httpRequest.onreadystatechange = function(res) {
			if(res) { if(callback !== undefined) { callback(res.target.response); } }
		}
		httpRequest.open('GET', url + (data !== undefined &&! dataFunc ? "?" + $.serialize(data) : ""));
		httpRequest.send();
	},
	post : function(url, data, callback) {
		var httpRequest = new XMLHttpRequest()
		var dataFunc = data != undefined && $.isFunction(data)
		if(callback == undefined && dataFunc) { callback = data; }
		httpRequest.onreadystatechange = function (res) {
			if(callback !== undefined) { callback(res); }
		}
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.open('POST', url);
		httpRequest.send($.serialize(data || {}));
	},
	//------- Not compatible with JQuery ---------------
	'new'     : function(elem) { return new $obj(singleNode(document.createElement(elem))) },
	serialize : function(obj) {
	   var str = [];
	   for(var p in obj){
		   if (obj.hasOwnProperty(p)) {
			   str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		   }
	   }
	   return str.join("&");
	}
});
//#https://stackoverflow.com/questions/13351966/
var singleNode = (function () {
	var nodelist = document.createDocumentFragment().childNodes;
	return function (node) {
		return Object.create(nodelist, {
			'0': {value: node, enumerable: true},
			'length': {value: 1},
			'item': {
				"value": function (i) {
					return this[+i || 0];
				}, 
				enumerable: true
			}
		});
	};
}());
//#https://stackoverflow.com/questions/494143/
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	return template.content.firstChild;
}
return jMock;
})();
