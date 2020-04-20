/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * @version: 2020-04-20
 *
 * Examples:
 // -- Without "root":
 * const myobj = m2d2("text in body");
 * const myobj = m2d2({ div : { text : "hello" } });
 * const myobj = m2d2([ {},{},{} ]); //Setting list without template and root
 * const myobj = m2d2(function(callback) { ... });
 // -- With "root":
 * const myobj = m2d2("#root", "text in #root");
 * const myobj = m2d2("#input", { value : 199 }); //Using properties
 * const myobj = m2d2("#input", [ 0, 1, 2 ]); //Setting list without template
 * const myobj = m2d2("#clock", function(callback) { ... }); //Using a function (e.g. getting data from another server)
 // -- With template:
 * const myobj = m2d2("#ul", [ 1, 2, 3 ], "li"); //Defining template as 3rd parameter
 * const myobj = m2d2("#ul", [ 1, 2, 3 ], { li : { 'class' : 'blue' } }); //Defining template as object
 * const myobj = m2d2("#clock", function(callback) { ... }, "time"); //Using a function and a template
 * const myobj = m2d2("#clock", function(callback) { ... }, { onclick : ... }); //Using object as template
 */
"use strict";
const m2d2 = (function() {
	// Functions:
	const htmlNode = function(html) {
		const template = newNode("template");
		template.innerHTML = html.trim();
		return template.content.firstChild;
	};
	const newNode = function(tagName) {
		return document.createElement(tagName);
	};
	const node = function(selector, root) {
		if(root === undefined) { root = document; }
		return selector instanceof Node ? selector : root.querySelector(selector);
	};
	const isNumeric = function(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	};
	const isSelectorID = function(s) {
		return (s + "").trim().indexOf("#") === 0;
	};
	const isPlainObject = function(o) {
		return isObject(o) &&! isArray(o);
	};
	const isObject = function(oa) {
		return typeof oa === 'object';
	};
	const isArray = function(a) {
		return Array.isArray(a);
	};
	const isFunction = function(f) {
		return typeof f === 'function';
	};
	const isHtml = function(s) {
		return (s + "").trim().indexOf("<") !== -1;
	};
	const isEmpty = function (obj) {
		return obj === undefined || (isObject(obj) && Object.keys(obj).length === 0) || obj === "";
	};

	//---- Class ---
	const M2D2 = function(options) {
		let model = this;
		if ( !(model instanceof M2D2) )  {
			model = new M2D2(options);
			return model;
		} else {
			// CUSTOM OPTIONS
			model = extend(model, options || {});
			model._init();
		}
	};
	let updater = true;
	// main function
	const m2d2 = function (first, second, third) {
		const options = {};
		const first_type = typeof first;
		switch (first_type) {
			case "string" :
				if (second !== undefined) {
					options.root = first;
					if (isArray(second)) {
						second = {items: second};
					}
					options.data = second;
					options.template = third;
				} else { //This is the simple use case : md2d("Content"); in which "Content" will be set in "body";
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
			//No break here
			case "function" :
				if (isArray(first)) {
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
	// Extensions:
	m2d2.ext = function(properties) {
		M2D2.prototype._ext = extend(M2D2.prototype._ext, properties);
	};
	M2D2.prototype = {
		//------- options ---------------
		root            : "body",   // DOM baseline to perform searches and replacements. The outer element.
		//	template		: undefined,// root template. It can be a string (tagName, ID selector (#) or HTML) or an object. When not specified, it will be generated from array.
		//	interval        : 0,        // how often to update data if data is a function.
		// ... Also can be set as second parameter when calling: callback(data, interval).
		// ... After render, it will become the timer, so it can be stopped if required.
		//------- custom events ------------------
		//oninit              : function() {},       // This is executed before we start rendering
		//onrender            : function() {},       // This is executed after all has been rendered
		//----- accessible during rendering:
		$root           : null,     // root DOM element e.g. "<body>...</body>" //TODO: required?
		//----- Public functions ----------------
		/**
		 * Update model data
		 */
		update : function(data, property, valObj) {
			const _this = this;
			if(_this._rendered) {
				const doUpdate = function (data) {
					let node;
					if (data._node !== undefined) {
						if (isArray(data)) {
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
									if (node.tagName !== undefined && node.tagName !== "TEMPLATE") {
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
							_this._doRender(data._node, extend(data, change));
						}
					} else {
						// Clear root element
						_this.clear();
						_this._doRender(_this.$root, data);
					}
				};
				if(property === undefined && isFunction(_this._func)) {
					_this._doFunc(_this._func, data, function(newData){
						doUpdate(newData);
					});
				} else {
					doUpdate(data);
				}
			}
		},
		/**
		 * Returns data object
		 */
		get : function() {
			const _this = this;
			_this._defineProp(_this._data, "m2d2", this);
			_this._setProxy();
			return this._data;
		},
		/**
		 * Removes added model items //TODO: move to items? maybe not needed.
		 */
		clear : function() {
			const _this = this;
			if(_this._rendered) {
				_this.$root.innerHTML = _this.cache;
			}
		},
		//---- Private --
		_rendered        : false,    // true if the data has been rendered
		/**
		 * Initialize data. If its a function, call it.
		 */
		_init : function() {
			const _this = this;
			if(isFunction(_this._data)) {
				_this._func = _this._data;
				let syncRet = _this._doFunc(_this._func, _this.param);
				//If the function returns a value, render it
				if(syncRet) {
					//Wrap it if its an array
					if(isArray(syncRet)) {
						syncRet = { items: syncRet };
					}
					_this._data = syncRet;
					_this._onReady();
				}
			} else {
				// In case its a Number of String, wrap it.
				if(!isObject(_this._data)) {
					_this._data = { text : _this._data };
				}
				_this._onReady();
			}
		},
		/**
		 * Render data
		 */
		_render : function() {
			const _this = this;
			if(_this._data === undefined) {
				console.log("data is missing in m2d2 object with root: "+_this.root)
				return false;
			}
			// Render data
			_this._doRender(_this.$root, _this._data);
			// Set trigger on modifications
			_this._rendered = true;
		},
		_cache : null,
		_data  : null,
		_func  : null,
		_ext   : {},
		// HTML5 valid attributes and tags (2018)
		_htmlGenTags : ["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","datalist","dd","del","details","dfn","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","map","mark","menu","meter","nav","ol","optgroup","option","output","p","pre","progress","q","rp","rt","ruby","samp","section","select","small","span","strong","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","tr","tt","ul","var"],
		_onReady : function() {
			const _this = this;
			_this.$root = node(_this.root);
			_this.cache = _this.$root.innerHTML; //In order to be able to rollback root.
			_this._render();
		},
		_doFunc : function(origFunc, param, callback) {
			const _this = this;
			let ret_data = origFunc(function (newData, second, third) {
				let refreshRate;
				if (third !== undefined && isNumeric(third)) {
					refreshRate = third;
				} else if (second !== undefined && isNumeric(second)) {
					refreshRate = second;
				}
				if (isArray(newData)) {
					const wrapper = {};
					if (second !== undefined && !isNumeric(second)) {
						wrapper.template = second;
					} else if (_this.template !== undefined) {
						wrapper.template = _this.template
					}
					wrapper.items = newData;
					newData = wrapper;
				}
				if (isPlainObject(newData)) {
					updater = false;
					let idx = 1;
					for (let n in newData) {
						if (idx++ === Object.keys(newData).length) {
							updater = true;
						}
						_this._data[n] = newData[n];
					}
				}
				if (refreshRate === undefined) {
					if (_this.interval * 1 > 0) {
						refreshRate = _this.interval;
					}
				}
				if (refreshRate * 1 > 0) {
					_this.interval = setInterval(function () {
						_this._func(function (updData) {
							_this._doRender(_this.$root, updData);
						});
					}, refreshRate);
				}
				if (callback !== undefined) {
					callback(newData);
				}
			}, param) || {items: []};
			//Wrap it if its an array:
			if(isArray(ret_data)) {
				ret_data = { items : ret_data }
			}
			if(!isObject(ret_data)) {
				console.log("Undefined type of 'data'. For automatic detection do not set any 'return' in the data's function. Or explicitly return '[]' for arrays or '{}' for objects.")
			}
			return ret_data;
		},
		_setProxy : function() {
			const _this = this;
			if(_this._data._proxy === undefined && (isPlainObject(_this._data) || isArray(_this._data))) {
				_this._data = _this._proxy(_this._data, function(obj, variable, value) { //onChange...
					if(variable !== "m2d2" && variable[0] !== '_' && updater) { //Do not update if it starts with '_'
						_this.update(obj, variable, value);
					}
				});
			}
		},
		// Render an element with its values
		_doRender : function($elem, value) {
			const _this = this;
			// Initial trigger
			if(value && value.oninit !== undefined && isFunction(value.oninit)) {
				value.oninit();
				delete(value.oninit);
			}
			_this._setProxy();
			// Arrays : automatic conversion from [] to { items : [] }
			if(isArray(value)) {
				value = { items : value };
			}
			/*if(isArray(value)) {
                _this._doArray($elem, _this, value);
            }*/
			//Number, String or Objects
			if(value && isObject(value) && value.items === undefined) {
				value.items = [];
			}
			_this._setValues($elem, value);
			if(value && value.onrender !== undefined && isFunction(value.onrender)) {
				value.onrender();
				delete(value.onrender); //Run only once
			}
		},
		// Process an array
		_doArray : function($elem, obj, values) {
			const _this = this;
			_this._setNode($elem, values);
			let template = _this._getTemplate($elem, obj);
			for(let i = 0; i < values.length; i++) {
				const val = values[i];
				if(val._node !== undefined) {
					val._node = undefined;
				}
				if(!template) {
					if(isPlainObject(val)) {
						if(Object.keys(val).length === 1) {
							if(isSelectorID(val)) {
								const idNode = document.querySelector(val);
								if(idNode) {
									template = idNode.outerHTML;
								} else {
									console.log("Warning: ID selector for template not found: "+val+" . Object:");
									console.log(obj);
									return
								}
							} else {
								template = newNode(Object.keys(val)[0]).outerHTML;
							}
						} else {
							console.log("Warning: Multiple keys in data without template is not supported yet. Object:");
							console.log(obj);
							return
						}
					} else {
						console.log("Warning: No template found for object:");
						console.log(obj);
						return
					}
				}
				const $item = htmlNode(template);
				$item.setAttribute("data-id", i);
				$elem.append($item);
				_this._setValues($item, val);
			}
		},
		// Returns a copy of the model to duplicate
		// $elem is to search in DOM for <template>
		// obj is to search for property "template"
		//TODO: template is getting lost from obj.template, and it is getting it from obj._template (which is a cache) but it has no events.
		_getTemplate : function($elem, obj) {
			const _this = this;
			if(obj._template !== undefined && obj._template !== "") { //TODO <---here
				return obj._template;
			} else {
				let $template;
				if(obj.template !== undefined) {  //TODO <--- and here
					if(isPlainObject(obj.template)) {
						$template = newNode("div");
						_this._setValues($template, obj.template);
					} else if(isSelectorID(obj.template)) {
						$template = document.querySelector(obj.template);
					} else if(isHtml(obj.template)) {
						$template = htmlNode("<template>"+obj.template+"</template>");
					} else {
						$template = htmlNode("<template>"+newNode(obj.template).outerHTML+"</template>");
					}
				} else {
					$template = node("template", $elem);
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
		},
		// Set values in elements
		_setValues : function($elem, value) {
			const _this = this;
			// Arrays : automatic conversion from [] to { items : [] }
			if(isArray(value)) {
				value = { items : value };
			}
			if(isPlainObject(value)) {
				_this._setNode($elem, value);
				for(let key in value) {
					const item = value[key];
					// Process Array:
					if(key === "items" && isArray(item)) {
						//TODO: if by this point there is no template detected, warn
						//TODO: alternatively, automatic create template: e.g: ul -> li, select -> option, etc
						_this._doArray($elem, value, item);
					} else if(key === "template") {
						// If it contains a template property, add it as HTML
						$elem.append(htmlNode("<template>" + _this._getTemplate($elem, value) + "</template>"));
					} else {
						if(key === "items" &&! isArray(item)) {
							console.log("Warning: 'items' specified but value is not and array in element: ");
							console.log($elem);
							console.log("Passed values are: ");
							console.log(item);
						}
						// Apply extensions:
						if(_this._ext[key] !== undefined && isFunction(_this._ext[key])) {
							const ret = _this._ext[key](item, $elem);
							if(ret) {
								_this._setValues($elem, ret);
							}
							// ID defined:
						} else if(key[0] === "#") {
							_this._doRender(node(key), item);
							// Text or Html specified:
						} else if(key === "text" || key === "html") {
							_this._setValue($elem, key, item);
							// Import dataset: Setting dataset : { id : 'custom' } will override the id set automatically in arrays.
						} else if(key === "dataset" && isPlainObject(item)) {
							for(let d in item) {
								$elem.setAttribute("data-"+d, item[d]);
							}
							// Styles
						} else if(key === "style") {
							if(isPlainObject(item)) {
								for(const s in item) {
									$elem.style[s] = item[s];
								}
							} else {
								$elem.style = item;
							}
							// Events
						} else if(key.indexOf("on") === 0 && isFunction(item)) {
							$elem[key] = item;
							// Date / Time:
						} else if(item instanceof Date) {
							_this._setValue($elem, key, item);
							// Attributes: --Do not set ID with a numeric value
						} else if(_this._hasAttr($elem, key) && !(key === "id" && isNumeric(item))) {
							if(typeof $elem[key] == "boolean") {
								$elem[key] = item;
							} else {
								$elem.setAttribute(key, item);
							}
							// Search child elements:
						} else {
							// Search by tag name first
							let $subelem = node(key, $elem);
							if(!$subelem) {
								// Search by ID
								$subelem = node("#"+key, $elem);
								if(!$subelem) {
									// Search by class
									$subelem = node("."+key, $elem);
								}
								if(!$subelem) {
									// Generate new element:
									if(_this._htmlGenTags.indexOf(key) !== -1) {
										const $newElem = newNode(key);
										$elem.append($newElem);
										_this._doRender($newElem, item);
										// Set a new attribute:
									} else if(!isNumeric(key)) {
										$elem.setAttribute(key, item);
									}
									continue;
								}
							}
							_this._doRender($subelem, item);
						}
					}
				}
				//String or Number
			} else {
				_this._setValue($elem, null, value);
			}
		},
		// Set value for a single element (in case of number, string, boolean, etc)
		_setValue : function($elem, key, value) {
			const _this = this;
			// If key is null, it means is not specified, so we try to guess what it is
			let html = false;
			if(key == null) {
				if(value === undefined || value == null) {
					console.log("Value was undefined in element :");
					console.log($elem);
				} else if(isPlainObject(value) && value.text !== undefined) {
					value = value.text;
				} else if(!isNumeric(value) && isHtml(value)) {
					html = true;
				}
			} else if(key === "html") {
				html = true;
			}
			if(html) {
				$elem.innerHTML = value;
			} else {
				// As <li> can have "value", it won't be assigned if key is null
				if(key === "value" || (key == null && _this._hasAttr($elem, "value") && ($elem.tagName !== "LI"))) {
					if(_this._hasAttr($elem, "checked")) {
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
		},
		_hasAttr : function($node, attr) {
			let hasAttr = false;
			if($node && !isNumeric(attr)) {
				switch(attr) {
					case "checked":
						hasAttr = ($node.type !== undefined && ($node.type === "radio" || $node.type === "checkbox"));
						break;
					default:
						hasAttr = $node[attr] !== undefined || $node.hasAttribute(attr);
				}
			}
			return hasAttr;
		},
		_defineProp: function(obj, prop, def) {
			if(isObject(obj)) {
				if(obj[prop] === undefined) {
					Object.defineProperty(obj, prop, {
						enumerable: false,
						writable: true
					});
					obj[prop] = def;
				}
			}
		},
		_setNode: function($node, obj) {
			this._defineProp(obj, "_node", $node);
		},
		_proxy : function(obj, onChange) {
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
							if (isArray(obj) && !isNumeric(property)) {
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
					return true;
				}
			};
			return new Proxy(obj, handler);
		},
		//----- setters and getters for data
		set data(value) {
			const _this = this;
			_this._data = value;
			_this.update(_this._data);
		},
		get data() {
			const _this = this;
			return _this._data;
		}
	}
	// ------- Functions -------
	// from: https://stackoverflow.com/questions/11197247
	function extend() {
		for(let i=1; i<arguments.length; i++) {
			for(let key in arguments[i]) {
				if(arguments[i].hasOwnProperty(key)) {
					arguments[0][key] = arguments[i][key];
				}
			}
		}
		return arguments[0];
	}

	return m2d2;
})();