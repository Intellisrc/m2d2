/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
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
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
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
				$node.getData = function () {
					const data = {};
					const fd = new FormData(this);
					for (let pair of fd.entries()) {
						if(pair[1] !== "") {
							data[pair[0]] = pair[1];
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
		const $node = this.extDom(selector); // Be sure that $node is an extended DOM object
		// If there is no object return only extension
		if(object === undefined) { //TODO: documentation: extending nodes
			return $node;
		}
		object = this.plainToObject($node, object); // Be sure it's an object //TODO: documentation : text parameter
		Object.keys(object).forEach(key => {
			let value = object[key];
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
                            elem = $node.find("[name="+key+"]");
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
					if(object.warn === undefined || object.warn !== false) { //TODO: document
						console.log("Multiple elements were assigned with key: [" + key + "] under node: ")
						console.log($node);
						console.log("It might be what we expect, but if it is not expected it could result " +
									"on some elements mistakenly rendered. You can specify " +
									"'warn : false' under that node to hide this message.")
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
					if(m2d2.utils.isValidElement(key) &&! isFunc) {
						const $newNode = this.appendElement($node, key);
						this.renderAndLink($node, $newNode, key, value);
					} else if(value.tagName !== undefined) {
						const tag = value.tagName;
						const $newNode = this.appendElement($node, tag);
						delete(value.tagName);
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
							if (key === "onupdate") {
								$node.addEventListener(key, value, true);
							}
							$node[key] = value;
						}
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
                const loadedEvent = new CustomEvent('onload');
		        $node.addEventListener("onload", $node.onload, true);
		        $node.dispatchEvent(loadedEvent);
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
		if(!m2d2.utils.isPlainObject(value) &&! m2d2.utils.isFunction(value)) {
			// When setting values to the node (simplified version):
			if(m2d2.utils.isHtml(value)) {
				value = { html : value };
			} else if(m2d2.utils.hasProp($node, "value")) {
				value = { value : value };
			} else if(m2d2.utils.isString(value) || m2d2.utils.isNumeric(value)) {
				value = { text : value };
			} else if(m2d2.utils.isArray(value)) {
			    value = { items : value };
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
        $newItem.dataset.id = index;

        // Add "selected" property
        this.setUniqueAttrib($newItem, "selected"); //TODO: Document
        // Set values
		let $newNode = this.doDom($newItem, obj);
		// Place Events:
		return this.getItemWithEvents($node, $newNode);
	}

	/**
	 * Returns a Node with events
	 * @param {HTMLElement, Node} $node
	 * @param {HTMLElement, Node} $newNode
	 * @returns {HTMLElement|Proxy}
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
                get: (target, property, receiver) => {
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
								target.addEventListener("onupdate", value, true);
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
                            target.dispatchEvent(new CustomEvent("onupdate", {
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
                        target.dispatchEvent(new CustomEvent("onupdate", {
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
                            target.dispatchEvent(new CustomEvent("onupdate", {
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
                            target.dispatchEvent(new CustomEvent("onupdate", {
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
		this.observe($node);
		return this.proxy($node);
	}

	/**
	 * Extends "items"
	 * @private
	 * @param {NodeList, HTMLCollection} $node
	 */
	extendItems($node) {
	    const _this = this;
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
					case "copyWithin": // copy element from index to index FIXME
					case "fill": // replace N elements in array FIXME
					case "splice": // add or remove elements
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
							if(obj instanceof HTMLElement) {
								this.append(obj);
							} else if (m2d2.utils.isPlainObject(obj)) {
							    const index = this.items.length;
							    const $child = _this.getItem(this, index, obj);
							    this.appendChild($child);
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
							if(obj instanceof HTMLElement) {
								this.prepend(obj);
						} else if (m2d2.utils.isPlainObject(obj)) {
							    const index = this.items.length;
							    const $child = _this.getItem(this, index, obj);
							    this.prepend($child);
							}
						}
					    break;
					default: //----------------- Link to Array -------------------
					    let arrMethod = method;
					    switch(true) {
					        case method === "findAll":
					            arrMethod = "filter"; // Use "filter"
                            case typeof Array.prototype[method] == "function":
                                // Convert nodes to proxy so we can use short assignment
                                // at, every, filter, find, findIndex, forEach, includes, indexOf, join,
                                // keys, lastIndexOf, map, reduce, reduceRight, slice, some, values
                                const arrFunc = function (...args) {
                                    const proxies = [];
                                    Array.from($node.items).forEach(n => {
                                        proxies.push(_this.proxy(n));
                                    });
                                    return Array.from(proxies)[arrMethod](...args);
                                }
                                // Change behaviour of find: //TODO: documentation
                                if(method === "find") {
                                    func = function(...args) {
                                        if(m2d2.utils.isString(args[0])) {
                                            return this.find(args[0]);
                                        } else {
                                            return arrFunc(...args);
                                        }
                                    }
                                } else if(method === "findAll") {  //TODO: documentation
                                    func = function(...args) {
                                        if(args.length === 0) {
                                            return this.findAll();
                                        } else if(m2d2.utils.isString(args[0])) {
                                            return this.findAll(args[0]);
                                        } else {
                                            return arrFunc(...args);
                                        }
                                    }
                                } else {
                                    func = arrFunc;
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