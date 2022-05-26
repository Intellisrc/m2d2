/**
 * Author : A.Lepe (dev@alepe.com) - intellisrc.com
 * License: MIT
 * Version: 2.1.3
 * Updated: 2022-05-26
 * Content: Extension (Debug)
 */

/**
 *
 * M2D2 Upload Plugin
 * ver. 2021-12-03
 *
 * This extension provides:
 * $.upload
 *
 * Documentation :
 * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/upload.md
 * https://github.com/intellisrc/m2d2/tree/master/documentation/upload.md
 */
 m2d2.load($ => {
    $.upload = function(ev, options) {
      const opts = Object.assign({}, {
            // upload   : "http://localhost/page",
            // onSelect : (files, sources) => { ... },
            // onUpdate : (progress_pct, file, index) => { ... },
            // onDone   : (response, allDone) => { ... }, // response: contains result from the server (JSON), in (S) will trigger each file.
            // onError  : (response) => { ... }, // response: object with relevant information. In (S) will trigger independently.
            // onResponse : (response) => { ... }, // Modify response from server (if needed)
            accept   : "*/*", // You can limit the file type, for example: "image/*", "image/jpg", etc.
            parallel : false, // If false, it will send all files in a sequence (S)
            field    : "file", //Field name
            multiple : true, // Allow multiple files to be selected to upload,
            maxFiles : 0, // Maximum number of files to allow to upload. 0 = unlimited
            maxParallel : 0, // Maximum number of files to upload simultaneously. 0 = unlimited
            maxSizeMb: 0, // Maximum size per file (P) or total (S) to allow
      }, options);
      options = null; // Do not use it later:
      let el = window._protected_reference = document.createElement("INPUT");
      el.name = opts.field;
      el.type = "file";
      if(opts.multiple == true) {
        el.multiple = "multiple";
        //el.name += "[]";  //Enable if you are using PHP
      }
      if(! opts.upload) {
        console.log("Upload not specified. Using current page.")
        opts.upload = "";
      }
      if(opts.onDone == undefined)      { opts.onDone = (response, allDone) => { console.log(response) }}
      if(opts.onError  == undefined)    { opts.onError  = (response) => { console.log("Error : "); console.log(response); }}
      if(opts.onUpdate == undefined)    { opts.onUpdate = (pct, file, index) => { console.log("Uploading : " + pct + "% " + (opts.parallel ? "[ " + file.name + " ]" : "")) } }
      if(opts.onResponse == undefined)  { opts.onResponse = (res) => { return res } } // Return it without modifying it

      el.addEventListener('change', () => {
        if (el.files.length) {
            if(opts.maxFiles === 0 | el.files.length <= opts.maxFiles) {
                if(opts.onSelect) {
                    const srcs = [];
                    let totSize = 0;
                    Array.from(el.files).forEach(file => {
                        srcs.push(URL.createObjectURL(file))
                        totSize += file.size;
                    });
                    const mbs = totSize / (1024 * 1024);
                    if(opts.maxSizeMb && mbs > opts.maxSizeMb) {
                        opts.onError("Maximum size exceeded: " + Math.ceil(mbs) + "MB > " + opts.maxSizeMb + "MB")
                        return false;
                    } else {
                        opts.onSelect(el.files, srcs);
                    }
                }
                new Promise(resolve => {
                    if(opts.parallel) {
                        let index = 0;
                        const files = Array.from(el.files)
                        const fileDone = Array(files.length).fill(false);
                        let uploading = [];
                        // Process a single file
                        const uploadFile = function(file) {
                            new FileUpload(el.name, [file], index++, opts, (data, files, index) => {
                                fileDone[index] = true;
                                if(uploading.length) {
                                   delete uploading[uploading.indexOf(file)];
                                   uploading = uploading.filter(e => { return e === 0 || e });
                                }
                                const allDone = fileDone.indexOf(false) === -1;
                                opts.onDone(getResponse(data, files, index), allDone);
                                if(allDone) {
                                    resolve();
                                }
                            });
                        }
                        // Decide limits
                        if(opts.maxParallel) {
                            const timer = setInterval(() => {
                                if(files.length === 0) {
                                    clearInterval(timer);
                                } else {
                                    while(uploading.length < opts.maxParallel * 1) {
                                        const file = files.shift();
                                        uploading.push(file);
                                        uploadFile(file);
                                    }
                                }
                            }, 100);
                        } else { // No limits
                            files.forEach(uploadFile);
                        }
                    } else {
                        new FileUpload(el.name, el.files, 0, opts, (data, files, index) => {
                            opts.onDone(getResponse(data, files, index), true);
                            resolve();
                        });
                    }
                }).then(() => { // clear / free reference
                  el = window._protected_reference = undefined;
                });
            } else {
                opts.onError("Max file limit exceeded. Maximum files: " + opts.maxFiles);
                return false;
            }
        }
      });
      el.click(); // open dialog
    }

    function getResponse(data, files, index) {
        const response = [];
        data = data || {};
        files.forEach(f => {
            const row = (typeof data == "Array") ? (data.length == files.length ? data[index] : data)
                                                 : (data[f.name] !== undefined ? data[f.name] : data)
            response.push({
                file  : f,
                data  : row,
                index : index++,    // in case of 1x1 it will be called only once, otherwise, it will be incremented.
            });
        });
        return response;
    }
    /**
     * Upload file using XHR
     */
    function FileUpload(fieldName, files, index, options, callback) {
      const xhr     = new XMLHttpRequest();
      files         = Array.from(files);

      xhr.upload.addEventListener("progress", function(e) {
        if (e.lengthComputable) {
          if(options.parallel) {
              const percentage = Math.round((e.loaded * 100) / e.total);
              options.onUpdate(percentage, files[0], index);
          } else {
              let sizeAccum = 0;
              let i = 0;
              files.some(f => {
                  sizeAccum += f.size;
                  const percentage = e.loaded >= sizeAccum ? 100 : 100 - Math.round(((sizeAccum - e.loaded) * 100) / f.size);
                  //console.log("File: " + f.name + " Size: " + f.size);
                  //console.log("Loaded: " + e.loaded + " Accum: " + sizeAccum + " Total: " + e.total + " Pct: " + percentage)
                  options.onUpdate(percentage, f, i++);
                  return sizeAccum >= e.loaded;
              });
          }
        }
      }, false);

      xhr.addEventListener("load", function(e) {
        let data = {};
        try {
            data = xhr.responseText ? JSON.parse(xhr.responseText) : {
                error: {type: "Unknown", reason: "Unknown Error"}
            };
        } catch(err) {
            data.error = { type : "Parse Error", reason : err.message }
        }
        if (xhr.status >= 200 && xhr.status < 400) {
            callback(options.onResponse(data), files, index);
        } else {
            if(typeof data.error == "string") {
                data.error = { type : "Exception", reason : data.error }
            }
            options.onError(data.error);
        }
      }, false);

      xhr.open("POST", options.upload);

      const loaded = Array(files.length).fill(false);
      const form    = getFileForm(fieldName, files);
      let loadIndex = 0;
      files.forEach(f => {
          if(f) {
              const reader  = new FileReader();
              reader.onload = function(evt) {
                loaded[loadIndex++] = true;
                if(loaded.indexOf(false) === -1) {
                    xhr.send(form);
                }
              };
              reader.readAsBinaryString(f);
          }
      });
    }
    /**
     * Prepares form
     */
    function getFileForm(fieldName, files) {
        const form = new FormData();
        files.forEach(file => {
            if(file) {
                form.append(fieldName, file, file.name);
            }
        });
        return form
    }
 });
