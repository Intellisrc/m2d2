/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * @version: 2.0.0
 * @updated: 2021-04-16
 **/
/**
 * M2D2 Class
 */
class M2D2 {
	constructor() {}
	/**
	 * M2 Will set all extensions to DOM objects
	 * @param {string, HTMLElement} selector
	 * @param {HTMLElement} $root
	 * @returns {HTMLElement}
	 */
	extDom(selector, $root) {
		if(! selector) { return; } // Do not proceed if selector is null, empty or undefined
		const $node = Utils.isNode(selector) ? selector : ($root || document).querySelector(selector);
		if($node._m2d2 === undefined) {
			$node._m2d2 = true; //flag to prevent it from re-assign methods
			// TODO: innerText not sure if its the best approach:
			Object.defineProperty($node, "text", {
				get() { return this.childNodes.length ? this.innerText : this.textContent; },
				set(value) { if(this.childNodes.length) { this.innerText = value } else { this.textContent = value }; }
			});
			Object.defineProperty($node, "html", {
				get() { return this.innerHTML; },
				set(value) { this.innerHTML = value;  }
			});
			["find","findAll"].forEach(f => {
				if($node.hasOwnProperty(f)) {
					console.log("Node already had ["+f+"] property. It might cause unexpected behaviour.")
					console.log("You may need to update the M2D2 version or report it to: github.com/lepe/m2d2/")
				}
			});
			return Object.assign($node, {
				find: (it) => {
					return this.extDom($node.querySelector(it));
				},
				findAll: (it) => {
					const nodeList = $node.querySelectorAll(it);
					nodeList.forEach(n => { this.extDom(n) });
					return nodeList;
				}
			});
		} else {
			return $node;
		}
	}
	/**
	 * M2D2 will create custom links and properties
	 * @param {string, HTMLElement} selector
	 * @param {Object} object
	 * @returns {HTMLElement, Proxy}
	 */
	doDom(selector, object) {
		// When no selector is specified, set "body"
		if(Utils.isObject(selector) && object === undefined) {
			object = selector;
			selector = "body";
		}
		if(!((Utils.isString(selector) || Utils.isNode(selector)) && Utils.isObject(object))) {
			console.error("Passed parameters to m2d2 are wrong.")
			console.log("First parameter must be string:")
			console.log(selector);
			console.log("Second parameter must be an object:")
			console.log(object);
			return;
		}
		const $node = this.extDom(selector); // Be sure that $node is an extended DOM object
		Object.keys(object).forEach(k => {
			let value = object[k];
			//Look for property first:
			let isProp = this.hasProp($node, k);
			let isAttr = this.hasAttr($node, k);
			//Identify if value matches property type:
			let foundMatch = false;
			if(isAttr || isProp) {
				// noinspection FallThroughInSwitchStatementJS
				switch(true) {
					// Math found:
					case k === "value" && this.hasProp($node, "valueAsDate") && value instanceof Date: // Dates
						k = "valueAsDate"; //renamed value to valueAsDate
					case typeof value === typeof $node[k]: //Same Time
					case Utils.isString($node[k]) && Utils.isNumeric(value): //Numeric properties
					case (Utils.isFunction(value) && Utils.isObject($node[k])): //Functions
					case Utils.isBool(value) && Utils.isString($node[k]): //Boolean
						foundMatch = true;
						break;
				}
			}
			// Properties and Attributes:
			if(foundMatch) {
				let error = false;
				switch(k) {
					case "classList":
						if(Utils.isArray(value)) {
							value.forEach(v => {
								$node[k].add(v);
							});
						} else if(Utils.isString(value)) {
							$node[k].add(value);
						} else {
							error = true;
						}
						break
					case "style":
					case "dataset":
						if(Utils.isPlainObject(value)) {
							Object.assign($node[k], value);
						} else {
							error = true;
						}
						break
					default:
						switch(true) {
							case Utils.isBool(value): // boolean properties
                                this.setPropOrAttr($node, k, value);
								break;
							default:
								$node[k] = value;
						}
				}
				if(error) {
					console.error("Invalid value passed to '" + k + "': ")
					console.log(value);
					console.log("Into Node:");
					console.log($node);
				}
				// Look for elements:
			} else {
				//Look for ID:
				let $nodeId = $node.find("#" + k);
				//Look for class:
				let $nodeCss = $node.find("." + k);	//TODO: findAll
				//Look for element or free selector (e.g: "div > span"):
				let $nodeElem = $node.find(k);			//TODO: findAll
				//Look for name:
				let $nodeName = $node.find("[name="+k+"]");
				//Remove all "not found":
				const options = Utils.cleanArray([$nodeId, $nodeCss, $nodeElem, $nodeName]);
				if(options.length > 1) {
					console.error("Multiple options found for key: " + k + " under element: ");
					console.log($node);
					console.log("Options: ");
					options.forEach(o => { console.log(o); });
					console.log("Please rename key or adjust DOM");
				} else if(options.length === 1) { //Found single option: fill
					const opt = options[0];
					if(Utils.isNode(opt)) {
						if(Utils.isArray(value)) { // Process Array:
							const template = object["template"];
							this.doItems(opt, value, template);
							this.linkNode($node, k, opt);
						} else {
							this.renderAndLink($node, opt, k, value);
						}
					} else {
						console.error("BUG: It should have been a node but got: ");
						console.log(opt);
						console.log("Parent node:")
						console.log($node);
					}
				} else if(options.length === 0) { //No options found: create
					if(this.isValidElement(k)) {
						const $newNode = this.appendElement($node, k);
						this.renderAndLink($node, $newNode, k, value);
					} else if(value.tagName !== undefined) {
						const tag = value.tagName;
						const $newNode = this.appendElement($node, tag);
						delete(value.tagName);
						this.renderAndLink($node, $newNode, k, value);
					} else if(k === "items") { //Items creation
						const template = object["template"];
						// Process Array:
						if(Utils.isArray(value)) {
							this.doItems($node, value, template);
						} else {
							console.log("Warning: 'items' specified but value is not and array, in element: ");
							console.log($node);
							console.log("Passed values are: ");
							console.log(value);
						}
					} else if(k !== "template") { //We handle templates inside items
						console.error("Not sure what you want to do with key: " + k + " under element: ");
						console.log($node);
						console.log("And object:");
						console.log(object);
					}
				}
			}
		});
		return $node;
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
		if(!Utils.isObject(value)) {
			// When setting values to the node (simplified version):
			if(Utils.isHtml(value)) {
				value = { html : value };
			} else if(Utils.isString(value) || Utils.isNumeric(value)) {
				value = { text : value };
			} else if(this.hasProp($node, "value")) {
				value = { value : value };
			}
		}
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
		if(this.hasAttrOrProp($node, key)) { // Only if its not an attribute or property, we "link" it.
			$node["$" + key] = $child; //Replace name with "$" + name
			console.log("Property : " + key + " existed in node: " + $node.tagName +
			". Using $" + key + " instead for node: " + $child.tagName + ".")
		} else {
			$node[key] = $child;
		}
	}
	/**
	 * Returns true if the tag is a registered HTMLElement
	 * @private
	 * @param {string} tagName
	 * @returns {boolean}
	 */
	isValidElement(tagName) {
		const $node = Utils.newNode(tagName);
		return $node.constructor.name !== "HTMLUnknownElement";
	}
	/**
	 * Creates a dom element inside $node
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} tagName
	 * @returns {HTMLElement}
	 */
	appendElement ($node, tagName) {
		const $newElem = Utils.newNode(tagName);
		$node.append($newElem);
		return $newElem;
	}

