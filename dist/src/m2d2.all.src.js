/**
 * Author : A.Lepe (dev@alepe.com) - intellisrc.com
 * License: MIT
 * Version: 2.1.1
 * Updated: 2022-02-15
 * Content: Full Bundle (Debug)
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.m2d2 = factory();
  }
}(this, function() {
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

/**
 * @author: A. Lepe
 * @url : https://gitlab.com/intellisrc/m2d2/
 * @since: May, 2018
 * @version: 2.0.0
 * @updated: 2021-04-16
 *
 *
 * M2D2 Class
 */
class m2d2 {
    'use strict';
	_storedEvents = [];
	static storedEventsTimeout = 50; //ms to group same events
	static short = true; //Enable short assignation (false = better performance) TODO: document
	static updates = true; //Enable "onupdate" (false = better performance) TODO: document
	static utils = new Utils();

	constructor() {}
	//------------------------- STATIC -----------------------------
	static instance = new m2d2();
	static extensions = {}; // Additional properties for DOM
	static main = (() => {
		const f = (selector, object) => {
			return this.instance.getProxyNode(selector, object);
		}
	    // Extends Utils:
	    m2d2.utils.getMethods(m2d2.utils).forEach(k => { f[k] = m2d2.utils[k] });
		return f;
	})();
	/**
	 * Initialization. Use: m2d2.ready()
	 * @param { function } callback
	 */
	static ready(callback) {
		document.addEventListener("DOMContentLoaded", () => {
            callback(m2d2.main);
		});
	}

