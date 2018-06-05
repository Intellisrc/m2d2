/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * @version: 1.0.0
 */
"use strict";
//--- Extend ---
if($.fn.hasAttr == undefined) {
	$.fn.hasAttr = function(attr) { return $(this).is("["+attr+"]"); }
}
//---- Shortcut ---
var m2d2 = function(options) {
	return new M2D2(options).get();
};
// Extensions:
m2d2.ext = function(properties) {
	M2D2.prototype._ext = $.extend(M2D2.prototype._ext, properties);
}; 
//---- Class ---
var M2D2 = function(options) {
    var model = this;
    if ( !(model instanceof M2D2) )  {
        model = new M2D2(options);
        return model;
    } else {
        // CUSTOM OPTIONS
        model = $.extend(model, options || {});
        if(model.auto_init) {
            model.init();
        }
    }
}
M2D2.prototype = {
    //------- options ---------------
    root            : "body",   // DOM baseline to perform searches and replacements. The outer element.
    auto_init       : true,     // If true, it will render automatically on initialization, otherwise, call render()
    html            : true,     // Auto detect and insert HTML instead of text
    data            : {},       // object to render. This object will be monitored for changes,
    interval        : 0,        // how often to update data if data is a function. 
                                // ... Also can be set as second parameter when calling: callback(data, interval). 
                                // ... After render, it will become the timer, so it can be stopped if required.
    //------- events ------------------
    preRender  : function(instance) {},       // This is executed before we start rendering
    beforeDataRender   : function(instance, $elem, row) {},  // This is executed just before rendering a row. "row" can be changed before it is rendered. (return false to skip)
    afterDataRender    : function(instance, $elem, row) {},  // This is executed just after rendering a row. "row" is not longer after this, so modifying it won't take any effect.
    postRender   : function(instance) {},       // This is executed after all has been rendered
    //------- read only -----
    rendered        : false,    // true if the data has been rendered
    //----- accessible during rendering:
    $root           : null,     // root DOM object e.g. $("body")
    //----- Public functions ----------------
    /**
     * Initialize data. If its a function, call it.
     * If "auto_init" is true, render.
     */
    init : function() {
        var _this = this;
        _this.$root = $(this.root);
        _this.cache = _this.$root.html();
        if($.isFunction(_this._data)) {
            _this._func = _this.data;
            _this._doFunc(_this.data, _this.param, function(newData, refreshRate){
				if(refreshRate == undefined) {
					if(_this.interval*1 > 0) {
						refreshRate = _this.interval;
					}
				}
				if(refreshRate*1 > 0) {
					_this.interval = setInterval(function(){
						_this._func(function(updData) {
							_this._doRender(_this.$root, updData);
						});
					}, refreshRate);
				}
                _this.render();
            });
        } else {
            _this.render();
        }
    },
    /**
     * Update model data
     */
    update : function(data, property, valObj) {
        var _this = this;
        if(_this.rendered) {
			var doUpdate = function(data) {
				if(data._node != undefined) {
					var change = {}
					change[property] = valObj.value;
					_this._doRender(data._node, $.extend(data,change));
				} else {
					// Clear root element
					_this.clear();
					_this._doRender(_this.$root, data);
				}
			}
			if($.isFunction(_this._func)) {
				_this._doFunc(_this._func, data, function(newData){
					doUpdate(newData);
				});
			} else {
				doUpdate(data);
			}
        }
    },
    /**
     * Render data
     */
    render : function() {
        var _this = this;
        // Initial trigger
        _this.preRender(this);
		// Render data
        _this._doRender(_this.$root, _this._data);
        // Trigger on finish
        _this.postRender(this);
		// Set trigger on modifications 
        _this.rendered = true;
    },
    /**
     * Returns data object
     */
    get : function() {
		if(typeof this.data != "object") {
			this.data = { text : this.data };
		}
        this._defineProp(this.data, "m2d2", this);
	    return this.data;
    },
    /**
     * Removes added model items
     */
    clear : function() {
        var _this = this;
        if(_this.rendered) {
            _this.$root.html(_this.cache);
        }
    },
    //---- For items: -----
    // Get ID of current $model
    /**
     * Returns ID from model item
     */
    getID : function() {
        var _this = this;
        return _this.$model.data("id");
    },
    //---- Private --
    _cache : null,
    _data  : null,
    _func  : null,
	_ext   : {},
	// HTML5 valid attributes and tags (2018)
	_htmlGenTags : ["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","datalist","dd","del","details","dfn","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","map","mark","menu","meter","nav","ol","optgroup","option","output","p","pre","progress","q","rp","rt","ruby","samp","section","select","small","span","strong","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","tr","tt","ul","var"],
    // Clone data object
    _cloneData : function() {
        return JSON.parse(JSON.stringify(this._data));
    },
    _doFunc : function(origFunc, param, callback) {
        var _this = this;
        origFunc(function(newData, refreshRate){
            _this._data = newData;
            if(callback != undefined) {
                callback(newData, refreshRate);
            }
        }, param);
    },
    // Render an element with its values
    _doRender : function($elem, value) {
        var _this = this;
        if(_this.data._proxy == undefined && ($.isPlainObject(_this._data) || $.isArray(_this.data))) {
            _this._data = _this._proxy(_this._data, function(obj, variable, value) {
                if(variable != "m2d2" && variable[0] != '_') { //Do not update if it starts with '_'
                    _this.update(obj, variable, value);
                }
            });
        }
		if($.isArray(value)) {
			for(var i = 0; i < value.length; i++) {
                if(value[i]._node != undefined) {
                    value[i]._node = undefined;
                }
                var $item = _this._getNewModel();
                $item.data("id", i);
                $elem.append($item);
				_this._setValues($item, value[i]);
			}
		} else { //Number, String or Objects
			_this._setValues($elem, value);
		}
    },
    // Returns a copy of the model to duplicate
    _getNewModel : function(key) {
        var _this = this;
        // Search specific template
        var css = key == undefined ? "" : "." + key;
        var $template = _this.template ? $("<div>"+_this.template+"</div>") : _this.$root.find("template" + css);
        if(!$template.length) {
            if(css) {
                // if not found... Search by class
                $template = _this.$root.find(css);
                if(!$template.length) {
                    console.log("Unable to find template with class: " + css);
                    return $();
                }
            } else {
                console.log("<template> tag not found inside model root");
                return $();
            }
        }
        return $($template.html());
    },
    // Set values in elements
    _setValues : function($elem, value) {
        var _this = this;
        if($.isPlainObject(value)) {
            _this._setNode($elem, value);
            for(var key in value) {
                if(key != "template") {
					if(_this._ext[key] != undefined && $.isFunction(_this._ext[key])) {
						var ret = _this._ext[key](value[key], $elem);
						if(ret) {
							_this._setValues($elem, ret);
						}
					} else if(key == "text" || key == "html") {
                        _this._setValue($elem, value[key]);
                    } else if($elem.hasAttr(key)) {
                        $elem.attr(key, value[key]);
                    } else {
                        var $subelem = $elem.find(key);
                        if($subelem.length == 0) {
                            $subelem = $elem.find("."+key);
                            if($subelem.length == 0) {
                                if(_this._htmlGenTags.indexOf(key) != -1) {
                                    var $newElem = $("<"+key+">");
                                    $elem.append($newElem);
                                    _this._doRender($newElem, value[key]);
                                } else {
                                    $elem.attr(key, value[key]);
                                }
                                continue;
                            }
                        }
                        _this._doRender($subelem, value[key]);
                    }
                }
            }
        } else { //String or Number
            _this._setValue($elem, value);
        }
    },
    // Set value for a single element (in case of number, string, boolean, etc)
    _setValue : function($elem, value) {
            var isHtml = !$.isNumeric(value) && value.trim().indexOf("<") !== -1;
            if(isHtml) {
                $elem.html(value);
            } else {
                if($elem.hasAttr("value")) {
                    if($elem.hasAttr("checked")) {
                        if(value == true || value == "true" || value == 1) {
                            $elem.attr("checked",true);
                        } else if(value == false || value == "false" || value == 0) {
                            $elem.attr("checked",false);
                        } else {
                            $elem.val(value);
                        }
                    } else {
                        $elem.val(value);
                    }
                } else {
                    $elem.text(value);
                }
            }
    },
    _defineProp: function(obj, prop, def) {
		if(obj[prop] == undefined) {
			Object.defineProperty(obj, prop, {
				enumerable: false,
				writable: true
			});
			obj[prop] = def;
		}
    },
	_setNode: function($node, obj) {
        this._defineProp(obj, "_node", $node);
	},
	_proxy : function(obj, onChange) {
        this._defineProp(obj, "_proxy", true);
        const handler = {
            get(target, property, receiver) {
                if(property == "m2d2" || property[0] == '_') {
                    return target[property];
                } else {
                    try {
                        if($.isArray(obj) && !$.isNumeric(property)) {
                            return target[property];
                        } else {
                            return new Proxy(target[property], handler);
                        }
                    } catch (err) {
                        return Reflect.get(target, property, receiver);
                    }
                }
            },
            defineProperty(target, property, descriptor) {
                onChange(target, property, descriptor);
                return Reflect.defineProperty(target, property, descriptor);
            },
            deleteProperty(target, property) {
                onChange(target, property);
                return Reflect.deleteProperty(target, property);
            },
            set(target, property, value, receiver) {      
                target[property] = value;
                onChange(target, property, { value: value });
                return true;
            }
        }
        return new Proxy(obj, handler);
	},
    //----- setters and getters for data
    set data(value) {
        var _this = this;
        _this._data = value;
        _this.update(_this._data);
    },
    get data() {
        var _this = this;
        return _this._data;
    }
}
