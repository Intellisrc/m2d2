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
								$node.setAttribute(k, value);
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
							this.doItems($node, value, template);
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
		return this.proxy($node);
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
			console.log("Property : " + key + " existed. Using $" + key + " instead.")
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
			const $newItem = $template.cloneNode(true);
			$newItem.dataset.id = i++;
			// Set values
			$outElem.appendChild($newItem);
			this.doDom($newItem, val);
		});
		//Update all at once
		//$elem.append(...$outElem.childNodes); <-- works but it is slower
		while ($outElem.firstChild) {
			$node.appendChild($outElem.firstChild);
		}
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
}
/**
 * Easy way to attach to DOMContentLoaded
 */
document.ready = (callback) => {
	const m2d2 = new M2D2();
	document.addEventListener("DOMContentLoaded", () => {
		callback((s, o) => { return m2d2.doDom(s, o) }, (s) => { return m2d2.extDom(s) })
	});
}
