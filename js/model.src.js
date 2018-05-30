/**
 * Search and insert values from an object into HTML.
 *
 * For example:
 * --------- HTML ----------
 * <body>
 * <h1 class="title"></h1>
 * <ul>
 *      <li class="list">
 * </ul>
 * </body>
 * --------- JS -----------
 * new Model({
 *      data : {
 *          title : "Hello World!",
 *          list  : [ 100, 200, 300 ]
 *      }
 * });
 *
 * If "data" is an array:
 * Use the "template" tag
 * which is not displayed by the browser
 * and its contents will be used to duplicate (automatically)
 * --------- HTML ----------
 * <body>
 * <h1>Hello World</h1>
 * <ul>
 *      <li>
            <template>      //Use template if you don't want it to be shown
 *              <a href="about:blank">Dummy Link</a>
            </template>
 *      </li>
 * </ul>
 * </body>
 * --------- JS -----------
 * new Model({
 *    //root : "template", (default value for array data)
 *      data : [ 
 *          //When <template> has only one element, properties are assigned to it: (in this case, <a>)
 *          {
 *              href : "http://wikipedia.org",
 *              text : "Wikipedia"
 *          },
 *          {
 *              href  : "https://duckduckgo.com,
 *              text  : "Duck Duck Go"
 *          },
 *          {
 *              href  : "http://groovy-lang.org/",
 *              text  : "Groovy Language"
 *          },
 *      ]
 * });
 *
 * if "data" is an object with arrays:
 * --------- HTML ----------
 * <body>
 * <h1 class="title"></h1>
 * <div>
        <template class="links">
            <a class="imglnk" target="_blank">
                <img />
            </a>
            Link:
            <a class="txtlnk" target="_blank">
                <span>Dummy Link</span>
            </a>
        </template>
 * </div>
 * <input type="text" name="info" />
 * </body>
 * --------- JS -----------
 * new Model({
    //  root : "body", (default value for object data)
        data : {
            css   : "ready", //it will add the class "ready" to <body>
     *      title : "Useful Links",  //it could also be: h1 : "hello"
     *      links : [   //it could be also a : ... (will search for <template> inside root)
     *              { 
                        imglnk : {
                            href  : "http://wikipedia.org",
                            img   : {
                                src : "http://wikipedia.org/logo.png",
                                css : "highlight"
                            }
                        },
                        txtlnk : {
                            href  : "http://wikipedia.org",
                            text  : "Wikipedia",
                            css   : "main"
                        }
     *              },
                    ...
     *          ],
            info : { //it can be input as well
                value : "Some value",
                style : "color:red"
            }
        }
 * });
 *
 * ----------- Using converter ---------------
 * //Json coming from some service
 * var json = {
        "glossary": {
            "title": "example glossary",
            "GlossDiv": {
                "title": "S",
                "GlossList": [
                    "ID": "SGML",
                    "SortAs": "SGML",
                    "GlossTerm": "Standard Generalized Markup Language",
                    "Acronym": "SGML",
                    "Abbrev": "ISO 8879:1986",
                    "LinkURL": "http://markup.org/",
                    "GlossDef": {
                        "para": "A meta-markup language, used to create markup languages such as DocBook.",
                        "GlossSeeAlso": ["GML", "XML"]
                    },
                    "GlossSee": "markup"
                ]
            }
        }
 * }
 *
 * new Model({
        data : function() {
            var d = {
                h1 : json.glossary.title,
                a : [],
                input : "value"
            }
            for(var g in json.glossary.GlossDiv.GlossList) {
                var item = json.glossary.GlossDiv.GlossList[g];
                a.push({
                    href : item.LinkURL,
                    text : item.GlossTerm
                });
            }
            return d;
        }
  }
 *

//TODO: should we store the function if passed as data?

 */