	/**
	 * Execute something on load. It will search for extensions.
	 * @param {function} callback
	 */
	static load(callback) {
	    if(callback !== undefined) {
            const ext = callback(m2d2.main); //main can be extended here
            if(m2d2.utils.isObject(ext) && !m2d2.utils.isEmpty(ext)) {
                Object.keys(ext).forEach(k => {
                    if(m2d2.utils.isValidElement(k)) {
                        if(m2d2.extensions[k] === undefined) {
                            m2d2.extensions[k] = {};
                        }
                        // Check that we are not replacing any existing property:
                        const $node = m2d2.utils.newElement(k);
                        Object.keys(ext[k]).forEach(it => {
                            if(m2d2.utils.hasProp($node, it)) {
                                console.log("Warning: property [" + it + "] already exists " +
                                    "in node: [" + k + "] while trying to extend it. " +
                                    "Unexpected behaviour may happen.");
                            }
                        });
                        Object.assign(m2d2.extensions[k], ext[k]);
                    } else {
                        if(m2d2.extensions["*"] === undefined) {
                            m2d2.extensions["*"] = {};
                        }
                        const $node = m2d2.utils.newElement("div");
                        Object.keys(ext[k]).forEach(it => {
                            if(m2d2.utils.hasProp($node, it)) {
                                console.log("Warning: property [" + it + "] already exists " +
                                    "in Node while trying to extend it. " +
                                    "Unexpected behaviour may happen.");
                            }
                        });
                        Object.assign(m2d2.extensions["*"], ext[k]);
                    }
                });
            }
		}
		return m2d2.main; //TODO: documentation : const $ = m2d2.load();
	}
	/**
	 * M2 Will set all extensions to DOM objects //TODO: documentation
	 * @param {string, HTMLElement} selector
	 * @param {HTMLElement, Node} [$root]
	 * @returns {HTMLElement}
	 */
	extDom(selector, $root) {
		if(! selector) {  // Do not proceed if selector is null, empty or undefined
			console.error("Selector was empty");
			return null;
		}
		if($root === undefined) { $root = document }
		const $node = m2d2.utils.isNode(selector) ? selector : $root.querySelector(selector);
		if(! $node) {
			if(m2d2.utils.isString(selector)) {
				console.error("Selector: " + selector + " didn't match any element in node:");
				console.log($root);
			} else {
				console.error("Node was null");
			}
			return null;
		}
		if($node._m2d2 === undefined) {
			$node._m2d2 = true; //flag to prevent it from re-assign methods
			["parent","sibling","find","findAll","onupdate","show","onshow","css","text","html","getData"].forEach(f => {
				if($node.hasOwnProperty(f)) {
					console.log("Node already had ["+f+"] property. It might cause unexpected behaviour.")
					console.log("You may need to update the M2D2 version or report it to: github.com/lepe/m2d2/")
				}
			});
			// Properties:
			Object.defineProperty($node, "text", {
				get() { return this.childNodes.length ? this.innerText : this.textContent; },
				set(value) {
					// text should only change Text nodes and not children: //TODO: documentation
					if(this.childNodes.length) {
						let found = false;
						this.childNodes.forEach(n => {
							if(n.constructor.name === "Text") {
								n.nodeValue = value;
								found = true;
							}
						});
						if(! found) {
							this.prepend(document.createTextNode(value));
						}
					} else {
						this.textContent = value
					}
				}
			});
			Object.defineProperty($node, "html", {
				get() { return this.innerHTML; },
				set(value) { this.innerHTML = value;  }
			});
			Object.defineProperty($node, "css", {   //TODO: document new behaviour
				get() {
				    return this.classList;
				},
				set(value) {
				    if(m2d2.utils.isArray(value)) {
    				    this.className = value.join(" ");
				    } else if(m2d2.utils.isString(value)) {
    				    this.className = value;
				    } else if(m2d2.utils.isPlainObject(value)) {
				        Object.keys(value).forEach(c => {
				            if(value[c]) {
				                this.classList.add(c);
				            } else {
				                this.classList.remove(c);
				            }
				        });
				    } else {
				        console.error("Trying to assign a wrong value to css : " + value);
				    }
				}
			});
			Object.defineProperty($node, "show", {
				get() { //TODO: document
                    const rect = this.getBoundingClientRect();
                    const display = this.style.display !== "none";
                    const notHidden = this.style.visibility !== "hidden";
                    return (
                        display && notHidden &&
                        rect.top >= 0 && rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
						rect.width > 0 && rect.height > 0
                    );
				},
				set(show) {
                    const cssDisplay = () => {
                        return getComputedStyle(this, null).display;
                    };
                    const defaultDisplay = () => {
                        const b = document.getElementsByTagName("body")[0];
                        const t = document.createElement("template");
                        const n = document.createElement(this.tagName);
                        t.append(n);
                        b.append(t);
                        const display = getComputedStyle(n, null).display;
                        t.remove();
                        return display;
                    };
                    if(show) {
                        if(cssDisplay() === "none") {
                            if(this._m2d2_display) {
                                this.style.display = this._m2d2_display;
                            } else {
                                this.style.removeProperty("display");
                                if(cssDisplay() === "none") {
                                    const defaultShow = defaultDisplay();
                                    this.style.display = this.dataset.display || (defaultShow !== "none" ? defaultShow : "block");
                                }
                            }
                            if(this.onshow !== undefined && m2d2.utils.isFunction(this.onshow)) { //TODO: document onshow
                                this.onshow(this);
                            }
                        }
                    } else {
                        const stored = this.style.display !== "none" ? this.style.display : cssDisplay();
                        if(stored !== "none") {
                            this._m2d2_display = stored;
                        }
                        this.style.display = "none"
                    }
				}
			});
			//TODO: document how to extend
			let extend = {};
			if(m2d2.extensions["*"] !== undefined) {
				Object.assign(extend, m2d2.extensions["*"]);
			}
			if(m2d2.extensions[$node.tagName] !== undefined) {
				Object.assign(extend, m2d2.extensions[$node.tagName]);
			}
			// Functions:
			Object.assign($node, {
				parent: () => {
					return this.extDom($node.parentElement);
				},
				sibling: (sel) => {
					return $node.parentElement.find(sel);
				},
				find: (it) => {
					const node = $node.querySelector(it)
					return node ? this.extDom(node) : null;
				},
				findAll: (it) => {
					const nodeList = it === undefined ? Array.from($node.children) : $node.querySelectorAll(it);
					nodeList.forEach(n => { this.extDom(n) });
					return nodeList;
				}
			}, extend);
			// Let attributes know about changes in values
			if(["INPUT", "TEXTAREA", "SELECT"].indexOf($node.tagName) >= 0 && m2d2.utils.hasAttrOrProp($node, "value")) {
				$node.oninput = function() { this.setAttribute("value", this.value )}
			}
			// Add getData() to form: //TODO: document
			if($node.tagName === "FORM") {
				$node.getData = function (includeNotVisible) { //TODO document: includeNotVisible
					const data = {};
					const fd = new FormData(this);
					const include = includeNotVisible || false;
					for (let pair of fd.entries()) {
                        const elem = $node.find("[name='"+pair[0]+"']");
						if(include || elem.type === "hidden" || elem.show) {
							data[pair[0]] = elem.type === "file" ? elem.files : pair[1];
                        }
					}
					return data;
				}
			}
			return $node;
		} else {
			return $node;
		}
	}
	/**
	 * M2D2 will create custom links and properties
	 * @param {string, HTMLElement, Node} selector
	 * @param {Object} object
	 * @returns {HTMLElement, Proxy}
	 */
	doDom(selector, object) {
		// When no selector is specified, set "body"
		if(m2d2.utils.isObject(selector) && object === undefined) {
			object = selector;
			selector = "body";
		}
		if(!(m2d2.utils.isString(selector) || m2d2.utils.isElement(selector) || m2d2.utils.isNode(selector))) {
			console.error("Selector is not a string or a Node:")
			console.log(selector);
			return null;
		}
		if(m2d2.utils.isString(selector) &&! document.querySelector(selector)) {
		    console.log("Selected element doesn't exists: " + selector)
		    return null;
		}
		const $node = this.extDom(selector); // Be sure that $node is an extended DOM object
		// If there is no object return only extension
		if(object === undefined) { //TODO: documentation: extending nodes
			return $node;
		}
		object = this.plainToObject($node, object); // Be sure it's an object //TODO: documentation : text parameter
		// We filter-out some known keys:
		Object.keys(object).filter(it => ! ["tagName"].includes(it)).forEach(key => {
			let value = object[key];
			if(value === undefined || value === null) {
			    console.log("Value was not set for key: " + key + ", 'empty' was used in object: ");
			    console.log(object);
			    console.log("In node:");
			    console.log($node);
			    value = "";
			}
			//Look for property first:
			let isProp = m2d2.utils.hasProp($node, key);
			let isAttr = m2d2.utils.hasAttr($node, key);
			//Identify if value matches property type:
			let foundMatch = false;
			if(isAttr || isProp) {
				// noinspection FallThroughInSwitchStatementJS
				switch(true) {
					// Math found:
					case key === "value" && m2d2.utils.hasProp($node, "valueAsDate") && value instanceof Date: // Dates
						key = "valueAsDate"; //renamed value to valueAsDate
					case key === "css": // css is a Proxy so it fails to verify:
					case typeof value === typeof $node[key]: //Same Time
					case m2d2.utils.isString($node[key]) && m2d2.utils.isNumeric(value): //Numeric properties
					case (m2d2.utils.isFunction(value) && m2d2.utils.isObject($node[key])): //Functions
					case m2d2.utils.isBool(value) && m2d2.utils.isString($node[key]): //Boolean
					case typeof $node[key] === "object" && $node.tagName === "INPUT": //Cases like "list" in input
						foundMatch = true;
						break;
				}
			}
			// Properties and Attributes:
			if(foundMatch) {
				let error = false;
				switch(key) {
					case "classList":
						if(m2d2.utils.isArray(value)) {
							value.forEach(v => {
								$node[key].add(v);
							});
						} else if(m2d2.utils.isString(value)) {
							$node[key].add(value);
						} else {
							error = true;
						}
						break
					case "style":
					case "dataset": //TODO: as it is already a DOM, we don't need it maybe?
						if(m2d2.utils.isPlainObject(value)) {
							Object.assign($node[key], value);
						} else {
							error = true;
						}
						break
					default:
						switch(true) {
							case m2d2.utils.isBool(value): // boolean properties
							case m2d2.utils.hasAttrOrProp($node, key):
                                m2d2.utils.setPropOrAttr($node, key, value);
								break
							default:
								$node[key] = value;
						}
				}
				if(error) {
					console.error("Invalid value passed to '" + key + "': ")
					console.log(value);
					console.log("Into Node:");
					console.log($node);
				}
				// Look for elements:
			} else {
			    const options = [];
			    try {
			        // Functions can not be placed directly into elements, so we skip
			        if(key !== "template" &&! m2d2.utils.isFunction(value)) {
                        //Look for ID:
                        if(key && key.match(/^\w/)) {
                            let elem = $node.find("#" + key);
                            if(elem && options.indexOf(elem) === -1) { options.push(elem); }
                            //Look for name:
                            elem = $node.find("[name='"+key+"']");
                            if(elem && options.indexOf(elem) === -1) { options.push(elem); }
                            //Look for class:
                            const elems = Array.from($node.findAll("." + key)).filter(i => options.indexOf(i) < 0)
                            if(elems.length > 0) { elems.forEach(e => options.push(e)) }
                        }
                        //Look for element or free selector (e.g: "div > span"):
                        const elems =  Array.from($node.findAll(key)).filter(i => options.indexOf(i) < 0)
                        if(elems.length > 0) { elems.forEach(e => options.push(e)) }
                    }
				} catch(e) {
				    console.error("Invalid selector: " + key);
				    console.log(e);
				    return;
				}
				if(options.length > 1) {
					const items = [];
					options.forEach(item => {
						items.push(this.render(item, key, value));
					});
					this.linkNode($node, key, items);
					if(value.warn === undefined || value.warn !== false) { //TODO: document
						console.log("Multiple elements were assigned with key: [" + key + "] under node: ")
						console.log($node);
						console.log("It might be what we expect, but if it is not expected it could result " +
									"on some elements mistakenly rendered. You can specify " +
									"'warn : false' under that element to hide this message.")
					}
				} else if(options.length === 1) { // Found single option: place values
					const opt = options[0];
					 if(m2d2.utils.isElement(opt)) {
						if(m2d2.utils.isArray(value)) { // Process Array
							const template = object["template"];
							this.doItems(opt, value, template);
							this.linkNode($node, key, opt);
						} else { // Normal Objects:
							this.renderAndLink($node, opt, key, value);
						}
					} else {
						console.error("BUG: It should have been a node but got: ");
						console.log(opt);
						console.log("Parent node:")
						console.log($node);
					}
				} else if(options.length === 0) { //No options found: create nodes
				    // Make "items" optional: //TODO: document
					if(key === "template" && object["items"] === undefined) {
					    key = "items";
					    value = [];
					}
					const isFunc = m2d2.utils.isFunction(value);
					if(value.tagName !== undefined) {
						const $newNode = this.appendElement($node, value.tagName);
						this.renderAndLink($node, $newNode, key, value);
					} else if(m2d2.utils.isValidElement(key) &&! isFunc) {
						const $newNode = this.appendElement($node, key);
						this.renderAndLink($node, $newNode, key, value);
					} else if(key === "items") { //Items creation
						const template = object["template"];
						// Allow use of plain object to specify value -> text //TODO: documentation
						if(m2d2.utils.isPlainObject(value)) {
						    const valTmp = [];
						    Object.keys(value).forEach(o => {
						    	let obj;
						    	if($node.tagName === "DL") { //TODO: document DL
									obj = { dt : o, dd : value[o] }
								} else {
									obj = { text: value[o] };
									if (m2d2.utils.hasAttrOrProp($node, "value")) {
										obj.value = o;
									} else {
										obj.dataset = {id: o};
									}
								}
								valTmp.push(obj);
							});
						    value = valTmp;
						}
						// Process Array:
						if(m2d2.utils.isArray(value)) {
							this.doItems($node, value, template);
						} else {
							console.log("Warning: 'items' specified but value is not and array, in element: ");
							console.log($node);
							console.log("Passed values are: ");
							console.log(value);
						}
    				} else if(isFunc) {
						if(m2d2.updates) {
						    // By using addEventListener we can assign multiple listeners to a single node //TODO: document
							if (key === "onupdate") {
								$node.addEventListener("update", value, true); //TODO: document
							}
						}
						$node[key] = value;
					} else if(key !== "template" && (key !== "warn" && value !== false)) { //We handle templates inside items
						if(object.warn === undefined || object.warn !== false) { //TODO: document
							console.error("Not sure what you want to do with key: " + key + " under element: ");
							console.log($node);
							console.log("And object:");
							console.log(object);
							console.log("Most likely the element's property or child no longer exists or the value" +
										" passed to it is incorrect.");
							console.log("You can set 'warn : false' property to the element to dismiss this message.");
						}
						$node[key] = value;
					}
				}
			}
		});
		// Dispatch onload event (if its not native): //TODO: Document
		if($node.onload) {
		    const native = ["BODY","FRAME","IFRAME","IMG","LINK","SCRIPT","STYLE"].indexOf($node.tagName) >= 0;
		    const inputImage = $node.tagName === "INPUT" && $node.type === "image";
		    if(! (native || inputImage)) {
                $node.dispatchEvent(new CustomEvent('load'));
		    }
		}
		return $node;
	}

