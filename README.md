# modeljs
A class to easily place data in DOM and update them immediately upon change.

Live Example:
https://rawgit.com/lepe/modeljs/master/index.html

## Requirements

* JQuery or similar library.
* Download (5Kb): [model.min.js](https://raw.githubusercontent.com/lepe/modeljs/master/js/model.min.js) (and set it in the HTML head after jquery)
* Create Model objects after DOM is ready

## Hello World

```html
<body></body>
```
```js
var body = new Model({ data: "Hello World" });
```
That line will render "Hello World" into `<body>`.

In order to modify the content from javascript, set a variable as:
```js
body.data = "World replies 'Hello'"
```
Cool! But not very useful, so let's set it inside some element:
```html
<body>
  <h1></h1>
</body>
```
```js
var title = new Model({ 
    data: {
         h1 : "Hello World"
    }
});
//To modify it:
title.data.h1 = "Great!";
```
It will search inside `<body>` for a tagname `<h1>` and place the text in it.
You can alternatively use this way:
```js
var title = new Model({ 
  root: "h1",
  data: "Hello World" 
 });
 /To modify it:
title.data.h1 = "Great!";
```
In here, we will set `<h1>` as our element root (instead `<body>`)

## Using an ID or class

What if you have more than one `h1`? You can use a class name or an ID to search for it:
```js
var title = new Model({ 
    data: {
      "#title"      : "Hello World",  //Example using an ID
      ".titleClass" : "Hello World",  //Example using a class name
      titleClass    : "Hello World"   //Same as above
    }  
});
// To modify it:
title.data["#title"] = "New text";
title.data[".titleClass"] = "New text";
title.data.titleClass = "New text";
```
Class names may or may not contain `.` at the begining.

## Setting attributes

You can set attributes very easy in this way:
```html
<a class="special"></a>
```
```js
var a = new Model({ 
    data: {
      special : {
        text  : "You are special",
        title : "I told you so...",
        href  : "http://ur.special",
        target: "_blank"
    }  
}).get(); // .get() explained below.
```
Any attribute is possible. In this case, we use the `text` key to setup the text. You can use `html` to insert HTML if you want. It will become:
```html
<a class="special" title="I told you so..." href="http://ur.special" target="_blank">You are special</a>
```
**Note**: if you add `.get()` (which is recommended for objects and arrays), the data object will be returned, so instead of using `a.data` you can use a shorter version to update the values:
```js
a.special.title = "This is much simpler!";
```
## Generating DOM

If we want to add HTML into an element, we can either pass the string in `html` as previously explained, or generating it using an object:

```js
var a = new Model({ 
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
 }).get();
```
The above example will create : 
```html
<a class="special" title="I told you so..." href="http://ur.special" target="_blank">
  <img src="http://ur.special/logo.png" width="32" height="32" class="thumbnail" />
</a>
```
To modify it:
```js
a.special.img.src = "http://ur.special/logo_alt.png";
```

## Creating lists

You can generate elements based in an array. In order to do so, the recommended way is to add `<template>` child element (which is not displayed by the browser). For example:

```html
<ul id="list">
  <template><li class="item"></li></template>
</ul>
```

```js
var list = new Model({ 
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
 }).get();
```
The HTML inside `<template>` is used to generate the list:

```html
<ul id="list">
  <li class="item" style="color:red" data-id="1">First item</li>
  <li class="item" style="color:green" data-id="2">Second item</li>
  <li class="item" style="color:blue" data-id="3">Third item</li>
  <template><li class="item"></li></template>
</ul>
```
Note: Any `id` field is converted automatically to `data-id`.

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

## Using a function as data

What if your data comes from a service? You can convert it using a custom function, for example:

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
var location = new Model({
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
}).get();
```
In this example, we use a service to get our `json` data and convert it into our data object. If you are planning to call such function in an interval, you can either specify it with the option `interval` or as second argument of the callback:
```js
var location = new Model({
  root: "#location",
  data: ...,
  interval: 10000 //Every 10 seconds
}).get();
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

If you are using intervals and you want to stop it, you will need to keep a reference to the Model:
```js
var locationModel = new Model({
  root: "#location",
  data: ...,
  interval: 10000 //Every 10 seconds
});
var location = locationModel.get();
...
//Then you can stop it with:
clearInterval(locationModel.interval);
```