"use strict";
//--- Extend ---
if($.fn.hasAttr == undefined) {
	$.fn.hasAttr = function(attr) { return $(this).is("["+attr+"]"); }
}
//---- Class ---
var Model = function(options) {
    var model = this;
    if ( !(model instanceof Model) )  {
        model = new Model(options);
        return model;
    } else {
        // CUSTOM OPTIONS
        model = $.extend(model, options || {});
        if(model.auto_init) {
			if($.isFunction(model.data)) {
				model.data = model.data();
			}
            model.init();
        }
    }
}
Model.prototype = {
    //------- options ---------------
    root            : "body",   // DOM baseline to perform searches and replacements. The outer element.
    filler          : false,    // If true, will add an empty model after rendering
    auto_init       : true,     // If true, it will render automatically on initialization, otherwise, call model.render()
    reset           : false,     // If true, it will remove previously added model copies and start over. It will try to update current ones or add if not found
    insert          : true,     // If true, all elements no present in array will be inserted automatically.
    html            : true,     // Auto detect and insert HTML instead of text
    data            : {},       // object to render. This object will be monitored for changes
    //------- events ------------------
    preRender  : function(instance) {},       // This is executed before we start rendering
    beforeDataRender   : function(instance, $elem, row) {},  // This is executed just before rendering a row. "row" can be changed before it is rendered. (return false to skip)
    afterDataRender    : function(instance, $elem, row) {},  // This is executed just after rendering a row. "row" is not longer after this, so modifying it won't take any effect.
    onFillerRender  : function(instance, $elem) {},       // This is executed before filler (empty instance) is placed.
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
        if($.isFunction(_this._data)) {
            _this._data(function(newData){
                _this._data = newData;
                _this.render();
            })
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
            if(data._node != undefined) {
				var change = {}
				change[property] = valObj.value;
                _this._doRender(data._node, $.extend(data,change));
            } else {
                _this._doRender(_this.$root, data);
            }
        }
    },
    /**
     * Render data
     */
    render : function() {
        var _this = this;
        _this.$root = $(this.root);

        // Clear root element
        if(_this.reset) {
            _this.clear();
        }
        // Initial trigger
        _this.preRender(this);
		// Render data
        _this._doRender(_this.$root, _this._data);
        // Trigger on finish
        _this.postRender(this);
		// Set trigger on modifications 
        if($.isPlainObject(_this._data) || $.isArray(_this.data)) {
            _this._data = _this._proxy(_this._data, function(obj, variable, value) {
                if(variable != "_node") {
                    _this.update(obj, variable, value);
                }
            });
        }
        _this.rendered = true;
    },
    /**
     * Removes added model items
     */
    clear : function() {
        var _this = this;
        var child = _this.$root.parent().find(":not(template)");
        if(child.length) {
            child.each(function($it) {
                $it.remove();
            });
        }
    },
    // Adds an empty model (filler)
    addEmpty : function() {
        var _this = this;
        var item = this._getFirstItem();
        for(var i in item) {
            switch($.type(item[i])) {
                case "string":  item[i] = "";
                case "boolean": item[i] = false;
                case "number":  item[i] = 0;
                case "object":	item[i] = [];
                default:
                    item[i] = null;
            }
        }
        var $item = _this._getNewModel(); //TODO: key is missing
        _this._fillElement($item, item);
        _this.$root.after($item);
        _this.onFillerRender(this, $item);
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
	// HTML5 valid attributes and tags (2018)
	_htmlGenTags : ["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","datalist","dd","del","details","dfn","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","map","mark","menu","meter","nav","ol","optgroup","option","output","p","pre","progress","q","rp","rt","ruby","samp","section","select","small","span","strong","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","tr","tt","ul","var"],
    // Clone data object
    _cloneData : function() {
        return JSON.parse(JSON.stringify(this._data));
    },
    // Render an element with its values
    _doRender : function($elem, value) {
        var _this = this;
		if($.isArray(value)) {
			for(var i = 0; i < value.length; i++) {
                var $item = _this._getNewModel();
                $item.data("id", i);
                $elem.before($item);
				_this._setValues($item, value[i]);
			}
		} else { //Number, String or Objects
            // If it has a template, insert it before processing
            if($.isPlainObject(value) && value.template !== undefined) {
				$elem.html(value.template);
            }
			_this._setValues($elem, value);
		}
    },
    // Returns a copy of the model to duplicate
    _getNewModel : function(key) {
        var _this = this;
        // If its array, search for template.
        var $origmodel = _this.$root.clone();
        if(!$origmodel.is("template")) {
            // Search specific template
            var css = key == undefined ? "" : "." + key;
            var $template = $origmodel.find("template" + css);
            if($template.length) {
                $origmodel = $template;
            } else if(css) {
                // if not found... Search by class
                $template = $origmodel.find(css);
                if($template.length) {
                    $origmodel = $template;
                } else {
                    console.log("Unable to find template with class: " + css);
                }
            } else {
                console.log("<template> tag not found inside model root");
            }
        }
        return $origmodel.children() > 1 ? $origmodel : $($origmodel.html());
    },
    // Set values in elements
    _setValues : function($elem, value) {
        var _this = this;
        if($.isPlainObject(value)) {
            _this._setNode($elem, value);
            for(var key in value) {
                if(key != "template") {
                    if(key == "text" || key == "html") {
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
	_setNode: function($node, obj) {
		if(obj._node == undefined) {
			Object.defineProperty(obj, "_node", {
				enumerable: false,
				writable: true
			});
			obj._node = $node;
		}
	},
	_proxy : function(object, onChange) {
		const handler = {
			get(target, property, receiver) {
				if(property == "_node") {
					return target._node;
				} else {
					try {
						return new Proxy(target[property], handler);
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
			}
		};
		return new Proxy(object, handler);
	},
    //----- setters and getters for data
    _data           : null,
    set data(value) {
        var _this = this;
        _this._data = value;
        _this.update(_this._data);
    },
    get data() {
        var _this = this;
        return _this._data;
    },
}
