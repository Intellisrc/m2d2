# M2D2 Language Extension

Add supports for multi-language interfaces.

This extension provides:

* $.dict(keyword, [variables])  : To get translations from dictionary
* $.lang(lang)                  : Set new language

## Usage:
1) First you need to specify a dictionary with this format:
```js
const dictionary = {
    save   : {
        en : "Save",
        es : "Archivar",
        'es-MX' : "Guardar" // More specific translation
    },
    cancel : {
        en : "Cancel Now",
        es : "Cancelar Ahora"
    }
}
```

2) Then on initialization (only once), set the dictionary:
```js
// Recommended way:
const _ = m2d2.load().dict.set(dictionary);

// Or:
m2d2.load($ => {
   $.dict.set(dictionary);
});
```

3) Specify which language you want to use as default:
```js
m2d2.ready($ => {
    $.lang('en');

    // You can set the shortcut here if you want and if you didn't set it before:
    const _ = $.dict;
    // Then use it as: (example)
    $("#myid", {
        text : _("some_key"),
        css : "translated"
    });
});
```

4) In HTML you can set which texts should be translated automatically:
```html
<span lang="es">Cancelar</span>
```       
Then, in the next step, it will be translated if it doesn't match the target language.

### Notes: 
If you use `lang` attribute in HTML, be sure that the language and the text matches the keys. 
For example, if your default language is English, you should do something like this:
```html
<span lang="en">Phone Number</span>
```

Then, in your dictionary, you should use the keyword (created automatically based on text):
```js
{
    phone_number : {
        en : "Phone Number",
        es : "Número de Teléfono"
    }
}
```
If the key is not found it will display it instead of the text. 
That is one way to know which keyword to use, another way
is getting the key from a text with: 
```js
$.lang.toKeyword("Some Text").
```
Also look at the `console` for any warning.

If your default language is not English, you have 3 options:

a) Create the interface in English and execute `$.lang('xx')` on ready (xx = your language code). That will translate the UI

b) Put keywords instead of English words:
```html
<span lang='en'>user_name_goes_here</span>
```
and execute `$.lang('xx')` on ready.

c) specify the keyword in the dataset: 
```html
<span class="usr" lang='pa' data-kw='username'>ਉਪਭੋਗਤਾ ਨਾਮ</span>
```
or in javascript:
```js
usr : {
    dataset : { kw : "username" },
    lang : "pa",
    text : "ਉਪਭੋਗਤਾ ਨਾਮ"
}
```

5) To set or change the language (by default it will use browser's default language), just call:
```js 
$.lang("en");
```

6) Get translation:
```js
user.title.text = $.dict("user");
// or:
user.title.text = _("user); // If you set the constant _
```

7) You can set your default language (page language) in your html tag:
```html
<html lang='es'>
```
that way this extension knows that your HTML content is by default in that language, 
and decide if we need to translated for the user.
If you don't set it, it will use the first element with the attribute `lang`.

8) You can execute some code when the language is changed by setting an event listener:
```js
$.lang.onchange = (new_lang) => { ... }
```

### Finally:
When you change the language, it will keep it in the local storage (at the browser),  so
if you refresh the page it will still use your selected language.
