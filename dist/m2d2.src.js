// ------- Functions -------
"use strict";
/**
 * Some utils to work with DOM
 * @Author: A.Lepe <dev@alepe.com>
 */
class Utils {
    static htmlNode(html) {
        const template = Utils.newNode("template");
        template.innerHTML = html.trim();
        return template.content.firstChild;
    };
    static newNode(tagName) {
        return document.createElement(tagName);
    };
    static node(selector, root) {
        if (root === undefined) {
            root = document;
        }
        return selector instanceof Node ? selector : root.querySelector(selector);
    };
    static isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    static isSelectorID(s) {
        return (s + "").trim().indexOf("#") === 0;
    };
    static isPlainObject(o) {
        return Utils.isObject(o) && !Utils.isArray(o);
    };
    static isObject(oa) {
        return typeof oa === 'object';
    };
    static isArray(a) {
        return Array.isArray(a);
    };
    static isFunction(f) {
        return typeof f === 'function';
    };
    static isHtml(s) {
        return (s + "").trim().indexOf("<") !== -1;
    };
    static isEmpty(obj) {
        return obj === undefined || (Utils.isObject(obj) && Object.keys(obj).length === 0) || obj === "";
    };
}

/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * @version: 1.3.4
 * @updated: 2020-08-05
 *
 * Examples:
 // -- Without "root":
 * const myobj = m2d2("text in body");
 * const myobj = m2d2({ div : { text : "hello" } });
 * const myobj = m2d2([ {},{},{} ]); //Setting list without template and root
 // -- With "root":
 * const myobj = m2d2("#root", "text in #root");
 * const myobj = m2d2("#input", { value : 199 }); //Using properties
 * const myobj = m2d2("#input", [ 0, 1, 2 ]); //Setting list without template
 // -- With template:
 * const myobj = m2d2("#ul", [ 1, 2, 3 ], "li"); //Defining template as 3rd parameter
 * const myobj = m2d2("#ul", [ 1, 2, 3 ], { li : { 'class' : 'blue' } }); //Defining template as object
 */
"use strict";
/**
 * Main class
 */
class M2D2 {
	//------- options ---------------
	root;   // DOM baseline to perform searches and replacements. The outer element.
	//----- Public functions ----------------
	constructor(options) {
		this.root 		= options.root || "body";
		this.template 	= options.template || {};
		this.data 		= options.data || [];
		//Initialize
		this._init();
	}
	// Private static to store extensions
	static _ext  = {};
	// For extensions to use
	static extend(properties) {
		Object.assign(M2D2._ext, properties);
	}
	/**
	 * Update model data
	 */
	update (data, property, valObj) {
		const _this = this;
		if(_this._rendered) {
			const doUpdate = function (data) {
				let node;
				if (data._node !== undefined) {
					if (Utils.isArray(data)) {
						//Item was removed
						if (valObj === undefined) {
							if (data[property]._node !== undefined) {
								// Remove element
								data[property]._node.remove();
							}
						} else {
							let n;
							const toRemove = [];
							for (n in data._node.childNodes) {
								node = data._node.childNodes[n];
								if (node && node.tagName !== undefined && node.tagName !== "TEMPLATE") {
									toRemove.push(node);
								}
							}
							for (n in toRemove) {
								node = toRemove[n];
								node.remove();
							}
							_this._doRender(data._node, data);
						}
					} else {
						const change = {};
						change[property] = valObj.value;
						if(property === "items" && data.template !== undefined &&! Utils.isEmpty(data.template)) {
							change.template = data.template;
						}
						_this._doRender(data._node, change);
					}
				} else {
					_this._doRender(_this.$root, data);
				}
			};
			doUpdate(data);
		}
	}
	/**
	 * Returns data object
	 */
	get () {
		const _this = this;
		_this._defineProp(_this._data, "m2d2", this);
		_this._setProxy();
		return this._data;
	}
	/**
	 * Removes added model items //TODO: move to items? maybe not needed.
	 */
	clear () {
		const _this = this;
		if(_this._rendered) {
			_this.$root.innerHTML = _this._cache;
		}
	}
	//---- Private --
	$root       = null;     // root DOM element e.g. "<body>...</body>"
	_rendered   = false;    // true if the data has been rendered
	_updater 	= true;
	_cache 		= null;
	_data  		= null;
	_func  		= null;
	// HTML5 valid attributes and tags (2018)
	_htmlGenTags = ["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big",
		"blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","datalist","dd",
		"del","details","dfn","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form",
		"frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img",
		"input","ins","kbd","label","legend","li","map","mark","menu","meter","nav","ol","optgroup","option",
		"output","p","pre","progress","q","rp","rt","ruby","samp","section","select","small","span","strong",
		"sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","tr","tt","ul","var"];
	/**
	 * Initialize data. If its a function, call it.
	 * @private
	 */
	_init () {
		const _this = this;
		// In case its a Number of String, wrap it.
		if(!Utils.isObject(_this._data)) {
			_this._data = { text : _this._data };
		}
		_this._onReady();
	}
	/**
	 * Render data
	 * @private
	 */
	_render () {
		const _this = this;
		if(_this._data === undefined) {
			console.log("data is missing in m2d2 object with root: "+_this.root)
			return false;
		}
		// Render data
		_this._doRender(_this.$root, _this._data);
		// Set trigger on modifications
		_this._rendered = true;
	}