    /**
	 * Convert plain value into object if needed
	 * @param {HTMLElement, Node} $node
	 * @param {*} value
	 */
    plainToObject($node, value) {
		if(!m2d2.utils.isPlainObject(value) &&! m2d2.utils.isFunction(value) &&! (value instanceof HTMLElement)) {
			// When setting values to the node (simplified version):
			if(m2d2.utils.isHtml(value)) {
				value = { html : value };
			} else if(m2d2.utils.isArray(value)) {
			    value = { items : value };
			} else if(m2d2.utils.hasAttrOrProp($node, "value")) {
				// If the parent is <select> set also as text to item:
				if($node.tagName === "SELECT") {
				    value = {
				        value : value,
				        text  : value
				    };
				} else if($node.tagName === "BUTTON") {
				    value = { text : value };
				} else {
				    value = { value : value };
				}
			} else if(m2d2.utils.isString(value) && $node.tagName === "IMG") {
			    value = { src : value };
			} else if(m2d2.utils.isString(value) || m2d2.utils.isNumeric(value)) {
				value = { text : value };
			}
		}
		return value;
    }
	/**
	 * Render and Link a node
	 * @private
	 * @param {HTMLElement} $root
	 * @param {HTMLElement} $node
	 * @param {string} key
	 * @param {*} value
	 */
	renderAndLink($root, $node, key, value) {
		const $child = this.render($node, key, value);
		this.linkNode($root, key, $child);
	}
	/**
	 * Render some value in a node
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} key
	 * @param {*} value
	 * @returns {Proxy, HTMLElement}
	 */
	render($node, key, value) {
	    value = this.plainToObject($node, value);
		return this.doDom($node, value); // Recursive for each element
	}

	/**
	 * Links a property to a child node
	 * @private
	 * @param {HTMLElement} $node
	 * @param {String} key
	 * @param {HTMLElement} $child
	 */
	linkNode($node, key, $child) {
		if($node[key] === $child) {
			const $proxy = this.proxy($child);
			try {
				$node[key] = $proxy;
			} catch(ignore) {
				//NOTE: although it fails when using forms, form is a proxy so it still works.
			}
			$node["$" + key] = $proxy;
		} else if(m2d2.utils.hasAttrOrProp($node, key)) { // Only if its not an attribute or property, we "link" it.
			$node["$" + key] = $child; //Replace name with "$" + name
			console.log("Property : " + key + " existed in node: " + $node.tagName +
			". Using $" + key + " instead for node: " + $child.tagName + ".")
		} else {
			$node[key] = this.proxy($child);
		}
	}
	/**
	 * Creates a dom element inside $node
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} tagName
	 * @returns {HTMLElement}
	 */
	appendElement ($node, tagName) {
		const $newElem = m2d2.utils.newElement(tagName);
		$node.append($newElem);
		return $newElem;
	}

    /**
	 * Get an item to be added
	 * @param {HTMLElement|null} $node
	 * @param {number|string} index
	 * @param {*} obj
	 * @param {HTMLElement} $template
	 */
	getItem($node, index, obj, $template) {
	    if(!$template) {
		    $template = this.getTemplate($node);
		}
        const $newItem = $template.cloneNode(true);
	    // Copy templates to new item:
	    this.addTemplatesToItem($template, $newItem);
        $newItem.dataset.id = index;
        // Add "selected" property
        this.setUniqueAttrib($newItem, "selected"); //TODO: Document
        // Set values and links
		let $newNode = this.doDom($newItem, obj);
		// Place Events:
		return this.getItemWithEvents($node, $newNode);
	}

	/**
	 * Reassign templates
	 * @param {HTMLElement, Node} $template
	 * @param {HTMLElement, Node} $newNode
	 * @returns {HTMLElement|Proxy}
	 // TODO: this does not support deep location of templates
	 */
	addTemplatesToItem($template, $newNode) {
	    ["_template","__template"].forEach(key => {
            if($template[key] !== undefined) {
                $newNode[key] = $template[key];
            }
        });
	}

	/**
	 * Returns a Node with events
	 * @param {HTMLElement, Node} $node
	 * @param {HTMLElement, Node} $newNode
	 * @returns {HTMLElement|Proxy}
	 //FIXME: I think `this.doDom` could be removed from here and only "link" events
	 */
	getItemWithEvents($node, $newNode) {
		if($node.__template !== undefined) {
			const scan = (object, result) => {
				result = result || {};
				Object.keys(object).forEach(key=> {
					if (m2d2.utils.isPlainObject(object[key])) {
						result[key] = scan(object[key]);
					} else if(m2d2.utils.isFunction(object[key])) {
						result[key] = object[key];
					}
				});
				return result;
			}
			let tree = scan($node.__template);
			if(!m2d2.utils.isEmpty(tree)) {
				tree = tree[Object.keys(tree)[0]];
				$newNode = this.doDom($newNode, tree);
			}
		}
		return $newNode;
	}

	/**
	 * Process items
	 * @private
	 * @param {HTMLElement} $node
	 * @param {Array} values
	 * @param {Object} template
	 */
	doItems ($node, values, template) {
	    // Create the structure for the item:
		const $template = this.getTemplate($node, template);
		if($template === undefined) {
			console.error("Template not found. Probably an array is being used where it is not expected. Node:");
			console.log($node);
			console.log("Value (mistaken?):")
			console.log(values);
			return;
		}
		// Fill the template with data:
		let i = 0;
		values.forEach(val => {
		    val = this.plainToObject($node, val);
		    const $newItem = this.getItem($node, i++, val, $template);
		    if($newItem) {
			    $node.append($newItem);
			}
		});
		// Cleanup
		const $temp = $node.find("template");
		if($temp) { $node.removeChild($temp); }
		// Set "items" link:
		$node.items = $node.children;
		this.extendItems($node);
	}
	/** Returns an HTMLElement with the structure without events
	 * @private
	 * @param {HTMLElement} $node
	 * @param {Object, string} [template]
	 * @returns {HTMLElement}
	 */
	getTemplate ($node, template) {
		// If we already have the template, return it:
		if($node._template !== undefined && $node._template !== "") {
			return $node._template;
		} else {
			let $template;
			const $htmlTemplate = $node.querySelector("template"); // look into HTML under node
			if($htmlTemplate) {
				$template = m2d2.utils.htmlElement($htmlTemplate.innerHTML.trim());
			} else {
                switch ($node.tagName) {
                    case "SELECT":
                    case "DATALIST":
                        $template = m2d2.utils.newElement("option");
                        break;
                    case "UL":
                    case "OL":
                        $template = m2d2.utils.newElement("li");
                        break;
                    case "NAV":
                        $template = m2d2.utils.newElement("a");
                        break;
                    case "DL":
                        $template = m2d2.utils.newElement("dd");
                        break;
                    default:
                        if(template) {
                            const children = Object.keys(template).length;
                            if(children) {
                                if(children > 1) {
                                    if(template.tagName !== undefined) { //TODO: document (optional top child when using tagName)
                                        let wrap = {};
                                        wrap[template.tagName] = template;
                                        template = wrap;
                                    } else {
                                        console.log("Template has more than one top elements. Using the first one. In: ");
                                        console.log(template);
                                        console.log("Node: ");
                                        console.log($node);
                                    }
                                }
                                const key = Object.keys(template)[0];
                                const val = template[key];
                                if(m2d2.utils.isValidElement(key)) {
                                    $template = m2d2.utils.newElement(key);
                                } else if(val.tagName !== undefined) {
                                    $template = m2d2.utils.newElement(val.tagName);
                                } else {
                                    console.error("Template defined an element which can not be identified: [" + key + "], using <span> in:");
                                    console.log(template);
                                    console.log("Node: ");
                                    console.log($node);
                                    $template = m2d2.utils.newElement("span");
                                }
                            } else {
                                console.error("Template has no definition and it can not be guessed. Using <span>. Template: ");
                                console.log(template);
                                console.log("Node: ");
                                console.log($node);
                                $template = m2d2.utils.newElement("span");
                            }
                        } else {
                            // If not template is found, use html as of element
                            if($node.childElementCount > 0) {
                                $template = m2d2.utils.htmlElement($node.innerHTML.trim());
                            }
                        }
                        break;
                }
            }
			if (template) {
				if (m2d2.utils.isPlainObject(template)) {
				    const $wrap = m2d2.utils.newEmptyNode();
				    $wrap.append($template);
					const $fragment = this.doDom($wrap, template);
					$template = $fragment.children[0];
					m2d2.utils.defineProp($node, "__template", template); // This is the original template with events
				} else if (m2d2.utils.isHtml(template)) {
					$template = m2d2.utils.htmlElement(template);
				} else if (m2d2.utils.isSelectorID(template)) { //Only IDs are allowed //TODO document
					$template = m2d2.utils.htmlElement(document.querySelector(template).innerHTML);
				} else { //When its just a tag name
					$template = m2d2.utils.newElement(template);
				}
			}
			if($template.childrenElementCount > 1) {
			    console.log("Templates only supports a single child. Multiple children were detected, wrapping them with <span>. Template:");
			    console.log($template);
			    const $span = m2d2.utils.newElement("span");
			    $span.append($template);
			    $template = $span;
			}
			if ($template) {
				m2d2.utils.defineProp($node, "_template", $template); // This is the DOM
			}
			return $template;
		}
	}

