// ------- Functions -------
"use strict";
/**
 * Functions useful to work with Javascript data and DOM
 * Used mainly in M2D2 core library but exposed to the
 * consumer.
 * @Author: A.Lepe <dev@alepe.com>
 *
 * This extension provides:
 * $.isString
 * $.isBool
 * $.isNumeric
 * $.isSelectorID
 * $.isPlainObject
 * $.isObject
 * $.isArray
 * $.isFunction
 * $.isElement
 * $.isNode
 * $.isHtml
 * $.isEmpty
 * $.isVisible
 * $.inView
 * $.cleanArray
 * $.isValidElement
 * $.exists
 * $.getAttrOrProp
 * $.hasAttrOrProp
 * $.hasAttr
 * $.hasProp
 * $.setPropOrAttr
 * $.setAttr
 * $.defineProp
 * $.htmlElement
 * $.newElement
 * $.newEmptyNode
 * $.getMethods
 * $.appendAllChild
 * $.prependAllChild
 */
class Utils {
	/**
	 * Return true if variable is string
	 * @param {*} v
	 * @returns {boolean}
	 */
    isString(v) {
        return typeof v === 'string';
    };
	/**
	 * Return true if variable is a boolean
	 * @param {*} b
	 * @returns {boolean}
	 */
    isBool(b) {
        return typeof b === 'boolean';
    };
	/**
	 * Return true if variable is a number
	 * @param {*} n
	 * @returns {boolean}
	 */
    isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
	/**
	 * Return true if selector us an id selector
	 * @param {string} s
	 * @returns {boolean}
	 */
    isSelectorID(s) {
        return (s + "").trim().indexOf("#") === 0;
    };
	/**
	 * Returns true if object is a "plain" object (not an array)
	 * @param o
	 * @returns {boolean}
	 */
    isPlainObject(o) {
        return o.constructor.name === "Object";
    };
	/**
	 * Returns true if variable is an object (any kind, e.g. Array)
	 * @param {*} oa
	 * @returns {boolean}
	 */
    isObject(oa) {
        return typeof oa === 'object';
    };
	/**
	 * Returns true if object is an array
	 * @param {object} a
	 * @returns {boolean}
	 */
    isArray(a) {
        return Array.isArray(a);
    };
	/**
	 * Returns true if object is a function
	 * @param {object} f
	 * @returns {boolean}
	 */
    isFunction(f) {
        return typeof f === 'function';
    };
	/**
	 * Returns true if object is an HTMLElement
	 * @param {object} n
	 * @returns {boolean}
	 */
    isElement(n) {
        return n instanceof HTMLElement;
    };

	/**
	 * Return true if object is a Node or DocumentFragment
	 * @param {object} n
	 * @returns {boolean}
	 */
    isNode(n) {
    	return (n instanceof Node || n instanceof DocumentFragment);
	}
	/**
	 * Return true if string seems to be an HTML code
	 * @param {string} s
	 * @returns {boolean}
	 */
    isHtml(s) {
        return (s + "").trim().indexOf("<") !== -1;
    };
	/**
	 * Checks if an object is empty
	 * @param {object} obj
	 * @returns {boolean}
	 */
    isEmpty(obj) {
        return obj === undefined || (this.isObject(obj) && Object.keys(obj).length === 0) || obj === "";
    };
    /**
     * Checks if an element is visible
     * @param {HtmlElement}
     * @returns {boolean}
     */
    isVisible(elem) {
        if(! this.isElement(elem)) {
            console.log("(isVisible) Not an element: ");
            console.log(elem);
            return false;
        }
        const display = elem.style.display !== "none";
        const notHidden = elem.style.visibility !== "hidden";
        return display && notHidden;
    };
    /**
     * Checks if element is in view
     * @param {HtmlElement}
     * @returns {boolean}
     */
    inView(elem) {
        const rect = elem.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 &&
               rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
               rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
               rect.width > 0 && rect.height > 0
    }
	/**
	 * Remove null, empty or undefined values from an array
	 * @param {Array} a
	 * @returns {Array}
	 */
    cleanArray(a) {
        return a.filter(function(e){ return e === 0 || e });
    };
	/**
	 * Checks if a tag name is a valid HTML element
	 * @param {string} tagName
	 * @returns {boolean}
	 */
    isValidElement(tagName) {
        const $node = this.newElement(tagName);
        return tagName !== "template" && $node.constructor.name !== "HTMLUnknownElement";
    }
    /**
     * Returns true if element exists in DOM based on selector
     */
    exists(selector) {
        return document.querySelector(selector) !== null;
    }
	/**
	 * Get attribute or property
	 * @param {HTMLElement} $node
	 * @param {string} key
	 * @returns {*}
	 */
	getAttrOrProp ($node, key) {
		let value = "";
		if(this.hasAttrOrProp($node,  key)) {
			value = this.hasAttr($node, key) ? $node.getAttribute(key): $node[key];
		}
		return value
	}
	/**
	 * If a node contains either a property or an attribute
	 * @private
	 * @param {HTMLElement} $node
	 * @param {String} key
	 * @return {boolean}
	 */
	hasAttrOrProp ($node, key) {
		return this.hasAttr($node, key) || this.hasProp($node, key);
	}
	/**
	 * If a node has an attribute
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} attr
	 * @return {boolean}
	 */
	hasAttr ($node, attr) {
		let hasAttr = false;
		if($node && !this.isNumeric(attr)) {
			switch(attr) {
				case "checked":
					hasAttr = ($node.type !== undefined && ($node.type === "radio" || $node.type === "checkbox"));
					break;
				default:
					hasAttr = $node.hasAttribute !== undefined ? $node.hasAttribute(attr) : false;
			}
		}
		return hasAttr;
	}
	/**
	 * If a node has a property which is not an attribute
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} prop
	 * @returns {boolean}
	 */
	hasProp ($node, prop) {
		let hasProp = false;
		if($node && !this.isNumeric(prop)) {
		    let has = $node[prop] !== undefined;
		    if(has && $node[prop] === null && prop === "value") {
				has = false;
			}
			hasProp = (has &&! ($node[prop] instanceof Node)) &&! $node.hasAttribute(prop);
		}
		return hasProp;
	}

