# M2D2 JS (Model to DOM 2)
A class to easily place data in DOM and update them immediately upon change.

This is my second version of "Model", that is why I named it M2D2. Also, for those Start Wars fans, it also kind of a joke.

Live Demo:
https://gl.githack.com/lepe/m2d2/raw/master/index.html

## Install

* Download (8.6Kb): [m2d2.min.js](https://gl.githack.com/lepe/m2d2/raw/master/js/m2d2.min.js) and set it in the HTML head.

**NOTE** As it has no dependencies, It can be used together with any other library or framework (e.g. JQuery)

## Extensions / Plugins:

* Style (< 1Kb) [m2d2.style.js](https://gl.githack.com/lepe/m2d2/raw/master/js/m2d2.style.src.js) : enable use of 'css', '-css', '+css', 'color', 'bgcolor' shortcuts

* Show (1.5Kb) [m2d2.show.js](https://gl.githack.com/lepe/m2d2/raw/master/js/m2d2.show.src.js) : enable use of 'show' to hide or show elements easily.

# Tutorial

## Hello World

```html
<body></body>
```
```js
const body = m2d2("Hello World");
```
That line will render "Hello World" into `<body>`.

In order to modify the content from javascript, set a variable as:
```js
body.text = "World replies 'Hello'"
```
Cool! But not very useful, so let's set it inside some element:
```html
<body>
  <h1></h1>
</body>
```
You can set H1 text in two ways:
```js
const title = m2d2({ 
    h1 : "Hello World"
});
```
It will search inside `<body>` for a tagname `<h1>` and set the text in it.

or:
```js
const title = m2d2("h1","Hello World");   <--- recommended
```
It query the CSS selector "h1" and place set the text in it. We will call this element: `root element`.
```js
//To modify it:
title.h1 = "Great!";
```

You can also use HTML:
```js
const title = m2d2("h1","<i>This</i> is interesting...");
title.html = "<b>Great!</b>";
```
If HTML is detected, it will be treated as HTML.

## Using an ID or class

What if you have more than one `h1`? You can use a class name or an ID to search for it:
```js
const title = m2d2({
  "#title"       : "Hello World",  //Example using an ID
  ".title_class" : "Hello World",  //Example using a class name  
  title_class    : "Hello World"   //Will look for a "title_class" tagname, or the class name 'title_class'
});
// To modify it:
title["#title"] = "New text";
title[".titleClass"] = "New text";
title.titleClass = "New text";
```
Note: Class names may or may not contain `.` at the begining. However if the class is the same as a tagname (for example, `button`), you will need to specify it as `.button` to distinguish it.

## Setting attributes

You can set attributes easily in this way:
```html
<section>
	<a class="special"></a>
</section>	
```
```js
const link = m2d2("section",{
  special : {						//It will search for '.special' inside '<section>'
	text  : "You are special",
	title : "I told you so...",
	href  : "http://ur.special",
	target: "_blank"
  }
});
```
Any attribute is possible. In this case, we use the `text` key to setup the text. You can use `html` to insert HTML if you want. It will become:
```html
<a class="special" title="I told you so..." href="http://ur.special" target="_blank">You are special</a>
```
```js
//To modify it:
link.special.title = "This is simple!";
link.special.html = "<img src='/img.jpg' />";
```

You can add non-existant attributes simply like this:
```js
link.special.hreflang = "en";
link.special['class'] = "active";
link.special['data-id'] = 100;
```

## Datasets

You can attach data to your elements in two ways:

Setting each attribute:
```js
    const link = m2d2("a.one", {
		'data-code' : "HM2001",
		'data-qty'  : 20
    });
```
Setting all at once (using `dataset` property):
```js
    const link = m2d2("a.two", {
		dataset : {
			code : "HM2001",
			qty  : 20
		}
	});
```

## Replacing data

If you need to replace the whole data object, there is a special function for that: `update()`.
You will need to access the `M2D2` object through its property: `.m2d2`:
```js
console.log(link.m2d2)
```
So, using the `M2D2` object, you can update like this:
(following the previous example...)

```js
link.m2d2.update("a.special", {			//Using the CSS selector directly
	text  : "I'm special too!",
	title : "You told me so...",
	href  : "http://iam.special",
	target: "_blank"
});
```

**NOTE**: By replacing the whole data, it will clear the contents inside the element automatically.

## Generating DOM

If we want to add HTML into an element, we can either pass the string to the `html` property: 

```js
const link = m2d2("a.special",{ 
	title : "I told you so...",
	href  : "http://ur.special",
	target: "_blank",
	html : "<img src='http://ur.special/logo.png' ... />"
});
```

... or generating it using an object: (recommended)

```js
const link = m2d2("a.special",{ 
	title : "I told you so...",
	href  : "http://ur.special",
	target: "_blank",
	img   : {
		'class' : "thumbnail",
		src : "http://ur.special/logo.png",
		alt : "UR Special logo",
		width: 32,
		height: 32
	}
});
```
The above example will create : 
```html
<a class="special" title="I told you so..." href="http://ur.special" target="_blank">
  <img src="http://ur.special/logo.png" width="32" height="32" class="thumbnail" />
</a>
```
The main advantage of using an object (vs HTML) is that you can update its properties in this way: 
```js
a.special.img.src = "http://ur.special/logo_alt.png";
```

**NOTE** : To specify a CSS class, the following are equivalent:

```js
    img : {
        'class' : "thumbnail",   //Using the HTML attribute (must be between quotes as its a JS reserved keyword)
        className : "thumbnail", //Using the DOM attribute
        css : "thumbnail"        //Using `style` plugin (Explained later)
    }
```

## Adding Events

To add an event to an element, its as simple as specifying it inside your data:

```js
const link = m2d2("a.special",{
	onclick : function(event) {
		alert("You just clicked this link!");
	}
});
```
**NOTE** : You can access the target DOM element through `this`: 

```js
...
	onclick : function(event) {
		alert(this.nodeName); // 'this' is a DOM element
	}
...
```

If you are using jQuery, you can use it as usual:
```js
...
	onclick : function(event) {
		$(this).css("color", "green");
	}
...
```

You can attach events to child elements as well:

```js
const link = m2d2("a.special", {
    text : "My Special Link",
    img : {
        onclick : function(event) {
            alert("You just clicked the image inside link!");
        }    
    }
});
```

## Special events

For advanced usages, you can hook some function before or after each element is rendered. For example:

```js
const link = m2d2("a.special", {
    text : "My Special Link",
    img : {
		oninit : function() {
			//Before rendering the image
		},
		onrender : function() {
			//After the image has been placed
		}
    },
	onrender : function() {
		//After all "link" object has been rendered
	}
});
```

## Using a function as data

If your data comes from a service, you can convert it using a custom function, for example:

Original JSON:
```json
[{"title":"London","location_type":"City","woeid":44418,"latt_long":"51.506321,-0.12714"}]
```
```html
<table id="location">
  <tr><th>Location: </th><td class="place"></td></tr>
  <tr><th>Type: </th><td class="type"></td></tr>
  <tr><th>Latitude: </th><td class="lat"></td></tr>
  <tr><th>Longitude: </th><td class="lng"></td></tr>
</table>
```
```js
const location = m2d2("#location", function(callback) {
  $.get("https://www.metaweather.com/api/location/search/?query=london", function(json) {
	callback({
		place : json.title,
		type  : json.location_type,
		lat   : json.latt_long.split(',')[0],
		lng   : json.latt_long.split(',')[1]
	});
  });
});
```
In this example, we use a service to get our `json` data and convert it into our data object. 

NOTE: M2D2 will try to guess which kind of data will receive in the callback during its creation. 
In case your m2d2 object is empty after calling `callback`, it can be fixed by returing an empty `object` or `array`:

```js
const why_empty = m2d2(function(callback) {
	setTimeout(function(){
		callback([1,2,3,4,5])
	}, 5000);
	// In case 'why_empty' has no elements after calling the above 'callback', we specify the type here:
	return []; //This will tell M2D2 that you are expecting an array. Use 'return {}' for an object.
});
```
If you want to update your DOM in an interval, you can specify the amount of milliseconds as second argument of the callback:
```js
const location = m2d2("#location", function(callback) {
...
    callback({
        place : json.title,
        type  : json.location_type,
        lat   : json.latt_long.split(',')[0],
        lng   : json.latt_long.split(',')[1]
    }, 10000); // Retrieve the data every 10 seconds
});
```

To update the data, is the same as before:
```js
location.place = "Great Britain";
```
If you want to stop the interval, you can use the property `interval` of your `M2D2` object:
```js
//You can stop it with:
clearInterval(location.m2d2.interval);
```

## Updating data (function) on command

If you want to call your function on demand, you can use the `update` function inside the `M2D2` object:

```js
location.m2d2.update();
```

If you want to update it with a parameter, you need to set a second argument:

```js
const location = m2d2("#location", function(callback, param) {
  if(param == undefined) {
	param = "tokyo";
  }
  $.get("https://www.metaweather.com/api/location/search/?query="+param, function(json) {
	callback({
		place : json.title,
		type  : json.location_type,
		lat   : json.latt_long.split(',')[0],
		lng   : json.latt_long.split(',')[1]
	});
  });
});
```
**NOTE**: During initialization, the parameter is undefined. That is why you need to set your default value by checking if its undefined or not.

We can now call the function on demand with a parameter:

```js
location.m2d2.update("london");
```

To reset it to the default value, just call it without parameters:

```js
location.m2d2.update();
```

## Creating lists and using Templates

You can generate elements based in an array. In order to do so, we will need a template that we will use as model for each item.
There are 3 ways to specify a template:

1. as second argument of the callback() function (recommended)
2. as `template` property
3. as HTML inside a `<template>` tag inside your element (recommended)
4. as HTML inside your `element`

The code will search for it in that order. 

### 1. as second argument of the callback() function

```html
<dl id="dictionary"></dl>
```

```js
const dictionary = m2d2("#dictionary", function(callback) {
	//Example using JQuery XHR:
	$.get("/words.json").done(function(words){
		const list = [];
		for(let w in words) {
			const word = words[w];
			list.push({
				dt : word.title,
				dd : word.definition
			});
		}
		callback(list);
	}, { //This is the template:
		dt : {
			'class' : "title",
			onclick : function(event){
				alert("This word is:" , event.target.text);
			}
		},
		dd : {
			'class' : "definition"
		}
	}, 60000); //You can se the interval as last argument.

	//TODO: idea:
	return {
		onmouseover : function(event) {
			event.target.className = "over";
		}
	}
});

```

### 2. as 'template' property (explained later)

Sometimes we might only want to duplicate some element and change few properties. We can use 'template' and 'items' pairs in any element, for example:

Initial HTML:
```html
<table></table>
```

**NOTE** : "template" property must be specified before "items" or it won't be displayed (current limitation).

```js
const table = m2d2("table", {
	tr : {
		template : {
			td : {
				'class' : "cell"
			}
		},
		items : [
			{ text : "ID",		title : "Product ID", onclick: function(event){ ... } },
			{ text : "Product", title : "Product Name" },
			{ text : "Price",	title : "Product Price" },
			{ 
				label : "Qty",
				input : {
					type : "number",
					name : "qty",
					min  : 0,
					max  : 10
				}
				title : "Quantity" 
			}
		]
	}
});

```

After rendering:
```html
<table>
	<tr>
		<template><td class="cell"></td></template>	//TODO: should it be created?
		<td class="cell" title="Product ID">ID</td>
		<td class="cell" title="Product Name">Product</td>
		<td class="cell" title="Product Price">Price</td>
		<td class="cell" title="Quantity">
			<label>Qty</label>
			<input type="number" name="qty" min="0" max="10" />
		</td>
	</tr>
</table>
```

//TODO: this will be implemented?? (as 3rd argument)

The shortest way to use a template is specifying it as `string`, which will be translated into an HTML tag. This is useful for very simple data structures:

```html
<div id="buttons"></div>
```
```js
const buttons = m2d2("#buttons", [
	{ text : "Click Me", onclick : function(ev) { alert("First button"); } },
	{ text : "Submit", onclick : function(ev) { alert("Second button"); } }
], "button"); // Template: It will become: <button></button>, it can also be HTML
```
### 2. as HTML inside a `<template>` tag inside your `root element`.

The `<template>` element is not displayed by the browsers, so you can use it to specify only the part of the HTML you want to replicate:

```html
<ul id="list">
  <li class="fixed">This item its fixed and won't be duplicated</li>
  <template><li class="item"></li></template>
</ul>
```

```js
const list = m2d2("#list", [
	{ 
		id : 1,
		style: {
            color: "red"
        },
		text: "First item"
	},
	{ 
		id : 2,
		style: {
            color: "green"
        },
		text: "Second item"
	},        
	{ 
		id : 3,
		style: {
            color: "blue"
        },
		text: "Third item"
	}           
]);
```
**NOTE**: Any `id` field is converted automatically to `data-id`.

Styles can be declared as string:
```js
    style : "position: absolute; color: black"
```
or as object: (as in the previous example)
```js
    style : {
        position: "absolute",
        color   : "black"
    }
```
All styles supported by the browser can be specified.
The main difference is that as String, it will replace all current styles
(specified inline), while as Object, it will only replace/add such styles, 
and will keep the rest.

The HTML inside `<template>` is used to generate the list:

```html
<ul id="list">
  <li class="fixed">This item won't be duplicated because we have a template.</li>
  <template><li class="item"></li></template>
  <li class="item" style="color:red" data-id="1">First item</li>
  <li class="item" style="color:green" data-id="2">Second item</li>
  <li class="item" style="color:blue" data-id="3">Third item</li>
</ul>
```

Arrays are stored in the `items` property. The following is equivalent to the previous example:

```js
const list = m2d2("#list", {
	items : [
		{
			id : 1,
			style: "color: red",
			text: "First item"
		},
		... (and so on)
	]
});

```
So, to modify it:
```js
list.items[2].text = "2nd item";
```
You can even add or remove elements:
```js
list.items.push({
  id : 4,
  style: "color: yellow",
  text: "Fourth item"
});
list.items.splice(1,1);
```
And the HTML will be updated accordingly.


### 3. as HTML inside your 'root element'

When a template is not specified, the HTML inside our `root element` will be used as template and will be duplicated with the list.
```html
<select>
	<option>Select one</option>
</select>
```
```js
const options = m2d2("select", [
	{
		text : "First option",
		value : 1
	},
	{
		text : "Second option",
		value : 2
	}
]);
```
The `select` element, will have as options: `["Select one", "First option", "Second option"]`.

## List inside object

If you want to specify a list inside an object, you need to specify the `template` and the `items` properties:

```html
<form>
	<fieldset class="options">
	</fieldset>
</form>
```

```js
const form = m2d2("form", {
	action : "/post.php", //'form' property
	method : "POST",
	options : {
		legend : "Your options:", //fixed element that won't be duplicated
		template : {
			label : {
				text  : "",
				input : {
					name	: "option",
					type	: "radio",
					'class' : "pickone",
					required: true,
					disabled: false
				}
			}
		},
		items : [
			{ label : "First  ", input : { value : "one", checked : true } },
			{ label : "Second ", input : { value : "two", disabled: true } },
			{ label : "Third  ", input : { value : "three", required: false } },
		]
	}
});
```
Generated HTML:

```html
<form action="/post.php" method="POST">
	<fieldset class="options">
		<legend>Your options:</legend>
		<label>First  <input name="option" type="radio" class="pickone" required="true" disabled="false" checked /></label>
		<label>Second <input name="option" type="radio" class="pickone" required="true" disabled="true" /></label>
		<label>Third  <input name="option" type="radio" class="pickone" required="false" disabled="false" /></label>
	</fieldset>
</form>
```
Another example: 

```js
const table = m2d2("table", {
	//Note: The following line is equivalent to: "users : { items : [ ... ] }"
	users : [	//Using class name specified in tbody
		{ id: 10, name: "John Muller" },
		{ id: 20, name: "Peter Wilson" }
	]
}, {
    colgroup : {
        template : "col",
        items : [
            { width : "10%" },
            { width : "90%" }
        ]
    },
    thead : {
        tr : {
            template : "th",
            items : [
                {
                    text : "ID",
                    title : "User Number"
                },
                {
                    text : "Name",
                    title : "Full Name"
                }
            ]
        }
    },
    tbody : {
		'class' : 'users',
        onclick : function(event) { ... },
        template : {
			tr : "<td class='id'></td><td class='name'></td>"
		}
    }
});
```

You can alternatively define the items in a separate m2d2 object (which may be easier to manage):

```js
const table = m2d2("table", {
    colgroup : {
        template : "col",
        items : [
            { width : "10%" },
            { width : "90%" }
        ]
    },
	... same as before ...
});
const users = m2d2("table tbody.users", [
	{ id: 10, name: "John Muller" },
	{ id: 20, name: "Peter Wilson" }
]);

```

## Templates //TODO: already explained before?

Templates are useful to keep DOM elements separated from data, specially if your HTML definition is larger than the data itself. For example:

```js
const profile = m2d2("#profile", {
	section : {
		div : {
			h2 : {
				text : "Users",
				'class' : "subtitle"
			}
		}
		"user" : {
			onclick : function(event) { ... },
			text : "Peter Wilson",
			'class' : "enabled"
		}
	}
});
```
You can organize it by separating what is fixed from what is not: (which is easier to read)

```js
const profile = m2d2("#profile", {	
		user : "Peter Wilson"
}, { //Third argument is used as template:
	section : {
		div : {
			h2 : {
				text : "Users",
				'class' : "subtitle"
			}
		}
		"user" : {
			onclick : function(event) { ... },
			'class' : "enabled"
		}
	}
});
```

When using a function to retrieve the data, you can see its advantages:

**NOTE** : Please read the later section "Using a function as data" for more about "functions".

```js
const profile = m2d2("#profile", function(callback) {
	// XHR call using JQuery:
	$.get("/user.php?id=100").done(function(response) {
		callback({  user : response.name }); //assuming response is a JSON object
	});
}, {
	section : {
		div : {
			h2 : {
				text : "Users",
				'class' : "subtitle"
			}
		}
		"user" : {
			onclick : function(event) { ... },
			'class' : "enabled"
		}
	}
});
```

## Custom events

M2D2 defines custom events that you can use hook into:

```js
const link = m2d2("a.special", {
	oninit : function(my_m2d2) {
		//This is executed before we start rendering
	},
	onrender : function(my_m2d2, my_link) {
		//This is executed after all has been rendered
		//'my_link' is the rendered object "link"
	}
});
```

## Plugins

M2D2 comes with 2 plugins:

* `style` (m2d2.style.src.js) : Simplifies the way to set style or classes into elements:

```js 
{
    css : "Short version for: 'class' or className",
    color : "Set CSS color rule",
    bgcolor : "Set CSS background-color rule",
    "-css" : "Remove a class from the element",
    "+css" : "Add a class to the element"
}
```

* `show` (m2d2.show.src.js) : Show or hide elements:

```js
{
    show : "If false, will hide the element. If true will display it".
}
```
The main advantage of this plugin, is that it will preserve the previous CSS 'display:' rule. For example, if you have an element with `display:grid` and you hide it and show it again, it will correctly preserve the `grid` display.

## Creating your own plugins:

Extending M2D2 is as easy as:

```js
m2d2.ext({
    myext : function(value, node) {
        // value is in this example: "something"
        // node is in this example: `<a class='special'></a>` (as DOM element)
    }
});
//----- Usage ----
const link = m2d2("a.special",{
    myext : "something"
});
```

