# modeljs
A class to easily place data in DOM and update them immediately upon change.

Live Example:
https://rawgit.com/lepe/modeljs/master/index.html

## Requirements

* JQuery or similar library.
* Download: model.min.js (and set it in the HTML head after jquery)
* Create Model objects after DOM is ready

## Hello World

```html
<body></body>
```
```js
new Model({ data: "Hello World" });
```
That line will render "Hello World" into `<body>`.
Cool! But not very useful, so let's set it inside some element:
```html
<body>
  <h1></h1>
</body>
```
```js
new Model({ 
    data: {
         h1 : "Hello World"
    }
 });
```
It will search inside `<body>` for a tagname `<h1>` and place the text in it.
You can alternatively use this way:
```js
new Model({ 
  root: "h1",
  data: "Hello World" 
 });
```
In here, we will set `<h1>` as our element root (instead `<body>`)

What if you have more than one `h1`? You can use a class name or an ID to search for it:
```js
new Model({ 
    data: {
      "#title"      : "Hello World",  //Example using an ID
      ".titleClass" : "Hello World",  //Example using a class name
      titleClass    : "Hello World"   //Same as above
    }  
 });
```
Class names may or may not contain `.` at the begining.

## Setting attributes

You can set attributes very easy in this way:
```html
<a class="special"></a>
```
```js
new Model({ 
    data: {
      special : {
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

## Generating DOM

If we want to add HTML into an element, we can either pass the string in `html` as previously explained, or generating it using an object:

```js
new Model({ 
    data: {
      special : {
        text  : "You are special",
        title : "I told you so...",
        href  : "http://ur.special",
        target: "_blank",
        img   : {
            'class' : "thumbnail",
            src : "http://ur.special/logo.png",
            width: 32,
            height: 32
        }
    }  
 });
```
The above example will create : 
```html
<a class="special" title="I told you so..." href="http://ur.special" target="_blank">
  You are special
  <img src="http://ur.special/logo.png" width="32" height="32" class="thumbnail" />
</a>
```

... to be continue ...