	/**
	 * When ready to start rendering
	 * @private
	 */
	_onReady () {
		const _this = this;
		_this.$root = Utils.node(_this.root);
		if(_this.$root) {
			_this._cache = _this.$root.innerHTML; //In order to be able to rollback root.
			_this._render();
		} else {
			console.log("Warning: Node was not found: " + _this.root);
		}
	}

	/**
	 * Set proxy to m2d2 object
	 * @private
	 */
	_setProxy () {
		const _this = this;
		if(_this._data._proxy === undefined && (Utils.isPlainObject(_this._data) || Utils.isArray(_this._data))) {
			_this._data = _this._proxy(_this._data, function(obj, variable, value) { //onChange...
				if(variable !== "m2d2" && variable[0] !== '_' && _this._updater) { //Do not update if it starts with '_'
					_this.update(obj, variable, value);
				}
			});
		}
	}

	/**
	 * Render an element with its values
	 * It will set the Proxy, and call _setValues
	 * @param $elem : Node element
	 * @param value : Object value to render
	 * @param isTemplate : Boolean
	 * @private
	 */
	_doRender ($elem, value, isTemplate) {
		const _this = this;
		if(isTemplate === undefined) { isTemplate = false; }
		// Initial trigger
		if(value && value.oninit !== undefined && Utils.isFunction(value.oninit)) {
			value.oninit();
			delete(value.oninit);
		}
		// Arrays : automatic conversion from [] to { items : [] }
		if(Utils.isArray(value)) {
			value = { items : value };
		}
		_this._setProxy();

		_this._setValues($elem, value, isTemplate);
		if(value && value.onrender !== undefined && Utils.isFunction(value.onrender)) {
			value.onrender();
			delete(value.onrender); //Run only once
		}
	}

