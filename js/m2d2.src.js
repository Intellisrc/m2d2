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
	static instance = new M2D2();
	static collection = {}
	static ready(callback) {
		document.addEventListener("DOMContentLoaded", () => {
			let m = (selector, object) => {
				return this.instance.getProxyNode(selector, object)
			}
			// Additional features:
			m.ext = this.instance.extDom
			const handler = {
				get: (target, property, receiver) => {
					return this.collection[property];
				},
				set: (target, property, value) => {
					this.collection[property] = value;
					return true;
				}
			};
			m = new Proxy(m, handler);
			const ret = callback(m);
			if(ret) {
				Object.getOwnPropertyNames(ret).forEach(o => {
					this.collection[o] = ret[o];
				});
			}
		});
	}
	/**
	 * M2 Will set all extensions to DOM objects
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
		const $node = Utils.isNode(selector) ? selector : $root.querySelector(selector);
		if(! $node) {
			if(Utils.isString(selector)) {
				console.error("Selector: " + selector + " didn't match any element in node:");
				console.log($root);
			} else {
				console.error("Node was null");
			}
			return null;
		}
		if($node._m2d2 === undefined) {
			$node._m2d2 = true; //flag to prevent it from re-assign methods
			Object.defineProperty($node, "text", {
				get() { return this.childNodes.length ? this.innerText : this.textContent; },
				set(value) {
					// text should only change Text nodes and not children: //TODO: documentation
					if(this.childNodes.length) {
						this.childNodes.forEach(n => {
							if(n.constructor.name === "Text") {
								n.nodeValue = value;
							}
						})
					} else {
						this.textContent = value
					}
				}
			});
			Object.defineProperty($node, "html", {
				get() { return this.innerHTML; },
				set(value) { this.innerHTML = value;  }
			});
			["find","findAll","onupdate"].forEach(f => {
				if($node.hasOwnProperty(f)) {
					console.log("Node already had ["+f+"] property. It might cause unexpected behaviour.")
					console.log("You may need to update the M2D2 version or report it to: github.com/lepe/m2d2/")
				}
			});
			return Object.assign($node, {
				find: (it) => {
					const node = $node.querySelector(it)
					return node ? this.extDom(node) : null;
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
	 * @param {string, HTMLElement, Node} selector
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
			return null;
		}
		const $node = this.extDom(selector); // Be sure that $node is an extended DOM object
		Object.keys(object).forEach(key => {
			let value = object[key];
			//Look for property first:
			let isProp = this.hasProp($node, key);
			let isAttr = this.hasAttr($node, key);
			//Identify if value matches property type:
			let foundMatch = false;
			if(isAttr || isProp) {
				// noinspection FallThroughInSwitchStatementJS
				switch(true) {
					// Math found:
					case key === "value" && this.hasProp($node, "valueAsDate") && value instanceof Date: // Dates
						key = "valueAsDate"; //renamed value to valueAsDate
					case typeof value === typeof $node[key]: //Same Time
					case Utils.isString($node[key]) && Utils.isNumeric(value): //Numeric properties
					case (Utils.isFunction(value) && Utils.isObject($node[key])): //Functions
					case Utils.isBool(value) && Utils.isString($node[key]): //Boolean
						foundMatch = true;
						break;
				}
			}
			// Properties and Attributes:
			if(foundMatch) {
				let error = false;
				switch(key) {
					case "classList":
						if(Utils.isArray(value)) {
							value.forEach(v => {
								$node[key].add(v);
							});
						} else if(Utils.isString(value)) {
							$node[key].add(value);
						} else {
							error = true;
						}
						break
					case "style":
					case "dataset":
						if(Utils.isPlainObject(value)) {
							Object.assign($node[key], value);
						} else {
							error = true;
						}
						break
					default:
						switch(true) {
							case Utils.isBool(value): // boolean properties
                                this.setPropOrAttr($node, key, value);
								break;
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
                    //Look for ID:
                    if(key && key.match(/^\w/)) {
                        let elem = $node.find("#" + key);
                        if(elem) { options.push(elem); }
                        //Look for name:
                        elem = $node.find("[name="+key+"]");
                        if(elem) { options.push(elem); }
                        //Look for class:
                        const elems = $node.findAll("." + key);
                        if(elems.length > 0) { options.push(elems); }
                    }
                    //Look for element or free selector (e.g: "div > span"):
                    const elems = $node.findAll(key);
                    if(elems.length > 0) { options.push(elems); }
				} catch(e) {
				    console.error("Invalid selector: " + key);
				    console.log(e);
				    return;
				}
				if(options.length > 1) {
					console.error("Multiple options found for key: " + key + " under element: ");
					console.log($node);
					console.log("Options: ");
					options.forEach(o => { console.log(o); });
					console.log("Please rename key or adjust DOM");
				} else if(options.length === 1) { // Found single option: place values
					const opt = options[0];
					if(opt instanceof NodeList) { // Multiple nodes
					    if(opt.length === 1) { // Normal Object:
							this.renderAndLink($node, opt[0], key, value);
					    } else { //TODO: Document : multiple elements become array
					        const items = [];
                            opt.forEach(item => {
                                items.push(this.render(item, key, value));
                            });
                            this.linkNode($node, key, items);
                        }
					} else if(Utils.isNode(opt)) {
						if(Utils.isArray(value)) { // Process Array
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
					if(this.isValidElement(key)) {
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
						if(Utils.isPlainObject(value)) {
						    const valTmp = [];
						    Object.keys(value).forEach(o => {
						        const obj = {
                                    text  : value[o]
						        };
						        if(this.hasAttrOrProp($node, "value")) {
                                    obj.value = o;
                                } else {
                                    obj.dataset = { id : o };
                                }
                                valTmp.push(obj);
						    });
						    value = valTmp;
						}
						// Process Array:
						if(Utils.isArray(value)) {
							this.doItems($node, value, template);
						} else {
							console.log("Warning: 'items' specified but value is not and array, in element: ");
							console.log($node);
							console.log("Passed values are: ");
							console.log(value);
						}
    				} else if(Utils.isFunction(value)) {
    				    if(key === "onupdate") {
    				        $node.addEventListener(key, value);
    				    }
						$node[key] = value;
					} else if(key !== "template") { //We handle templates inside items
                        console.error("Not sure what you want to do with key: " + key + " under element: ");
                        console.log($node);
                        console.log("And object:");
                        console.log(object);
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
		        $node.addEventListener("onload", $node.onload);
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
		if(!Utils.isObject(value) &&! Utils.isFunction(value)) {
			// When setting values to the node (simplified version):
			if(Utils.isHtml(value)) {
				value = { html : value };
			} else if(Utils.isString(value) || Utils.isNumeric(value)) {
				value = { text : value };
			} else if(this.hasProp($node, "value")) {
				value = { value : value };
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
		if(this.hasAttrOrProp($node, key)) { // Only if its not an attribute or property, we "link" it.
			$node["$" + key] = $child; //Replace name with "$" + name
			console.log("Property : " + key + " existed in node: " + $node.tagName +
			". Using $" + key + " instead for node: " + $child.tagName + ".")
		} else {
	        $node[key] = this.proxy($child);
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
	 * @param {Object, string} [template]
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
	 * @private
	 * @param {HTMLElement} $node
	 * @param {string} key
	 * @param {*} value
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
	 * It will set a unique attribute among a group of nodes (grouped by parent)
	 * @private
	 * @param {HTMLElement, Node} $node
	 * @param {string} key
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
	    if(obj._proxy !== undefined) {
	        return obj;
	    } else {
	        obj._proxy = true;
            const handler = {
                get: (target, property, receiver) => {
                    const t = target[property];
                    if(typeof t === "function") {
                        return t.bind(target);
                    } else {
                        return t;
                    }
                },
                set: (target, property, value) => {
                    let oldValue = "";
                    if(Utils.isNode(target[property])) {
                        let key = "";
                        if(Utils.isHtml(value)) {
                            key = "html";
                        } else if(Utils.isString(value) || Utils.isNumeric(value)) {
                            key = "text";
                        } else if(this.hasAttrOrProp(target[property], "value")) {
                            key = "value";
                        }
                        if(key) {
                            oldValue = target[property][key];
                            target[property][key] = value;
                        }
                    } else if(property === "onupdate") {
                        if(Utils.isFunction(value)) {
                            target.addEventListener("onupdate", value);
                            oldValue = target[property];
                            target[property] = value;
                        } else {
                            console.error("Value passed to 'onupdate' is incorrect, in node:");
                            console.log(target);
                            console.log("Value: (not a function)");
                            console.log(value);
                        }
                    } else {
                        oldValue = target[property];
                        target[property] = value;
                    }
					// Check for onupdate //TODO: document
					// This will observe changes on values
					if(target.onupdate !== undefined) {
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
			// Check for onupdate //TODO: document
			if(target.onupdate !== undefined) {
				if(m.type === "attributes") {
					const value = this.getAttrOrProp(target, m.attributeName);
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
		const mutationObserver = new MutationObserver(this.onObserve.bind(this))
		const options = {
		    attributeOldValue : true
		}
        options.subtree = true;
        options.childList = true;
		mutationObserver.observe($node, options);
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
					            this.items.some(item => {
					                if(item.dataset && (item.dataset.id * 1) === id) {
					                    found = item;
					                    return true;
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
                                return parent.removeChild(this.items[this.items.length - 1]);
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
					            this.items.some(item => {
					                if(item.dataset && (item.dataset.id * 1) === id) {
					                    item.remove();
										return true;
									}
					            });
					        }
					    }
					    break;
					case "shift": // remove and return first item:
					    func = function() {
					        if(this.items.length) {
                                const parent = this.items[0].parentNode;
                                return parent.removeChild(this.items[0]);
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
					    // at, every, filter, find, findIndex, forEach, includes, indexOf, join,
					    // keys, lastIndexOf, map, reduce, reduceRight, slice, some, values
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