	/**
	 * It will set a unique attribute among a group of nodes (grouped by parent)
	 * @private
	 * @param {HTMLElement, Node} $node
	 * @param {string} key
	 */
	setUniqueAttrib($node, key) {
        if(! $node.hasOwnProperty(key)) {
            Object.defineProperty($node, key, {
                get : function()    {
                    return this.hasAttribute(key);
                },
                set : function(val) {
                    const prevSel = this.parentNode ? this.parentNode.find("["+key+"]") : null;
                    if(prevSel) {
                        prevSel.removeAttribute(key);
                    }
					m2d2.utils.setAttr(this, key, val);
                }
            });
        }
	}

	/**
	 * If selector is a Node, will return that node,
	 * otherwise will look inside root
	 * @private
	 * @param {string, HTMLElement, Node} selector
	 * @param {HTMLElement, Node} $root
	 * @returns {HTMLElement, Node}
	 */
    getNode(selector, $root) {
        if ($root === undefined) {
            $root = document;
        }
        return selector instanceof Node ? selector : $root.querySelector(selector);
    };

	/**
	 * Basic Proxy to enable assign values to elements
	 * for example: div.a = "Click me" (instead of using: div.a.text)
	 * NOTE: for reading, "div.a" will return a Node and not the value.
	 * @private
	 * @param {Object} obj
	 * @param {boolean} [force] Force to update
	 * @returns {Proxy, Object}
	 */
	proxy (obj, force) {
	    if(!m2d2.short || (obj === null || (obj._proxy !== undefined && force === undefined))) {
	        return obj;
	    } else {
	        obj._proxy = obj;
            const handler = {
                get: (target, property) => {
                    const t = target[property];
                    switch (true) {
						case t === null || t === undefined: return null;
                    	// Functions should bind target as "this"
						case typeof t === "function": return t.bind(target);
						// If there was a failed attempt to set proxy, return it on read:
						case t._proxy && target["$" + property] !== undefined: return target["$" + property];
						case t._proxy === undefined && m2d2.utils.isElement(t): return this.proxy(t);
						default: return t;
					}
                },
                set: (target, property, value) => {
                    let oldValue = "";
                    if(m2d2.utils.isElement(target[property])) {
                        let key = "";
                        if(m2d2.utils.isHtml(value)) {
                            key = "html";
						} else if(m2d2.utils.hasAttrOrProp(target[property], "value")) {
							key = "value";
						} else if(m2d2.utils.isString(value) && target[property].tagName === "IMG") {
						    key = "src"; //TODO: document
						} else if(m2d2.utils.isString(value) || m2d2.utils.isNumeric(value)) {
                            key = "text";
                        }
                        if(key) {
                            oldValue = target[property][key];
                            target[property][key] = value;
                        }
                    } else if(property === "onupdate") {
                    	if(m2d2.updates) {
							if (m2d2.utils.isFunction(value)) {
								target.addEventListener("update", value, true);
								oldValue = target[property];
								target[property] = value;
							} else {
								console.error("Value passed to 'onupdate' is incorrect, in node:");
								console.log(target);
								console.log("Value: (not a function)");
								console.log(value);
							}
						} else {
                    		console.log("Updates are not available when `m2d2.updates == false`:")
							console.log(target);
						}
                    } else if(property === "items") { //Reset items
                        target.items.clear();
                        this.doItems(target, value);
                    } else {
                        oldValue = target[property];
                        target[property] = value;
                    }
					// Check for onupdate //TODO: document
					// This will observe changes on values
					if(m2d2.updates && target.onupdate !== undefined) {
					    if(value !== oldValue) {
                            target.dispatchEvent(new CustomEvent("update", {
                                detail: {
                                    type     : typeof value,
                                    property : property,
                                    newValue : value,
                                    oldValue : oldValue
                                }
                            }));
					    }
					}
                    return true;
                }
            };
            return new Proxy(obj, handler);
		}
	}

	/**
	 * Function passed to MutationObserver
	 * @private
	 * @param {MutationRecord} mutationsList
	 * @param {MutationObserver} observer
	 */
	onObserve(mutationsList, observer) {
		mutationsList.forEach(m => {
			const target = m.target;
			// We store the events to remove immediately repeated events.
			// Forms will link elements which can not be set as proxy so we
			// add a link named `"$" + key` but this have the side effect to
			// generate two triggers (one for the element and one for the Proxy).
			if(this._storedEvents.indexOf(m) >= 0) { return } else {
				this._storedEvents.push(m);
				setTimeout(() => {
					const i = this._storedEvents.indexOf(m);
					if(i >= 0) { this._storedEvents.splice(i, 1); }
				}, m2d2.storedEventsTimeout); //TODO: this will prevent repeated events to be triggered in less than 50ms : document
			}
			// Check for onupdate //TODO: document
			if(target.onupdate !== undefined) {
				if(m.type === "attributes") {
					const value = m2d2.utils.getAttrOrProp(target, m.attributeName);
					if(value !== m.oldValue) {
                        target.dispatchEvent(new CustomEvent("update", {
                            detail: {
                                type     : typeof value,
                                property : m.attributeName,
                                newValue : value,
                                oldValue : m.oldValue
                            }
                        }));
                    }
				} else if(m.type === "childList") { //TODO: improve for other types
				    const $child = m.addedNodes[0] || m.removedNodes[0];
					if($child.nodeName === "#text") {
						const value = m.addedNodes[0].textContent;
						const oldValue = m.removedNodes[0].textContent;
						if(value !== oldValue) {
                            target.dispatchEvent(new CustomEvent("update", {
                                 detail: {
                                     type     : typeof value,
                                     property : "text",
                                     newValue : value,
                                     oldValue : oldValue
                                 }
                             }));
                         }
					} else if(target.items !== undefined) { //Items updated
					    //TODO: Document: in case of items, "new = added", "old = removed"
						const value = m.addedNodes;
						const oldValue = m.removedNodes;
						if(value !== oldValue) {
                            target.dispatchEvent(new CustomEvent("update", {
                                 detail: {
                                     type     : typeof value,
                                     property : "items",
                                     newValue : value,
                                     oldValue : oldValue
                                 }
                             }));
                         }
					}
				}
			}
		});
	}
	/**
	 * Add MutationObserver to object
	 * @private
	 * @param { HTMLElement } $node
	 */
	observe($node) {
		if(m2d2.updates) {
			const mutationObserver = new MutationObserver(this.onObserve.bind(this))
			const options = {
				attributeOldValue: true
			}
			options.subtree = true;
			options.childList = true;
			const toObserve = $node._proxy || $node;
			mutationObserver.observe(toObserve, options);
		}
	}

	/**
	 * Get the root node as proxy
	 * @private
	 * @param {string|HTMLElement} selector
	 * @param {Object} obj
	 */
	getProxyNode(selector, obj) {
		const $node = this.doDom(selector, obj);
		if($node) {
		    this.observe($node);
		    return this.proxy($node);
		}
	}