	/**
	 * Process an array
	 * @param $elem : Node Parent element
	 * @param obj : Object
	 * @param values : Array or Object
	 * @param isTemplate : Boolean
	 * @private
	 */
	_doArray ($elem, obj, values, isTemplate) {
		const _this = this;
		if(isTemplate === undefined) { isTemplate = false; }
		_this._setNode($elem, values);
		let template = _this._getTemplate($elem, obj);
		for(let i = 0; i < (values.length || Object.keys(values).length); i++) {
			let val = values[i] || Object.values(values)[i];
			if(val._node !== undefined) {
				val._node = undefined;
			}
			if(!template) {
				if($elem.tagName === "SELECT" || $elem.tagName === "DATALIST") {
					template = "<option>";
					if(typeof val === "string") {
						val = {text: val, value: val}
					}
				} else if($elem.tagName === "UL" || $elem.tagName === "OL") {
					template = "<li>";
				} else if($elem.tagName === "NAV") {
					template = "<a>";
				} else if(Utils.isPlainObject(val)) {
					if(Object.keys(val).length === 1) {
						if(Utils.isSelectorID(val)) {
							const idNode = document.querySelector(val);
							if(idNode) {
								template = idNode.outerHTML;
							} else {
								console.log("Warning: ID selector for template not found: "+val+" . Object:");
								console.log(obj);
								return
							}
						} else {
							template = Utils.newNode(Object.keys(val)[0]).outerHTML;
						}
					} else {
						console.log("Warning: Multiple keys in data without template is not supported yet. Object:");
						console.log(obj);
						return
					}
				} else {
					console.log("Warning: No template found for object:");
					console.log($elem);
					console.log(obj);
					return
				}
			}
			const $item = Utils.htmlNode(template);
			$item.setAttribute("data-id", i);
			$elem.append($item);
			// Set values
			_this._setValues($item, val, isTemplate);
		}
	}
	/** Returns a copy of the model to duplicate
	 * @param $elem : Node is to search in DOM for <template>
	 * @param obj : Object is to search for property "template"
	 * @private
	 */
	_getTemplate ($elem, obj) {
		const _this = this;
		if(obj._template !== undefined && obj._template !== "") {
			return obj._template;
		} else {
			let $template;
			if(obj.template !== undefined) {
				if(Utils.isPlainObject(obj.template)) {
					$template = Utils.newNode("div");
					_this._setValues($template, obj.template, true);
				} else if(Utils.isSelectorID(obj.template)) {
					$template = document.querySelector(obj.template);
				} else if(Utils.isHtml(obj.template)) {
					$template = Utils.htmlNode("<template>"+obj.template+"</template>");
				} else {
					$template = Utils.htmlNode("<template>"+Utils.newNode(obj.template).outerHTML+"</template>");
				}
			} else {
				$template = Utils.node("template", $elem);
			}
			// If not template is found, use html as of element
			if($template) {
				const html = $template.innerHTML.trim();
				_this._defineProp(obj, "_template", html);
				return html;
			} else {
				return $elem.innerHTML.trim();
			}
		}
	}

