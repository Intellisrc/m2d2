// ------- Functions -------
"use strict";
/**
 * Some utils to work with DOM
 * @Author: A.Lepe <dev@alepe.com>
 */
class Utils {
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    htmlNode(html) {
        const template = Utils.newNode("template");
        template.innerHTML = html.trim();
        return template.content.firstChild;
    };
    newNode(tagName) {
        return document.createElement(tagName);
    };
    isString(v) {
        return typeof v === 'string';
    };
    isBool(b) {
        return typeof b === 'boolean';
    };
    isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    isSelectorID(s) {
        return (s + "").trim().indexOf("#") === 0;
    };
    isPlainObject(o) {
        return Utils.isObject(o) && !Utils.isArray(o);
    };
    isObject(oa) {
        return typeof oa === 'object';
    };
    isArray(a) {
        return Array.isArray(a);
    };
    isFunction(f) {
        return typeof f === 'function';
    };
    isNode(n) {
        return n instanceof HTMLElement;
    };
    isHtml(s) {
        return (s + "").trim().indexOf("<") !== -1;
    };
    isEmpty(obj) {
        return obj === undefined || (Utils.isObject(obj) && Object.keys(obj).length === 0) || obj === "";
    };
    cleanArray(a) {
        return a.filter(function(e){ return e === 0 || e });
    };
    isValidElement(tagName) {
        const $node = Utils.newNode(tagName);
        return tagName !== "template" && $node.constructor.name !== "HTMLUnknownElement";
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
		if($node && !this.utils.isNumeric(attr)) {
			switch(attr) {
				case "checked":
					hasAttr = ($node.type !== undefined && ($node.type === "radio" || $node.type === "checkbox"));
					break;
				default:
					hasAttr = $node.hasAttribute(attr);
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
		if($node && !this.utils.isNumeric(prop)) {
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
		if(this.utils.isObject(obj)) {
			if(obj[prop] === undefined) {
				Object.defineProperty(obj, prop, {
					enumerable: false,
					writable: true
				});
				obj[prop] = def;
			}
		}
	}
}