	/**
	 * Extends "items"
	 * @private
	 * @param {NodeList, HTMLCollection} $node
	 */
	extendItems($node) {
		// We try to add most of the array functions into NodeList and HTMLCollection:
		// NOTE: Not all will work as expected.
		// NOTE: function() {} is not the same here as () => {} as "this" is not as expected
		function reattach(items) {
			items.forEach(itm => {
				const parent = itm.parentNode;
				const detatchedItem = parent.removeChild(itm);	//We detach from original parent
				$node.append(detatchedItem); //Attach to $node (works with non-existing elements)
			});
		}
		const items = $node.items;
		// Non-Standard or non-existent in Array:
		const nonStd = ["clear", "get", "remove", "selected", "first", "last", "findAll"];
		// Array properties:
		Object.getOwnPropertyNames(Array.prototype).concat(nonStd).forEach(method => {
			if(items[method] === undefined) {
				let func = null;
				const _this = this;
				switch (method) {
				    //-------------------- Same as in Array --------------------------
					case "copyWithin": // copy element from index to index
					case "fill": // replace N elements in array
					case "splice": // add or remove elements
					    func = function() {
					        console.log("Not available yet: " + method);
					    }
					    break;
					case "reverse": // reverse the order
						func = function(...args) {
					        if(this.items.length) {
                                const items = Array.from(this.items); //Keep a copy
                                const retObj = items[method](...args);
                                reattach(items);
                                return retObj;
							}
						}
						break;
					//--------------------- Special Implementation --------------------
					case "clear": // parentNode.replaceChildren() can also be used
						func = function() {
							while(this.items[0]) this.items[0].remove()
						}
						break;
					case "get": // will return the item with data-id:
					    func = function(id) {
					        let found = null;
					        if(this.items.length) {
					            this.items.some(item => {
					                const sameId = m2d2.utils.isNumeric(id) ? (item.dataset.id * 1) === id * 1 : item.dataset.id === id;
					                if(item.dataset && sameId) {
					                    found = item;
					                    return true;
					                }
					            });
					        }
					        return found;
					    }
					    break;
					case "selected": // will return the selected item in list
					    func = function() {
					        return _this.proxy(this.find(":scope > " + "[selected]")); //only direct children
					    }
					    break;
					case "first": // returns the first item in list
					    func = function() {
					        return _this.proxy(this.items[0]);
					    }
					    break;
					case "last": // returns the last item in list
					    func = function() {
					        return _this.proxy(this.items[this.items.length - 1]);
					    }
					    break;
					case "pop" : //Remove and return last element:
					    func = function() {
					        if(this.items.length) {
                                const parent = this[0].parentNode;
                                return _this.proxy(parent.removeChild(this.items[this.items.length - 1]));
					        }
					    }
					    break;
					case "push": // Add one item at the end:
						func = function(obj) {
						    obj = _this.plainToObject(this, obj);
							if(obj instanceof HTMLElement) {
								this.append(obj);
							} else if (m2d2.utils.isPlainObject(obj)) {
							    const index = this.items.length;
							    const $child = _this.getItem(this, index, obj);
							    this.appendChild($child);
							} else {
							    console.log("Trying to push an unknown value into a list:");
							    console.log(obj)
							}
						}
						break;
					case "remove": // will return the item with data-id:
					    func = function(id) {
					        if(this.items.length) {
					            const elem = this.items.get(id);
					            if(elem.length === 1) {
					                elem.remove();
					            }
					        }
					    }
					    break;
					case "shift": // remove and return first item:
					    func = function() {
					        if(this.items.length) {
                                const parent = this.items[0].parentNode;
                                return _this.proxy(parent.removeChild(this.items[0]));
					        }
					    }
					    break;
					case "sort": // You can pass a function to compare items:
						func = function(compareFunc) {
					        if(this.items.length) {
                                const items = Array.from(this.items); //Keep copy
                                items.sort(compareFunc || ((a, b) => {
                                    return a.text.localeCompare(b.text);
                                }));
                                reattach(items);
							}
						}
						break;
					case "unshift": // Add an item to the beginning
						func = function(obj) {
						    obj = _this.plainToObject(this, obj);
							if(obj instanceof HTMLElement) {
								this.prepend(obj);
						    } else if (m2d2.utils.isPlainObject(obj)) {
							    const index = this.items.length;
							    const $child = _this.getItem(this, index, obj);
							    this.prepend($child);
							} else {
							    console.log("Trying to unshift an unknown value into a list:");
							    console.log(obj)
							}
						}
					    break;
					default: //----------------- Link to Array -------------------
					    let arrMethod = method;
						// noinspection FallThroughInSwitchStatementJS
						switch(true) {
					        case method === "findAll":
					            arrMethod = "filter"; // Use "filter"
                            case typeof Array.prototype[method] == "function":
                                // Convert nodes to proxy so we can use short assignment
                                // at, concat, every, filter, find, findIndex, forEach, includes, indexOf, join,
                                // keys, lastIndexOf, map, reduce, reduceRight, slice, some, values
                                const arrFunc = function (...args) {
                                    const proxies = [];
                                    Array.from($node.items).forEach(n => {
                                        proxies.push(_this.proxy(n));
                                    });
                                    return Array.from(proxies)[arrMethod](...args);
                                }
                                switch(method) {
                                    // Change behaviour of find: //TODO: documentation
                                    case "find":
                                        func = function(...args) {
                                            if(m2d2.utils.isString(args[0])) {
                                                return this.find(args[0]);
                                            } else {
                                                return arrFunc(...args);
                                            }
                                        }
                                        break
                                    case "findAll":  //TODO: documentation
                                        func = function(...args) {
                                            if(args.length === 0) {
                                                return this.findAll();
                                            } else if(m2d2.utils.isString(args[0])) {
                                                return this.findAll(args[0]);
                                            } else {
                                                return arrFunc(...args);
                                            }
                                        }
                                        break
                                    case "concat": //TODO: documentation
                                        func = function(...args) {
                                            for(let i = 0; i < args.length; i++) {
                                                if(m2d2.utils.isArray(args[i])) {
                                                    for(let j = 0; j < args[i].length; j++) {
                                                        let obj = args[i][j];
                                                        if(!(obj instanceof HTMLElement)) {
                                                            obj = _this.plainToObject(this, args[i][j]);
                                                            if (m2d2.utils.isPlainObject(obj)) {
							                                    const index = this.items.length;
                                                                obj = _this.getItem(this, index, obj);
                                                            }
                                                        }
                                                        this.items.push(obj);
                                                    }
                                                }
                                            }
                                        }
                                        break
                                    default:
                                        func = arrFunc;
                                        break
                                }
						}
				}
				if(func) {
					m2d2.utils.defineProp(items, method, func.bind($node)); //bind: specify the "this" value
				}
			}
		});
	}
}
/**
 * M2D2 Alerts Extension
 * @since 2021-05-20
 *
 * A replacement of `alert`,`prompt` and `confirm`. Inspired by `SweetAlert`, with
 * customizable theme and better M2D2 integration.
 *
 * This extension provides:
 * $.wait       : Displays a spinner without any button in it.
 * $.alert      : Displays a simple message with "ok" button.
 * $.success    : Same as $.alert, but show a "check" icon.
 * $.failure    : Same as $.alert, but shows a "warning" icon.
 * $.confirm    : Displays a confirmation message with "yes" and "no" buttons.
 * $.prompt     : Displays an input prompt with "cancel" and "send" buttons.
 * $.message    : Free form message (all the previous implementations uses this function)
 * $.closeAll   : Close any message that might be open

 * Documentation :
 * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/alert.md
 * https://github.com/intellisrc/m2d2/tree/master/documentation/alert.md
 */