	/**
	 * Set values in elements
	 * @param $elem : Node to set values
	 * @param value : Object
	 * @param isTemplate : Boolean
	 * @private
	 */
	_setValues ($elem, value, isTemplate) {
		const _this = this;
		if(isTemplate === undefined) { isTemplate = false; }
		// Arrays : automatic conversion from [] to { items : [] }
		if(Utils.isArray(value)) {
			value = { items : value };
		}
		if(Utils.isPlainObject(value)) {
			_this._setNode($elem, value);
			// Html is processed first
			if(value.hasOwnProperty("html") && value.html !== null) {
				_this._setValue($elem, "html", value.html);
			}
			if(value.hasOwnProperty("template")) {
				// If it contains a template property, add it as HTML
				$elem.append(Utils.htmlNode("<template>" + _this._getTemplate($elem, value) + "</template>"));
				if(!value.hasOwnProperty("items")) {
					value.items = [];
				}
			}
			// Clear the contents if we don't have a html property and we have items
			//TODO: find a way to distinguish between update and set (issue #7 related)
			/*if(! value.hasOwnProperty("html") && value.hasOwnProperty("items")) {
				$elem.innerHTML = "";
			}*/
			for(let key in value) {
				const item = value[key];
				if(key === "html" || key === "template" || key.startsWith("_")) {
					// Do nothing. Skip as we already processed them and those starting with "_"
				} else if(key === "items") {
					// Process Array:
					_this._doArray($elem, value, item, isTemplate);
				} else {
					if(key === "items" &&! Utils.isArray(item)) {
						console.log("Warning: 'items' specified but value is not and array in element: ");
						console.log($elem);
						console.log("Passed values are: ");
						console.log(item);
					}
					if(M2D2._ext[key] !== undefined && Utils.isFunction(M2D2._ext[key])) {
						// Apply extensions:
						const ret = M2D2._ext[key](item, $elem);
						if(ret) {
							_this._setValues($elem, ret, isTemplate);
						}
					} else if(key[0] === "#") {
						// ID defined:
						_this._doRender(Utils.node(key), item, isTemplate);
					} else if(Utils.isArray(item) && item.length === 2 && typeof item[0] === 'object' && typeof item[1] === 'string') {
						// Update by reference
						let oldfunc = item[0]._update || null;
						if($elem._orig_update === undefined) {
							$elem._orig_update = oldfunc;
							item[0]._update = function () {
								_this._setValue($elem, key, item[0][item[1]]);
								if ($elem._orig_update !== null) {
									$elem._orig_update();
								}
							}
						}
						_this._setValue($elem, key, item[0][item[1]]);
					} else if(key === "text" && item !== null) {
						// Text specified:
						_this._setValue($elem, key, item);
					} else if(key === "dataset" && Utils.isPlainObject(item)) {
						// Import dataset: Setting dataset : { id : 'custom' } will override the id set automatically in arrays.
						for(let d in item) {
							$elem.setAttribute("data-"+d, item[d]);
						}
					} else if(key === "style") {
						// Styles
						if(Utils.isPlainObject(item)) {
							for(const s in item) {
								$elem.style[s] = item[s];
							}
						} else {
							$elem.style = item;
						}

					} else if(key.startsWith("on") && Utils.isFunction(item)) {
						// Events
						if(isTemplate) {
							if(m2d2.f === undefined) {
								m2d2.f = [];
							}
							m2d2.f.push(item);
							$elem.setAttribute(key, "m2d2.f["+(m2d2.f.length - 1)+"](event)");
						} else {
							$elem[key] = item;
						}
					} else if(item instanceof Date) {
						// Date / Time:
						if(_this._hasAttrOrProp($elem, key)) {
							$elem.setAttribute(key, item);
						} else {
							_this._setValue($elem, key, item);
						}
					} else if(_this._hasAttrOrProp($elem, key) &&
						// Attributes: --Do not set ID with a numeric value
						!Utils.isObject(item) &&
						!(key === "id" && Utils.isNumeric(item))) {
						try {
							$elem[key] = item;
						} catch(e) {
							console.log("Unable to set property ["+key+"] in element: " + $elem.localName + ". Read-only?")
						}
						// If its boolean, just update the property, not the attribute
						if(typeof $elem[key] !== "boolean" && _this._hasAttr($elem, key)) {
							$elem.setAttribute(key, item);
						}
						if(key === "value") {
							let oldfunc = $elem.onchange || null;
							if($elem._orig_change === undefined) {
								$elem._orig_change = oldfunc;
								$elem.onchange = function () {
									this.setAttribute(key, this.value);
									if (this._orig_change !== null) {
										this._orig_change();
									}
								}
							}
						}
						if($elem._mutable === undefined) {
							new MutationObserver(function (m) { //On Attribute change...
								const tgt = m[0].target;
								if (tgt._m2d2 !== undefined) {
									m.forEach(function(mr) {
										const att = mr.attributeName;
										let currVal = tgt._m2d2[att];
										const val = typeof currVal == "boolean" ? tgt[att] : tgt.getAttribute(att);
										// noinspection EqualityComparisonWithCoercionJS (relaxed as may be string vs number)
										if(currVal !== undefined && currVal != val) {
											tgt._m2d2[att] = val;
											let changed = {};
											changed[att] = val;
											_this._setValues(tgt, changed, isTemplate);
											if (tgt._m2d2._update !== undefined) {
												tgt._m2d2._update();
											}
										}
									});
								} else {
									console.log("BUG: Unable to find m2d2 reference in node.")
								}
							}).observe($elem, {attributes: true});
							$elem._mutable = true;
						}
					} else {
						// Search child elements:
						// by tag name first
						let $subelem = Utils.node(key, $elem);
						if(!$subelem) {
							// Search by ID
							$subelem = Utils.node("#"+key, $elem);
							if(!$subelem) {
								// Search by class
								$subelem = Utils.node("."+key, $elem);
							}
							if(!$subelem) {
								const createElem = function(tagName, item, isTemplate) {
									const $newElem = Utils.newNode(tagName);
									$elem.append($newElem);
									_this._doRender($newElem, item, isTemplate);
								}
								// Generate new element:
								if(_this._htmlGenTags.indexOf(key) !== -1) {
									createElem(key, item, isTemplate)
									continue;
								} else if(item && Utils.isObject(item)) {
									if(item.tagName !== undefined) {
										let tag = item.tagName;
										delete item.tagName;
										createElem(tag, item, isTemplate);
										continue;
									}
								}
							}
						}
						if($subelem) {
							_this._doRender($subelem, item, isTemplate);
						} else {
							console.log("No child or attribute found for: " + key + " in element: "+$elem.localName);
						}
					}
				}
			}
		} else {
			//String or Number
			_this._setValue($elem, null, value);
		}
	}
	// Set value for a single element (in case of number, string, boolean, etc)
	/**
	 *
	 * @param $elem
	 * @param key
	 * @param value
	 * @private
	 */
	_setValue ($elem, key, value) {
		const _this = this;
		// If key is null, it means is not specified, so we try to guess what it is
		let html = false;
		if(key == null) {
			if(value === undefined || value == null) {
				console.log("Value was undefined in element :");
				console.log($elem);
			} else if(Utils.isPlainObject(value) && value.text !== undefined) {
				value = value.text;
			} else if(!Utils.isNumeric(value) && Utils.isHtml(value)) {
				html = true;
			}
		} else if(key === "html") {
			html = true;
		}
		if(html) {
			$elem.innerHTML = value;
		} else {
			// As <li> can have "value", it won't be assigned if key is null
			if(key === "value" || (key == null && _this._hasProp($elem, "value") && ($elem.tagName !== "LI"))) {
				if(_this._hasProp($elem, "checked")) {
					if(value === true || value === "true" || value === 1) {
						$elem.setAttribute("checked",true);
					} else if(value === false || value === "false" || value === 0) {
						$elem.setAttribute("checked",false);
					} else {
						$elem.value = value;
					}
				} else if(value instanceof Date) {
					$elem.valueAsDate = value;
				} else {
					$elem.value = value;
				}
			} else {
				// If the element has children, only change text
				if($elem.childElementCount > 0) {
					for(let i in $elem.childNodes) {
						const inode = $elem.childNodes[i];
						if(inode.nodeType === 3) {
							inode.replaceWith(value);
							return;
						}
					}
					// If text node not found, append it
					$elem.innerHTML = $elem.innerHTML + value; //TODO: not the best way IMHO
				} else {
					$elem.innerText = value;
				}
			}
		}
	}

