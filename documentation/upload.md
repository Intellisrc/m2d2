# M2D2 XHR Upload Extension

Easy and clean way to open a file dialog (and upload) using any event.

This extension provides:
* $.upload

(This extension is included in XHR Bundle)

This code enables to send either all files as a single upload event: Sequence (S), or
separately: Parallel (P):

|                     | Parallel (P)   | Sequence (S)   | Comments                                                  |
|---------------------|----------------|----------------|-----------------------------------------------------------|
| Server receives     | File, File...  | Array of File  | If using (S), server must be prepared to receive an array |
| Progress indication | Real           | Calculated     | (S): Calculation are done in sequence                     |
| Max upload size     | MAX(file.size) | SUM(file.size) | Server settings may limit (S)                             |
| Max connections     | files.length   | Always 1       | Server settings may limit (P)                             |
| onDone              | each file      | all files      | I will return a response (see below)                      |
| onError             | each file      | all files      | In case of failure, (P) will be triggered independently   |

### NOTES
Parallel (P) method may be faster (if bandwidth allows it), but it could present performance issues.

## Usage:

```js
$.upload(event, {
    upload   : "http://localhost/page",
    onSelect : (files, sources) => { ... },
    onUpdate : (progress_pct, file, index) => { ... },
    onDone   : (response, allDone) => { ... }, // response: contains result from the server (JSON), in (S) will trigger each file.
    onError  : (response) => { ... }, // response: object with relevant information. In (S) will trigger independently.
    onResponse : (response) => { ... }, // Modify response from server (if needed)
    accept   : "*/*", // You can limit the file type, for example: "image/*", "image/jpg", etc.
    parallel : false, // If false, it will send all files in a sequence (S)
    field    : "file", //Field name 
    multiple : true, // Allow multiple files to be selected to upload,
    maxFiles : 0, // Maximum number of files to allow to upload. 0 = unlimited
    maxSizeMb: 0, // Maximum size per file (P) or total (S) to allow
});
```

## Example:
```html
<button id="uploader"></button>
<ul id="status"></ul>
```
```js
const status = $("#status", {
    template : {
        pct : {
            tagName : "span",
            css : "pct"
        },
        file : {
            tagName : "span",
            css "file"
        }
    },
    update : function(list) {
        this.items = list;
    }
});
const uploader = $("#uploader", {
    onclick : function(ev) {
        this.disabled = true;
        const ups = [];
        $.upload(ev, {
            field   : "file",
            upload  : "/upload",
            parallel : true,
            maxFiles : 30,
            maxSizeMb : 1000,
            onSelect : (files) => {
                upload.disabled = true;
                let index = 0;
                Array.from(files).forEach(file => {
                    ups[index] = { pct : 0, file : file.name }
                    status.update(ups);
                });
            },
            onUpdate : (pct, file, index) => {
                ups[index] = { pct : pct, file : file.name }
                status.update(ups);
            },
            onResponse : (response) => {
                console.log(response); 
            },
            onDone : (response, allDone) => {
                response.forEach(res => {
                    ups[res.index] = { pct : 100, file : res.file.name }
                    status.update(ups);
                });
                if(allDone) {
                    upload.disabled = false;
                }
            },
            onError : (response) => {
                console.log(response);
                upload.disabled = false;
            }
        });
    }
});    
```