	/**
	 * Set the value of a property which is true/false
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} key
	 * @param {*} value
	 */
	setPropOrAttr ($node, key, value) {
	    if(this.hasProp($node, key)) {
	    	try {
				$node[key] = value;
			} catch(ignore) { //If fails, set it as attribute: (e.g. input.list)
				this.setAttr($node, key, value);
			}
	    } else {
	        this.setAttr($node, key, value);
    	}
	}

    /**
     * Set attribute to node. If value is false, will remove it.
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} key
	 * @param {*} value
     */
	setAttr ($node, key, value) {
        if(value) {
            $node.setAttribute(key, value);
        } else {
            $node.removeAttribute(key);
        }
	}
	/**
	 * Define a property to an object
	 * @private
	 * @param {Object} obj
	 * @param {string} prop
	 * @param {string} def
	 */
	defineProp (obj, prop, def) {
		if(this.isObject(obj)) {
			if(obj[prop] === undefined) {
				Object.defineProperty(obj, prop, {
					enumerable: false,
					writable: true
				});
				obj[prop] = def;
			}
		}
	}
	/**
	 * Creates a Node using HTML code
	 * @param {string} html
	 * @returns {HTMLElement}
	 */
	htmlElement(html) {
		//return document.createRange().createContextualFragment(html); FIXME
		const template = this.newElement("template");
        template.innerHTML = html.trim();
        return template.content.firstChild;
	};
	/**
	 * Creates a Node with a tag name
	 * @param {string} tagName
	 * @returns {HTMLElement}
	 */
	newElement(tagName) {
		return document.createElement(tagName);
	};
	/**
	 * Creates an empty node (DocumentFragment)
	 * @returns {DocumentFragment}
	 */
	newEmptyNode() {
		return new DocumentFragment()
	}
	/**
	 * Get all methods of class object
	 * https://stackoverflow.com/a/67260131/196507
	 * @param {object} obj
	 * @returns {Array}
	 */
	getMethods(obj) {
		const o = Reflect.getPrototypeOf(obj);
		const x = Reflect.getPrototypeOf(o);
		return Reflect.ownKeys(o).filter(it => Reflect.ownKeys(x).indexOf(it) < 0);
	};
	/**
	 * Append all child from one node to another
	 * @param {HTMLElement} $srcNode
	 * @param {HTMLElement} $tgtNode
	 */
	appendAllChild($srcNode, $tgtNode) {
		//Update all at once
		//$node.append(...$outElem.childNodes); //<-- works but it is slower
		while ($srcNode.firstChild) {
			$tgtNode.append($srcNode.firstChild);
		}
	}
	/**
	 * Prepend all child from one node to another
	 * @param {HTMLElement} $srcNode
	 * @param {HTMLElement} $tgtNode
	 */
	prependAllChild($srcNode, $tgtNode) {
		//Update all at once
		//$node.append(...$outElem.childNodes); //<-- works but it is slower
		while ($srcNode.firstChild) {
			$tgtNode.prepend($srcNode.firstChild);
		}
	}
}