	/**
	 * If a node contains either a property or an attribute
	 * @param $node : Node
	 * @param key : string
	 * @returns {boolean}
	 * @private
	 */
	_hasAttrOrProp ($node, key) {
		return this._hasAttr($node, key) || this._hasProp($node, key);
	}
	/**
	 * If a node has an attribute
	 * @param $node : Node
	 * @param attr : string
	 * @returns {boolean}
	 * @private
	 */
	_hasAttr ($node, attr) {
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
	 * @param $node : Node
	 * @param prop : string
	 * @returns {boolean}
	 * @private
	 */
	_hasProp ($node, prop) {
		let hasProp = false;
		if($node && !Utils.isNumeric(prop)) {
			hasProp = $node[prop] !== undefined &&! $node.hasAttribute(prop);
		}
		return hasProp;
	}

	/**
	 *
	 * @param obj
	 * @param prop
	 * @param def
	 * @private
	 */
	_defineProp (obj, prop, def) {
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
	 *
	 * @param $node Node element
	 * @param obj Proxy object
	 * @private
	 */
	_setNode ($node, obj) {
		this._defineProp(obj, "_node", $node);
		// Set reverse lookup
		this._defineProp($node, "_m2d2", obj);
	}

	/**
	 *
	 * @param obj
	 * @param onChange
	 * @returns {*}
	 * @private
	 */
	_proxy (obj, onChange) {
		this._defineProp(obj, "_proxy", true);
		const handler = {
			get: function (target, property, receiver) {
				if (property === "m2d2" || property[0] === '_') {
					return target[property];
				} else {
					const realValue = Reflect.get(target, property, receiver);
					const ownDesc = Object.getOwnPropertyDescriptor(target, property);
					if (ownDesc && !ownDesc.writable && !ownDesc.configurable) {
						return realValue;
					}
					try {
						if (Utils.isArray(obj) && !Utils.isNumeric(property)) {
							return target[property];
						} else {
							return new Proxy(target[property], handler);
						}
					} catch (err) {
						return realValue;
					}
				}
			},
			defineProperty: function (target, property, descriptor) {
				onChange(target, property, descriptor);
				return Reflect.defineProperty(target, property, descriptor);
			},
			deleteProperty: function (target, property) {
				onChange(target, property);
				return Reflect.deleteProperty(target, property);
			},
			set: function (target, property, value) {
				target[property] = value;
				onChange(target, property, {value: value});
				if(target._update !== undefined) {
					target._update();
				}
				return true;
			}
		};
		return new Proxy(obj, handler);
	}
	/**
	 * Setter
	 * @param value Object
	 */
	set data(value) {
		const _this = this;
		_this._data = value;
		_this.update(_this._data);
	}

	/**
	 * Getter
	 * @returns {null}
	 */
	get data() {
		const _this = this;
		return _this._data;
	}
}

/**
 * Main function that will initialize M2D2 class object
 * @param first : Object node to use as root, data, template
 * @param second : Object data, template
 * @param third : Object, template
 * @returns M2D2 object
 */
const m2d2 = function(first, second, third) {
	const options = {};
	const first_type = typeof first;
	switch (first_type) {
		case "string" :
			if (second !== undefined) {
				options.root = first;
				if (Utils.isArray(second)) {
					second = {items: second};
				}
				options.data = second;
				options.template = third;
			} else { //This is the simple use case : m2d2("Content"); in which "Content" will be set in "body";
				options.data = first;
				return null;
			}
			break;
		// In case the first argument is not a string, root will become the default value.
		case "object" :
			if (first instanceof Node) {
				options.root = first;
				first = second;
			}
			if (Utils.isArray(first)) {
				second = {items: first};
			}
			options.data = first;
			options.template = third; //it might be undefined
			break;
		default :
			console.log("First argument passed to m2d2, with value: (" + first + ") is of unknown type: " + first_type);
			return null;
	}
	return new M2D2(options).get();
};

/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 *
 * This is an extension to use the property "show" to hide/show elements
 * It will keep previous "display" property value and restore it upon "show".
 * If there is not "previous" display property will search for "data-display"
 * attribute or will set the default for the specified element tag.
 */
M2D2.extend({
	show : function(show, node) {
		const cssDisplay = function () {
			return getComputedStyle(node, null).display;
		};
		const defaultDisplay = function () {
			const b = document.getElementsByTagName("body")[0];
			const t = document.createElement("template");
			const n = document.createElement(node.tagName);
			t.appendChild(n);
			b.appendChild(t);
			const display = getComputedStyle(n, null).display;
			t.remove();
			return display;
		};
		if(show) {
			if(cssDisplay() === "none") {
				if(node.dataset._m2d2_display) {
					node.style.display = node.dataset._m2d2_display;
				} else {
					node.style.removeProperty("display");
					if(cssDisplay() === "none") {
						const defaultShow = defaultDisplay();
						node.style.display = node.dataset.display || (defaultShow !== "none" ? defaultShow : "block");
					}
				}
			}
		} else {
			const stored = node.style.display !== "none" ? node.style.display : cssDisplay();
			if(stored !== "none") {
				node.dataset._m2d2_display = stored;
			}
			node.style.display = "none"
		}
	}
});

/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 *
 * This is an extension to use propertes to set style in elements
 */
M2D2.extend({
	// Set css "color" for text. It accepts any supported CSS value
	color   : function(value, elem) { elem.style.color = value; },
	// Set css "background-color".
	bgcolor : function(value, elem) { elem.style.backgroundColor = value; },
	// Set className. It will replace all classes
	css	    : function(value, elem) { elem.className = value; },
	// Remove specific class from element
	"-css"  : function(value, elem) {
		let styles = Utils.isArray(value) ? value : value.split(" ");
		for(let s in styles) { elem.classList.remove(styles[s]) };
	},
	// Add class to element
	"+css"  : function(value, elem) {
		let styles = Utils.isArray(value) ? value : value.split(" ");
		for(let s in styles) { elem.classList.add(styles[s]) };
	}
});