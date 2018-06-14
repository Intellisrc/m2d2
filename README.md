# M2D2 JS (Model to DOM 2)
A class to easily place data in DOM and update them immediately upon change.

This is my second version of "Model", that is why I named it M2D2. Also, for those Start Wars fans, it also kind of a joke.

Live Demo:
https://gl.githack.com/lepe/m2d2/raw/master/index.html

Extension Demo:
https://gl.githack.com/lepe/m2d2/raw/master/extend.html

Form Demo:
https://gl.githack.com/lepe/m2d2/raw/master/form.html

## Install

* Download (6Kb): m2d2.min.js and set it in the HTML head.

**NOTE** As it has no dependencies, It can be used together with any other library or framework (e.g. JQuery)

## Hello World

```html
<body></body>
```
```js
var body = m2d2({ data: "Hello World" });
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
```js
var title = m2d2({ 
    data: {
         h1 : "Hello World"
    }
});
//To modify it:
title.h1 = "Great!";
```
It will search inside `<body>` for a tagname `<h1>` and place the text in it.
You can alternatively use this way, in which `h1` is used as root instead of `body`:
```js
var title = m2d2({ 
  root: "h1",
  data: "Hello World" 
 });
//To modify it:
title.text = "<b>Great!</b>";
```
If HTML is detected, it will be treated as HTML.

## Using an ID or class

What if you have more than one `h1`? You can use a class name or an ID to search for it:
```js
var title = m2d2({ 
    data: {
      "#title"      : "Hello World",  //Example using an ID
      ".titleClass" : "Hello World",  //Example using a class name
      titleClass    : "Hello World"   //Same as above
    }  
});
// To modify it:
title["#title"] = "New text";
title[".titleClass"] = "New text";
title.titleClass = "New text";
```
Class names may or may not contain `.` at the begining.

## Setting attributes

You can set attributes very easy in this way:
```html
<a class="special"></a>
```
```js
var a = m2d2({ 
    data: {
      special : {
        text  : "You are special",
        title : "I told you so...",
        href  : "http://ur.special",
        target: "_blank"
	  }
    }  
});
```
Any attribute is possible. In this case, we use the `text` key to setup the text. You can use `html` to insert HTML if you want. It will become:
```html
<a class="special" title="I told you so..." href="http://ur.special" target="_blank">You are special</a>
```
```js
//To modify it:
a.special.title = "This is simple!";
a.special.html = "<img src='/img.jpg' />";
```

You can add non-existant attributes simply like this:
```js
a.special.hreflang = "en";
a.special['class'] = "active";
```

## Replacing data

If you need to replace the whole data object, there is a special function for that: `update()`.
You will need to access the `M2D2` object through its property: `.m2d2`:
```js
console.log(a.m2d2)
```
So, using the `M2D2` object, you can update like this:
(following the previous example...)

```js
a.m2d2.update({
  special : {
	text  : "I'm special too!",
	title : "You told me so...",
	href  : "http://iam.special",
	target: "_blank"
  }
});
```

**NOTE**: By replacing the whole data, it will clear the contents of the root element automatically.

## Generating DOM

If we want to add HTML into an element, we can either pass the string to the `html` property: 

```js
var a = m2d2({ 
    data: {
      special : {
        title : "I told you so...",
        href  : "http://ur.special",
        target: "_blank",
		html : "<img src='' />"
    }  
 });
```

... or generating it using an object: (recommended)

```js
var a = m2d2({ 
    data: {
      special : {
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

## Using Templates

Sometimes may be useful to keep a template together with your data structure to be sure that it won't be 'accidentally' changed by the designers. In those cases, you can specify the `template` property:

```html
<div id="clock"></div>
```
```js
var clock = m2d2({
	root : "#clock",
	template: "<time><span></span><a href='http://www.thetimezoneconverter.com/'>Convert Time</a></time>",
	data : {
		time : {
			datetime : date
			span : "Now: " + date
		}
	}
});
```
The `template` property also accepts an object:
```js
	template : {
		time : {
			span : "",
			a : {
				href : "http://www.thetimezoneconverter.com/",
				text : "Convert Time"
			}
		}
	}
```
Templates are not always required as this library will try to build the HTML based in your data, so the following will do exactly the same as the above examples:

```js
var clock = m2d2({
	root : "#clock",
	data : {
		time : {
			datetime : date
			span : "Now: " + date
			a : {
				href : "http://www.thetimezoneconverter.com/",
				text : "Convert Time"
			}
		}
	}
}
```
So, when do you really need the `template` property? I can only think of 2 situations: 

1. You have more HTML than what you want to specify in your data, and you want to keep your data object as small as possible. 
2. When using lists: explained below.

## Creating lists

You can generate elements based in an array. In order to do so, we will need a template that we will use as model for each item.
There are 3 ways to specify a template:

1. as `template` property (as explained in the previous topic).
2. as HTML inside a `<template>` tag inside your root element.
3. as HTML inside your root element.

The code will search for it in that order. 

In the following example, you don't need to specify any template. The default option will be used, duplicated and replaced by those specified inside `data`.
```html
<select>
	<option>Select one</option>
</select>
```
```js
var options = m2d2({
	root: "select",
	data : [
		{
			text : "First option",
			value : 1
		},
		{
			text : "Second option",
			value : 2
		}
	]
});
```

As the `<template>` child element, it is not displayed by the browsers, you can use it to specify only the part of the HTML you want to replicate:

```html
<ul id="list">
  <li class="fixed">This item its fixed and won't be duplicated</li>
  <template><li class="item"></li></template>
</ul>
```

```js
var list = m2d2({ 
    root: "#list",
    data: [
            { 
                id : 1,
                style: "color: red",
                text: "First item"
            },
            { 
                id : 2,
                style: "color: green",
                text: "Second item"
            },        
            { 
                id : 3,
                style: "color: blue",
                text: "Third item"
            }           
          ]
 });
```
The HTML inside `<template>` is used to generate the list:

```html
<ul id="list">
  <li class="fixed">This item its fixed and won't be duplicated</li>
  <template><li class="item"></li></template>
  <li class="item" style="color:red" data-id="1">First item</li>
  <li class="item" style="color:green" data-id="2">Second item</li>
  <li class="item" style="color:blue" data-id="3">Third item</li>
</ul>
```
**NOTE**: Any `id` field is converted automatically to `data-id`.

To modify it:
```js
list[2].text = "2nd item";
```
You can even add or remove elements:
```js
list.push({
  id : 4,
  style: "color: yellow",
  text: "Fourth item"
});
list.splice(1,1);
```
And the HTML will be updated accordingly.

## List inside object

If you want to specify a list inside an object, you need to specify the `template` and the `data` properties:

```js
var form = m2d2({
	root : "form",
	data : {
		options : {
			legend : "Your options:",
			template : {
				label : "",
				input : {
					type	: "radio",
					'class' : "pickone",
					required: true,
					disabled: false
				}
			},
			data : [
				{ label : "First",  input : { value : "one", checked : true } },
				{ label : "Second", input : { value : "two", disabled: true } },
				{ label : "Third",  input : { value : "three" } },
			]
		}
	}
});
```
```html
<form>
	<fieldset class="options">
	</fieldset>
</form>
```

## Using a function as data

What if your data comes from a service? You can convert it using a custom function, for example:

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
var location = m2d2({
  root: "#location",
  data: function(callback) {
      $.get("https://www.metaweather.com/api/location/search/?query=london",function(json) {
        callback({
            place : json.title,
            type  : json.location_type,
            lat   : json.latt_long.split(',')[0],
            lng   : json.latt_long.split(',')[1]
        });
      });
  }
});
```
In this example, we use a service to get our `json` data and convert it into our data object. If you are planning to call such function in an interval, you can either specify it with the option `interval` or as second argument of the callback:
```js
var location = m2d2({
  root: "#location",
  data: ...,
  interval: 10000 //Every 10 seconds
});
```
```js
...
    callback({
        place : json.title,
        type  : json.location_type,
        lat   : json.latt_long.split(',')[0],
        lng   : json.latt_long.split(',')[1]
    }, 10000); // Retrieve the data every 10 seconds
...
```
To update the data, is the same as before:
```js
location.place = "Great Britain";
```

If you are using intervals and you want to stop it, you can use the property `interval` of your `M2D2` object:
```js
var location = m2d2({
  root: "#location",
  data: ...,
  interval: 10000 //Every 10 seconds
});
//Then you can stop it with:
clearInterval(location.m2d2.interval);
```

## Updating data (function) on command

What if you want to call your function on demand, and with a parameter?
Let's modify our previous example:

```js
var location = m2d2({
  root: "#location",
  data: function(callback, param) {
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
  }
});
```
With that small modification, we can now call the function on demand with a parameter:

```js
	location.m2d2.update("london");
```

**NOTE**: During initialization, the parameter is undefined. That is why you need to set your default value by checking if its undefined or not.

To reset it to the default value, just call it without parameters:

```js
	location.m2d2.update();
```