m2d2.load($ => {
    function close(afterClose) {
        let winExists = $.exists("#m2d2-alert .m2d2-alert-front");
        if(winExists) {
            let win = $("#m2d2-alert .m2d2-alert-front");
            win.css.add("vanish");
            setTimeout(() => {
                let winExists = $.exists("#m2d2-alert .m2d2-alert-front");
                if(winExists) {
                    $("#m2d2-alert").remove(); // Be sure it exists before trying to remove
                }
                if(afterClose) {
                    afterClose();
                }
            }, 400); //Animation takes 500, after that will be restored, so we need to remove it before that time.
        } else {
            if(afterClose) {
                afterClose();
            }
        }
    }
    function getIconClass(type) {
        let css = [];
        switch(type) {
            case "question" :
                css = ["fa", "fa-question-circle"];
            break
            case "info" :
                css = ["fa", "fa-exclamation-circle"];
            break
            case "error":
                css = ["fa", "fa-exclamation-triangle"];
            break
            case "ok":
                css = ["fa", "fa-check"];
            break
            case "input":
                css = ["fa", "fa-edit"];
            break
            case "wait":
                css = ["fa", "fa-cog", "fa-spin"];
            break
        }
        return css
    }
    $.message = function(options) {
        if(options) {
            if(! $.isFunction(options.callback)) {
                if(options.callback &&! options.text) {
                    options.text = options.callback;
                }
                options.callback = () => {}
            }
 		    if(! options.text) { options.text = "" }
        }
        close(() => { // Be sure we have no other alert
            $("body", {
                m2d2Alert : {
                    tagName : "div",
                    id : "m2d2-alert",
                    back : {
                        tagName : "div",
                        css : "m2d2-alert-back",
                        style : {
                            position : "absolute",
                            left :0,
                            right: 0,
                            top : 0,
                            bottom : 0,
                            backgroundColor : "#0005",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                        },
                        front : {
                            tagName : "form",
                            css : (options.css ? ($.isArray(options.css) ? options.css : [options.css]) : [])
                                    .concat(["m2d2-alert-front", "popup", options.icon], getIconClass(options.icon)),
                            style : {
                                zIndex : 100
                            },
                            message : {
                                tagName : "div",
                                css : "m2d2-alert-title",
                                span : options.title
                            },
                            submsg : (() => {
                                let props = {
                                   tagName : "div",
                                   css : "m2d2-alert-text"
                                }
                                let content;
                                if(options.icon === "input" &&! options.text) {
                                    content = {
                                        fieldset : {
                                            css : "m2d2-alert-field",
                                            input : {
                                                type : "text",
                                                name : "answer",
                                                onload : function() {
                                                    this.focus();
                                                }
                                            }
                                        }
                                    }
                                } else if($.isPlainObject(options.text)) {
                                    content = {
                                        fieldset : Object.assign({
                                            css : "m2d2-alert-field"
                                        }, options.text)
                                    }
                                } else {
                                    content = { span : options.text.replace("\n","<br>") }
                                }
                                return Object.assign(props, content);
                            })(options.icon),
                            onsubmit : function() {
                                const data = this.getData();
                                let func;
                                switch(data.button) {
                                    case "ok":
                                    case "yes":
                                        func = () => { options.callback(true, data) };
                                    break
                                    case "no":
                                        func = () => { options.callback(false, data) };
                                    break
                                    case "cancel":
                                        func = () => { options.callback(null, data) };
                                    break
                                    case "send":
                                        if(Object.keys(data).length === 1) {
                                            func = () => { options.callback(data[Object.keys(data)[0]], data) };
                                        } else if(Object.keys(data).length === 2) {
                                            func = () => { options.callback(data[Object.keys(data).find(it => it !== "button")], data) };
                                        } else { // If we have more than one field, we send all:
                                            func = () => { options.callback(data, data) };
                                        }
                                    break
                                    default: // When setting customized buttons, we send all:
                                        func = () => { options.callback(data, data) };
                                    break
                                }
                                close(func);
                                return false;
                            },
                            onload : function () {
                                const def = this.find("[autofocus]");
                                if(def) { def.focus(); }
                            }
                        }
                    }
                }
            });
        });
        if(options.buttons.length) {
            const newButtons = {
                buttons : {
                    tagName : "div",
                    css : "m2d2-alert-buttons"
                }
            };
            options.buttons.forEach(b => {
                const key = b.toLowerCase().replace(/[^a-z ]/g,"").replace(" ","_");
                newButtons.buttons[key] = {
                    tagName : "button",
                    type : "submit",
                    value : key,
                    css : ["color", key],
                    text : $.dict !== undefined ? $.dict(b) : b,
                    autofocus : ["ok","yes"].includes(b),
                    formNoValidate : ["cancel"].includes(b),
                    // we append a hidden input with the value of the button clicked:
                    onclick : function() {
                        $(this.closest("form"), {
                            hide : {
                                tagName : "input",
                                type : "hidden",
                                name : "button",
                                value : this.value
                            }
                        });
                    }
                }
            });
            $("#m2d2-alert .m2d2-alert-front", newButtons);
        }
        // Add automatically name to fields in case it is not specified:
        let i = 1;
        $("#m2d2-alert .m2d2-alert-front").findAll("input, select, textarea").forEach(elem => {
            if(elem.name === "") {
                elem.name = "field_" + i++;
            }
        });
        return { close : close };
    }
    $.wait = (title, text, callback) => {
        return $.message({
            icon : "wait",
            title : title,
            buttons : [],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.alert = (title, text, callback) => {
        return $.message({
            icon : "info",
            title : title,
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.success = (title, text, callback) => {
        return $.message({
            icon : "ok",
            title : title,
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.failure = (title, text, callback) => {
        return $.message({
            icon : "error",
            title : title,
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.confirm = (title, text, callback) => {
        return $.message({
            icon : "question",
            title : title,
            buttons : ["yes", "no"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.prompt = (title, text, callback) => {
        return $.message({
            icon : "input",
            title : title,
            buttons : ["cancel","send"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.closeAll = () => {
        close();
    }
});

/**
 * M2D2 Language Extension
 * @since 2021-06-01
 *
 * Add supports for multi-language interfaces
 *
 * This extension provides:
 * $.dict(keyword, [variables])  : To get translations from dictionary
 * $.lang(lang)                  : Set new language
 *
 * Documentation :
 * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/lang.md
 * https://github.com/intellisrc/m2d2/tree/master/documentation/lang.md
 */
m2d2.load($ => {
    let manualLang = localStorage.getItem("m2d2.lang") || ""
    let language = manualLang || navigator.language;
    function Dictionary(lang) {
        const obj =                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         function(keyword, vars) {
            if(keyword === undefined) return "";
            let msg = obj.val(keyword,true);
            if(vars !== undefined) {
                if(typeof vars == "string"){
                    if(vars !== "") {
                        vars = vars.replace(/;$/,"");
                        const pairs = vars.split(";");
                        vars = {};
                        pairs.forEach(p => {
                            const part = pairs[p].split(":");
                            vars[part[0]] = part[1];
                        });
                    }
                }
                if(typeof vars == "object"){
                    vars.forEach(v => {
                        let kwd = vars[v] + ""; //Be sure its string
                        kwd = obj.val(kwd,false);
                        msg = msg.replace(v,kwd);
                    })
                }
            }
            return msg;
        }
        obj.lang = lang || "en";
        obj.data = {};
        obj.set = function(dictionary) {
            this.data = dictionary;
            return this;
        };
        obj.has = function(keyword, lang) {
            return lang === undefined ? this.data[keyword] !== undefined : this.data[keyword][lang] !== undefined;
        };
        obj.val = function(keyword, report){
            if($.isEmpty(obj.data)) {
                console.error("Dictionary is empty. You need to add a dictionary, for example: `$.dict.set({\n" +
                    "save   : { en : 'Save', es : 'Guardar' },\n" +
                    "cancel : { en : 'Cancel', es : 'Cancelar' }\n" +
                    "yes    : { en : 'Yes', es : 'Si' },\n" +
                    "no     : { en : 'No', es : 'No' }\n" +
                "})`");
                return "";
            }
            if(!keyword){
                console.error("No keyword specified.");
                return "";
            }
            let translation = keyword;
            if(report === undefined) {
                report = false;
            }
            keyword = keyword.toLowerCase();
            if(this.has(keyword)) {
                const baseLang = this.lang.split("-")[0];
                if(this.has(keyword, this.lang)) {
                    translation = this.data[keyword][this.lang];
                } else if(this.has(keyword,baseLang)) {
                    translation = this.data[keyword][baseLang];
                } else {
                    if(report){
                        console.log("Missing translation for lang ["+this.lang+"]: "+keyword);
                    }
                }
            } else {
                if(report){
                    console.log("Missing keyword: "+keyword);
                }
            }
            return translation;
        };
        return obj;
    }

    // Initialize dictionary
    $.dict = new Dictionary(language);

    const langEvents = [];
    $.lang = function(newLang) {
        if(newLang) {
            $.dict.lang = newLang;
            localStorage.setItem("m2d2.lang", $.dict.lang);
        }
        $("body").findAll("[lang]").forEach((elem) => {
            let txt = elem.text;
            // When element has content and (optional) title
            if(txt &&! elem.classList.contains("notxt")) {
                if(elem.dataset.kw === undefined) {
                    elem.dataset.kw = $.lang.getKeyword(txt);
                }
                elem.text = $.dict(elem.dataset.kw);
                const titleKw = elem.dataset.kw + "_title";
                let title = $.dict.has(titleKw) ? $.dict(titleKw) : "";
                if(title) {
                    elem.title = title;
                }
                // When element only has title:
            } else if(elem.title) {
                let title = ""
                if(elem.dataset.kw) {
                    title = $.dict(elem.dataset.kw);
                } else {
                    elem.dataset.kw = $.lang.getKeyword(elem.title);
                    title = $.dict(elem.dataset.kw);
                }
                if(title) {
                    elem.title = title;
                }
            } else if(elem.placeholder) {
                let placeholder = ""
                if(elem.dataset.kw) {
                    placeholder = $.dict(elem.dataset.kw);
                } else {
                    elem.dataset.kw = $.lang.getKeyword(elem.placeholder);
                    placeholder = $.dict(elem.dataset.kw);
                }
                if(placeholder) {
                    elem.placeholder = placeholder;
                }
            } else if(elem.value) {
                let value = ""
                if(elem.dataset.kw) {
                    value = $.dict(elem.dataset.kw);
                } else {
                    elem.dataset.kw = $.lang.getKeyword(elem.value);
                    value = $.dict(elem.dataset.kw);
                }
                if(value) {
                    elem.value = value;
                }
            }
        });
        langEvents.forEach(callback => {
            callback(newLang);
        });
    }
    /**
     * Convert text to keyword
     */
    $.lang.getKeyword = function(text) {
        return text.toLowerCase().trim().replace(/ /g,"_").replace(/[^\w]/g,"").replace(/_$/,"");
    }
    Object.defineProperty($.lang, "onchange", {
        get() { return this },
        set(value) {
            if($.isFunction(value)) {
                langEvents.push(value);
            } else {
                console.log("Unable to set lang.onchange, because it is not a function: ");
                console.log(value);
            }
        }
    })
});
// Translate HTML on ready:
m2d2.ready($ => {
    const manualLang = localStorage.getItem("m2d2.lang") || ""
    const bodyLang = $("body").find("[lang]");
    const htmlLang = $("html").lang || (bodyLang ? bodyLang.lang : null) || "en";
    const isDifferent = manualLang ? htmlLang !== manualLang : htmlLang !== navigator.language.split("-")[0];
    if(isDifferent) { $.lang() }
});
m2d2.load($ => {
    /*
     * M2D2 Storage Extension
     * @author: A. Lepe
     * @since 2021-06-02
     *
     * Wrapper for different kinds of storage.
     * One advantage is that objects are stored with type instead of string.
     *
     * This extension provides:
     * $.local : To get/set values in localStorage
     * $.session : To get/set values in sessionStorage
     *
     * Documentation:
     * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/storage.md
     * https://github.com/intellisrc/m2d2/tree/master/documentation/storage.md
     *
     */
    function Storage(type) {
        switch(type) {
            case 'local'  : if(window.localStorage)     this.store = localStorage; break;
            case 'session': if(window.sessionStorage)   this.store = sessionStorage; break;
        }
        if(this.store == undefined) this.store = localStorage; //Default
        this.set = function(key, val) {
            if(typeof(val) === 'string') {
                val = { '$' : val };
            }
            this.store.setItem(key, JSON.stringify(val));
        }
        this.get = function(key) {
            let val;
            try {
                val = JSON.parse(this.store.getItem(key)) || {};
            } catch(ignore) {
                val = this.store.getItem(key);
            }
            if(val["$"] !== undefined) {
                val = val["$"];
            } else if(Object.keys(val).length === 0 && val.constructor === Object) {
                val = null;
            }
            return val;
        }
        this.del = function(key) { this.store.removeItem(key); }
        this.keys = function() { return Object.keys(this.store).sort(); }
        this.clear = function() { this.store.clear(); }
        this.exists = function(key) { return this.store.hasOwnProperty(key); }
        this.log = function(key, val, n) {
            if(n == undefined) n = 10;
            const tmp = this.get(key) || [];
            tmp.push(val);
            while(tmp.length > n) tmp.shift();
            this.set(key,tmp);
        }
    }
    $.local = new Storage("local");
    $.session = new Storage("session");
});
/**
 *
 * M2D2 Upload Plugin
 * ver. 2021-12-03
 *
 * This extension provides:
 * $.upload
 *
 * Documentation :
 * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/upload.md
 * https://github.com/intellisrc/m2d2/tree/master/documentation/upload.md
 */
 m2d2.load($ => {
    $.upload = function(ev, options) {
      const opts = Object.assign({}, {
            // upload   : "http://localhost/page",
            // onSelect : (files, sources) => { ... },
            // onUpdate : (progress_pct, file, index) => { ... },
            // onDone   : (response, allDone) => { ... }, // response: contains result from the server (JSON), in (S) will trigger each file.
            // onError  : (response) => { ... }, // response: object with relevant information. In (S) will trigger independently.
            // onResponse : (response) => { ... }, // Modify response from server (if needed)
            accept   : "*/*", // You can limit the file type, for example: "image/*", "image/jpg", etc.
            parallel : false, // If false, it will send all files in a sequence (S)
            field    : "file", //Field name
            multiple : true, // Allow multiple files to be selected to upload,
            maxFiles : 0, // Maximum number of files to allow to upload. 0 = unlimited
            maxSizeMb: 0, // Maximum size per file (P) or total (S) to allow
      }, options);
      options = null; // Do not use it later:
      let el = window._protected_reference = document.createElement("INPUT");
      el.name = opts.field;
      el.type = "file";
      if(opts.multiple == true) {
        el.multiple = "multiple";
        //el.name += "[]";  //Enable if you are using PHP
      }
      if(! opts.upload) {
        console.log("Upload not specified. Using current page.")
        opts.upload = "";
      }
      if(opts.onDone == undefined)      { opts.onDone = (response, allDone) => { console.log(response) }}
      if(opts.onError  == undefined)    { opts.onError  = (response) => { console.log("Error : "); console.log(response); }}
      if(opts.onUpdate == undefined)    { opts.onUpdate = (pct, file, index) => { console.log("Uploading : " + pct + "% " + (opts.oneByOne ? "[ " + file.name + " ]" : "")) } }
      if(opts.onResponse == undefined)  { opts.onResponse = (res) => { return res } } // Return it without modifying it

      el.addEventListener('change', () => {
        if (el.files.length) {
            if(opts.maxFiles === 0 | el.files.length <= opts.maxFiles) {
                if(opts.onSelect) {
                    const srcs = [];
                    let totSize = 0;
                    Array.from(el.files).forEach(file => {
                        srcs.push(URL.createObjectURL(file))
                        totSize += file.size;
                    });
                    const mbs = totSize / (1024 * 1024);
                    if(opts.maxSizeMb && mbs > opts.maxSizeMb) {
                        opts.onError("Maximum size exceeded: " + Math.ceil(mbs) + "MB > " + opts.maxSizeMb + "MB")
                        return false;
                    } else {
                        opts.onSelect(el.files, srcs);
                    }
                }
                new Promise(resolve => {
                    if(opts.oneByOne) {
                        let index = 0;
                        const fileDone = Array(el.files.length).fill(false);
                        Array.from(el.files).forEach(file => {
                            new FileUpload(el.name, [file], index++, opts, (data, files, index) => {
                                fileDone[index] = true;
                                const allDone = fileDone.indexOf(false) === -1;
                                opts.onDone(getResponse(data, files, index), allDone);
                                if(allDone) {
                                    resolve();
                                }
                            });
                        });
                    } else {
                        new FileUpload(el.name, el.files, 0, opts, (data, files, index) => {
                            opts.onDone(getResponse(data, files, index), true);
                            resolve();
                        });
                    }
                }).then(() => { // clear / free reference
                  el = window._protected_reference = undefined;
                });
            } else {
                opts.onError("Max file limit exceeded. Maximum files: " + opts.maxFiles);
                return false;
            }
        }
      });
      el.click(); // open dialog
    }

    function getResponse(data, files, index) {
        const response = [];
        data = data || {};
        files.forEach(f => {
            const row = (typeof data == "Array") ? (data.length == files.length ? data[index] : data)
                                                 : (data[f.name] !== undefined ? data[f.name] : data)
            response.push({
                file  : f,
                data  : row,
                index : index++,    // in case of 1x1 it will be called only once, otherwise, it will be incremented.
            });
        });
        return response;
    }
    /**
     * Upload file using XHR
     */
    function FileUpload(fieldName, files, index, options, callback) {
      const xhr     = new XMLHttpRequest();
      files         = Array.from(files);

      xhr.upload.addEventListener("progress", function(e) {
        if (e.lengthComputable) {
          if(options.oneByOne) {
              const percentage = Math.round((e.loaded * 100) / e.total);
              options.onUpdate(percentage, files[0], index);
          } else {
              let sizeAccum = 0;
              let i = 0;
              files.some(f => {
                  sizeAccum += f.size;
                  const percentage = e.loaded >= sizeAccum ? 100 : 100 - Math.round(((sizeAccum - e.loaded) * 100) / f.size);
                  //console.log("File: " + f.name + " Size: " + f.size);
                  //console.log("Loaded: " + e.loaded + " Accum: " + sizeAccum + " Total: " + e.total + " Pct: " + percentage)
                  options.onUpdate(percentage, f, i++);
                  return sizeAccum >= e.loaded;
              });
          }
        }
      }, false);

      xhr.addEventListener("load", function(e) {
        let data = {};
        try {
            data = xhr.responseText ? JSON.parse(xhr.responseText) : {
                error: {type: "Unknown", reason: "Unknown Error"}
            };
        } catch(err) {
            data.error = { type : "Parse Error", reason : err.message }
        }
        if (xhr.status >= 200 && xhr.status < 400) {
            callback(options.onResponse(data), files, index);
        } else {
            if(typeof data.error == "string") {
                data.error = { type : "Exception", reason : data.error }
            }
            options.onError(data.error);
        }
      }, false);

      xhr.open("POST", options.upload);

      const loaded = Array(files.length).fill(false);
      const form    = getFileForm(fieldName, files);
      let loadIndex = 0;
      files.forEach(f => {
          const reader  = new FileReader();
          reader.onload = function(evt) {
            loaded[loadIndex++] = true;
            if(loaded.indexOf(false) === -1) {
                xhr.send(form);
            }
          };
          reader.readAsBinaryString(f);
      });
    }
    /**
     * Prepares form
     */
    function getFileForm(fieldName, files) {
        const form    = new FormData();

        files.forEach(file => {
            form.append(fieldName, file, file.name);
        });

        return form
    }
 });

m2d2.load($ => {
    //------------------------ WS --------------------------------
    /**
     * @author: A.Lepe
     * @version: 210425 : Added secure, host and converted to m2d2 extension
     *           210406 : Retry until reconnect
     * @since : 2018
     * WebSocket wrapper
     *
     * This extension provides:
     * $.ws
     *
     * Documentation :
     * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/ws.md
     * https://github.com/intellisrc/m2d2/tree/master/documentation/ws.md
     */
    class ws {
        request(msg) {
            if (msg) {
                try {
                    this.webSocket.send(JSON.stringify(msg));
                } catch(e) {
                    this.webSocket.onerror(e);
                }
            }
        }
        /**
         * Connect and return the websocket object
         */
        getSocket(onMessage, onOpen, onClose) {
            const webSocket = new WebSocket(this.path);
            webSocket.onopen = onOpen;
            webSocket.onclose = onClose;
            webSocket.onmessage = (res) => {
                if (res.data) {
                    try {
                        onMessage(JSON.parse(res.data));
                    } catch(e) {
                        webSocket.onerror(e);
                    }
                }
            }
            webSocket.onerror = (err) => {
                console.error('Socket encountered error: ', err ? err.message : 'Unknown', 'Closing socket');
                const wsk = webSocket || this;
                if(wsk.readyState === 1) {
                    wsk.close();
                }
            }
            return webSocket;
        }
        connect(options, onMessage) {
            this.initRequest = options.request || null;
            this.onConnect = options.connected || (() => {});
            this.onDisconnect = options.disconnected || (() => {});
            this.reconnect = options.reconnect !== false;
            this.host = options.host || window.location.hostname;
            this.secure = options.secure === true;
            this.port = options.port || (this.secure ? 443 : 80);
            this.path = "ws" + (this.secure ? "s" : "") + "://" + this.host + ":" + this.port + "/" + (options.path || "");
            this.connected = false;
            this.interval = null;
            //-------- Connect ----------
            const onOpen = (e) => {
                this.connected = true;
                this.request(this.initRequest);
                this.onConnect();
            }
            const onClose = (e) => {
                this.connected = false;
                this.onDisconnect();
                if(!this.interval && this.reconnect) {
                    this.interval = setInterval(() => {
                        if(this.connected) {
                            console.log("Reconnected...")
                            clearInterval(this.interval);
                            this.interval = null;
                        } else {
                            try {
                                this.webSocket.close();
                                console.log("Reconnecting...")
                                this.webSocket = this.getSocket(onMessage, onOpen, onClose);
                            } catch(ignore) {}
                        }
                    }, 2000);
                }
            }
            this.webSocket = this.getSocket(onMessage, onOpen, onClose);
        }
        disconnect() {
            this.reconnect = false;
            this.webSocket.close();
        }
    }
    $.ws = new ws();
});
m2d2.load($ => {
    /**
     * @version 2020-05-09
     * @author A.Lepe (dev@alepe.com)
     * XHR implementation
     *
     * This extension provides:
     * $.get
     * $.post
     * $.put
     * $.delete
     * $.connect
     * $.options
     * $.trace
     * $.patch
     *
     * Documentation :
     * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/xhr.md
     * https://github.com/intellisrc/m2d2/tree/master/documentation/xhr.md
     */

     /**
     * @param method: HTTP method (GET, POST, PUT, DELETE)
     * @param url: service URL
     * @param data: Data object to send (in case of POST and PUT)
     * @param callback: Callback on Success (it will return data)
     * @param error_callback: Callback on Failure
     * @param json : Boolean (if set, it will set request content-type as json and in case of GET, it will send it as body instead of query)
     */
    const XHR = function(method, url, data, callback, error_callback, json) {
        const request = new XMLHttpRequest();
        if(json === undefined) { json = false }
        if(error_callback === undefined) { error_callback = function(e) { console.log(e); } }
        if(data && Object.entries(data).length === 0) {
            data = "";
        }
        if(data) {
            if(json) {
                data = JSON.stringify(data);
            } else {
                switch(method.toUpperCase()) {
                    case "GET":
                        url += (url.indexOf("?") !== -1 ? "&" : "?") + (Object.keys(data).map(key => key + '=' + data[key]).join('&'));
                        data = "";
                        break
                    default:
                        data = (Object.keys(data).map(key => key + '=' + data[key]).join('&'));
                }
            }
        }
        request.open(method, url, true);
        if(json) {
            request.setRequestHeader('Content-Type', 'application/json');
        } else {
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        request.onerror = function(e) {
            error_callback({type : "Connection", reason: "Connection Refused"});
        }
        request.onload = function() {
            let data = {};
            try {
                data = request.responseText ? JSON.parse(request.responseText) : {
                    error: {type: "Unknown", reason: "Unknown Error"}
                };
            } catch(err) {
                data.error = { type : "Parse Error", reason : err.message }
            }
            if (request.status >= 200 && request.status < 400) {
                if(callback !== undefined) {
                    callback(data);
                }
            } else {
                if(error_callback !== undefined) {
                    if(typeof data.error == "string") {
                        data.error = { type : "Exception", reason : data.error }
                    }
                    error_callback(data.error);
                }
            }
        };
        request.send(data);
        return request;
    };
    /**
     * Short method. It also validates arguments and allow omitting some, eg.:
     * xhr.get(url, data, callback, error_callback, json);
     * xhr.get(url, callback, error_callback, json);
     * xhr.get(url, data, callback, json);
     * xhr.get(url, data, json);
     * xhr.get(url, callback, json);
     */
    const xhr = {};
    ["get","post","put","delete","connect","options","trace","patch"].forEach(function(method) {
        xhr[method] = function() {
            let url, data, callback, error_callback, json;
            // noinspection FallThroughInSwitchStatementJS
            switch(arguments.length) {
                case 5:
                    if(typeof arguments[4] == "boolean") {
                        json = arguments[4];
                    } else {
                        console.log("Passed JSON argument: " + arguments[4] + " is not boolean.");
                    }
                case 4:
                    if(typeof arguments[3] == "function") {
                        error_callback = arguments[3];
                    } else if(arguments.length === 4 && typeof arguments[3] == "boolean") {
                        // Make error callback optional:
                        json = arguments[3];
                    } else {
                        console.log("Passed argument 4: " + arguments[3] + " is mistaken");
                    }
                case 3:
                    if(typeof arguments[2] == "function") {
                        if(typeof arguments[1] == "function" && arguments.length < 5) {
                            error_callback = arguments[2];
                        } else {
                            callback = arguments[2];
                        }
                    } else if(arguments.length === 3 && typeof arguments[2] == "boolean") {
                        // Make callback and error callback optional:
                        json = arguments[2];
                    } else {
                        console.log("Passed argument 3: " + arguments[2] + " is mistaken");
                    }
                case 2:
                    if(typeof arguments[1] == "object" || typeof arguments[1] == "string") {
                        data = arguments[1];
                    } else if(typeof arguments[1] == "function") {
                        // Make data optional:
                        callback = arguments[1];
                    } else {
                        console.log("Passed argument 2: " + arguments[1] + " is mistaken");
                    }
                case 1:
                    if(typeof arguments[0] == "string") {
                        url = arguments[0];
                    } else if(Array.isArray(arguments[0])) {
                        url = arguments[0].join("/");
                    } else {
                        console.log("Passed URL: "+arguments[0]+" was not a string.");
                    }
                    break;
                default:
                    console.log("Incorrect number of arguments passed to xhr");
            }
            if(data === undefined) { data = {} }
            /*
            console.log("URL: " + url);
            console.log("DATA: " + data);
            console.log("CALLBACK: " + callback);
            console.log("ERROR CALLBACK: " + error_callback);
            console.log("JSON: " + json);
            */
            return XHR(method.toUpperCase(), url, data, callback, error_callback, json);
        }
    });
    Object.assign($, xhr);
});
return m2d2;
}));