    /**
     * Get an item to be added
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
        return this.doDom($newItem, obj);
	}

	/**
	 * Process items
	 * @private
	 * @param {HTMLElement} $node
	 * @param {Array} values
	 * @param {Object} template
	 */
	doItems ($node, values, template) {
		const $template = this.getTemplate($node, template);
		const $outElem = new DocumentFragment()
		let i = 0;
		values.forEach(val => {
		    const $newItem = this.getItem($node, i++, val, $template);
			$outElem.appendChild($newItem);
		});
		//Update all at once
		//$elem.append(...$outElem.childNodes); <-- works but it is slower
		while ($outElem.firstChild) {
			$node.appendChild($outElem.firstChild);
		}
		//Cleanup
		const $temp = $node.find("template");
		if($temp) { $node.removeChild($temp); }
		//Set "items" link:
		$node.items = $node.children;
		this.extendItems($node);
	}
	/** Returns a copy of the model to duplicate
	 * @private
	 * @param {HTMLElement} $node
	 * @param {Object, string} template
	 * @returns {HTMLElement}
	 */
	getTemplate ($node, template) {
		// If we already have the template, return it:
		if($node._template !== undefined && $node._template !== "") {
			return $node._template;
		} else {
			let $template;
			if (template) {
				if (Utils.isPlainObject(template)) {
					const $base = Utils.newNode("div");
					$template = this.doDom($base, template);
				} else if (Utils.isHtml(template)) {
					$template = Utils.htmlNode("<div>" + template + "</div>");
				} else if (Utils.isSelectorID(template)) { //Only IDs are allowed
					$template = document.querySelector(template);
				} else { //When its just a tag name
					$template = Utils.htmlNode("<div>" + Utils.newNode(template).outerHTML + "</div>");
				}
				if($template && $template.childElementCount > 0) {
					$template = $template.firstChild;
				}
			} else if($node.find("template")) {	// No template specified, look into HTML under node:
				$template = Utils.htmlNode(Utils.node("template", $node).innerHTML);
			} else {
				switch ($node.tagName) {
					case "SELECT":
					case "DATALIST":
						$template = Utils.newNode("option");
						break;
					case "UL":
					case "OL":
						$template = Utils.newNode("li");
						break;
					case "NAV":
						$template = Utils.newNode("a");
						break;
					case "DL":
						$template = Utils.htmlNode("<dt></dt><dd></dd>");
						break;
					default:
						// If not template is found, use html as of element
						if($node.childElementCount > 0) {
							$template = $node.firstChild.cloneNode(true);
						}
						break;
				}
			}
			if ($template) {
				this.defineProp($node, "_template", $template);
			}
			return $template;
		}
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
		if($node && !Utils.isNumeric(attr)) {
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
		if($node && !Utils.isNumeric(prop)) {
			hasProp = $node[prop] !== undefined &&! $node.hasAttribute(prop);
		}
		return hasProp;
	}

	/**
	 * Set the value of a property which is true/false
	 *
	 */
	setPropOrAttr ($node, key, value) {
	    if(this.hasProp($node, key)) {
            $node[key] = value;
	    } else {
	        this.setAttr($node, key, value);
    	}
	}

    /**
     * Set attribute to node. If value is false, will remove it.
     */
	setAttr ($node, key, value) {
        if(value) {
            $node.setAttribute(key, value);
        } else {
            $node.removeAttribute(key);
        }
	}

	/**
	 * It will set a unique attribute among a group of nodes (grouped by parent)
	 */
	setUniqueAttrib($node, key) {
	    const _this = this;
        if(! $node.hasOwnProperty(key)) {
            Object.defineProperty($node, key, {
                get : function()    {
                    return this.hasAttribute(key);
                },
                set : function(val) {
                    const prevSel = this.parentNode.find("["+key+"]");
                    if(prevSel) {
                        prevSel.removeAttribute(key);
                    }
                    _this.setAttr(this, key, val);
                }
            });
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
		if(Utils.isObject(obj)) {
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
	 * Basic Proxy to enable assign values to elements
	 * for example: div.a = "Click me" (instead of using: div.a.text)
	 * NOTE: for reading, "div.a" will return a Node and not the value.
	 * @private
	 * @param {Object} obj
	 * @returns {Proxy, Object}
	 */
	proxy (obj) {
		const handler = {
			get: (target, property, receiver) => {
				return target[property];
			},
			set: (target, property, value) => {
				if(Utils.isNode(target[property])) {
					let key = "";
					if(Utils.isHtml(value)) {
						key = "html";
					} else if(Utils.isString(value)) {
						key = "text";
					} else if(this.hasProp(target[property], "value")) {
						key = "value";
					}
					if(key) {
						target[property][key] = value;
					}
				} else {
					target[property] = value;
				}
				return true;
			}
		};
		return new Proxy(obj, handler);
	}

	/**
	 * Get the root node as proxy
	 */
	getProxyNode(selector, obj) {
	    return this.proxy(this.doDom(selector, obj));
	}

	/**
	 * Extends "items"
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
				$node.appendChild(detatchedItem); //Attach to $node (works with non-existing elements)
			});
		}
		const items = $node.items;
		// Non-Standard or non-existent in Array:
		const nonStd = ["clear", "getId", "removeId"];
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
                                const items = Array.from(this.items);
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
					case "getId": // will return the item with data-id:
					    func = function(id) {
					        let found = null;
					        if(this.items.length) {
					            this.items.forEach(item => {
					                if(item.dataset && (item.dataset.id * 1) === id) {
					                    found = item;
					                    return;
					                }
					            });
					        }
					        return found;
					    }
					    break;
					case "pop" : //Remove and return last element:
					    func = function() {
					        if(this.items.length) {
                                const parent = this[0].parentNode;
                                const last = parent.removeChild(this.items[this.items.length - 1]);
                                return last;
					        }
					    }
					    break;
					case "push": // Add one item at the end:
						func = function(obj) {
							if(obj instanceof HTMLElement) {
								this.appendChild(obj);
							} else if (Utils.isPlainObject(obj)) {
							    const index = this.items.length;
							    const $child = _this.getItem(this, index, obj);
							    this.appendChild($child);
							}
						}
						break;
					case "removeId": // will return the item with data-id:
					    func = function(id) {
					        if(this.items.length) {
					            this.items.forEach(item => {
					                if(item.dataset && (item.dataset.id * 1) === id) {
					                    item.remove();
					                    return;
					                }
					            });
					        }
					    }
					    break;
					case "shift": // remove and return first item:
					    func = function() {
					        if(this.items.length) {
                                const parent = this.items[0].parentNode;
                                const first = parent.removeChild(this.items[0]);
                                return first;
					        }
					    }
					    break;
					case "sort": // You can pass a function to compare items:
						func = function(compareFunc) {
					        if(this.items.length) {
                                const items = Array.from(this.items);
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
							} else if (Utils.isPlainObject(obj)) {
							    const index = this.items.length;
							    const $child = _this.getItem(this, index, obj);
							    this.prepend($child);
							}
						}
					    break;
					default: //----------------- Link to Array -------------------
					    // at, every, filter, find, findIndex, forEach, includes, indexOf, join, keys, lastIndexOf,
					    // map, reduce, reduceRight, slice, some, values
						if(typeof Array.prototype[method] == "function") {
							func = Array.prototype[method];
						}
				}
				if(func) {
					this.defineProp(items, method, func.bind($node)); //bind: specify the "this" value
				}
			}
		});
	}
}
/**
 * Easy way to attach to DOMContentLoaded
 */
document.ready = (callback) => {
	const m2d2 = new M2D2();
	document.addEventListener("DOMContentLoaded", () => {
		callback((s, o) => { return m2d2.getProxyNode(s, o) }, (s) => { return m2d2.extDom(s) })
	});
}
