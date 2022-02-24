/**
 * M2D2 Alerts Extension
 * @since 2021-05-20
 *
 * A replacement of `alert`,`prompt` and `confirm`. Inspired by `SweetAlert`, with
 * customizable theme and better M2D2 integration.
 *
 * This extension provides:
 * $.wait       : Displays a spinner without any button in it.
 * $.alert      : Displays a simple message with "ok" button.
 * $.success    : Same as $.alert, but show a "check" icon.
 * $.failure    : Same as $.alert, but shows a "warning" icon.
 * $.confirm    : Displays a confirmation message with "yes" and "no" buttons.
 * $.prompt     : Displays an input prompt with "cancel" and "send" buttons.
 * $.message    : Free form message (all the previous implementations uses this function)
 * $.closeAll   : Close any message that might be open

 * Documentation :
 * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/alert.md
 * https://github.com/intellisrc/m2d2/tree/master/documentation/alert.md
 */
m2d2.load($ => {
    function close(afterClose) {
        let winExists = $.exists("#m2d2-alert .m2d2-alert-front");
        if(winExists) {
            let win = $("#m2d2-alert .m2d2-alert-front");
            win.css.add("vanish");
            setTimeout(() => {
                let winExists = $.exists("#m2d2-alert .m2d2-alert-front");
                if(winExists) {
                    $("#m2d2-alert").remove(); // Be sure it exists before trying to remove
                }
                if(afterClose) {
                    afterClose();
                }
            }, 400); //Animation takes 500, after that will be restored, so we need to remove it before that time.
        } else {
            if(afterClose) {
                afterClose();
            }
        }
    }
    const faIcons = {
        wrap     : false,
        question : ["fa", "fa-question-circle"],
        info     : ["fa", "fa-exclamation-circle"],
        error    : ["fa", "fa-exclamation-triangle"],
        ok       : ["fa", "fa-check"],
        input    : ["fa", "fa-edit"],
        wait     : ["fa", "fa-cog", "fa-spin"]
    }
    const material = {
        wrap     : "material-icons",
        question : "help",
        info     : "info",
        error    : "error",
        ok       : "done",
        input    : "edit",
        wait     : "pending"
    }
    const defaultCss = {
        wrap     : false,
        question : "icon_question",
        info     : "icon_info",
        error    : "icon_error",
        ok       : "icon_ok",
        input    : "icon_input",
        wait     : "icon_wait"
    }
    $.message = function(options) {
        let css = defaultCss;
        switch ($.messageIcons) {
            case "fa": css = faIcons; break
            case "material" : css = material; break
        }
        if(options) {
            if(! $.isFunction(options.callback)) {
                if(options.callback &&! options.text) {
                    options.text = options.callback;
                }
                options.callback = () => {}
            }
 		    if(! options.text) { options.text = "" }
        }
        close(() => { // Be sure we have no other alert
            $("body", {
                m2d2Alert : {
                    tagName : "div",
                    id : "m2d2-alert",
                    back : {
                        tagName : "div",
                        css : "m2d2-alert-back",
                        style : {
                            position : "absolute",
                            left :0,
                            right: 0,
                            top : 0,
                            bottom : 0,
                            backgroundColor : "#0005",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                        },
                        front : Object.assign({
                            tagName : "form",
                            css : (options.css ? ($.isArray(options.css) ? options.css : [options.css]) : [])
                                  .concat(["m2d2-alert-front", "popup", options.icon]),
                            style : {
                                zIndex : 100
                            },
                            icon : {
                                tagName : "span",
                                css : ["icon", options.icon].concat(css.wrap ? [css.wrap] : css[options.icon]).concat(options.icon === "wait" ? "spin" : ""),
                                text : css.wrap ? css[options.icon] : ""
                            },
                            message : {
                                tagName : "div",
                                css : "m2d2-alert-title",
                                span : options.title
                            },
                            submsg : (() => {
                                let props = {
                                   tagName : "div",
                                   css : "m2d2-alert-text"
                                }
                                let content;
                                if(options.icon === "input" &&! options.text) {
                                    content = {
                                        fieldset : {
                                            css : "m2d2-alert-field",
                                            input : {
                                                type : "text",
                                                name : "answer",
                                                onload : function() {
                                                    this.focus();
                                                }
                                            }
                                        }
                                    }
                                } else if($.isPlainObject(options.text)) {
                                    content = {
                                        fieldset : Object.assign({
                                            css : "m2d2-alert-field"
                                        }, options.text)
                                    }
                                } else {
                                    content = { span : options.text.replace("\n","<br>") }
                                }
                                return Object.assign(props, content);
                            })(options.icon),
                            onsubmit : function() {
                                const data = this.getData();
                                let func;
                                switch(data.button) {
                                    case "ok":
                                    case "yes":
                                        func = () => { options.callback(true, data) };
                                    break
                                    case "no":
                                        func = () => { options.callback(false, data) };
                                    break
                                    case "cancel":
                                        func = () => { options.callback(null, data) };
                                    break
                                    case "send":
                                        if(Object.keys(data).length === 1) {
                                            func = () => { options.callback(data[Object.keys(data)[0]], data) };
                                        } else if(Object.keys(data).length === 2) {
                                            func = () => { options.callback(data[Object.keys(data).find(it => it !== "button")], data) };
                                        } else { // If we have more than one field, we send all:
                                            func = () => { options.callback(data, data) };
                                        }
                                    break
                                    default: // When setting customized buttons, we send all:
                                        func = () => { options.callback(data, data) };
                                    break
                                }
                                close(func);
                                return false;
                            },
                            onload : function () {
                                const def = this.find("[autofocus]");
                                if(def) { def.focus(); }
                            }
                        }, function (ob) {
                            let newButtons = {};
                            if(ob.length) {
                                newButtons = {
                                    buttons : {
                                        tagName : "div",
                                        css : "m2d2-alert-buttons"
                                    }
                                };
                                ob.forEach(b => {
                                    const key = b.toLowerCase().replace(/[^a-z ]/g,"").replace(" ","_");
                                    newButtons.buttons[key] = {
                                        tagName : "button",
                                        type : "submit",
                                        value : key,
                                        css : ["color", key],
                                        text : $.dict !== undefined ? $.dict(b) : b,
                                        autofocus : ["ok","yes"].includes(b),
                                        formNoValidate : ["cancel"].includes(b),
                                        // we append a hidden input with the value of the button clicked:
                                        onclick : function() {
                                            $(this.closest("form"), {
                                                hide : {
                                                    tagName : "input",
                                                    type : "hidden",
                                                    name : "button",
                                                    value : this.value
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                            return newButtons;
                        }(options.buttons)
                        )
                    }
                }
            });
        });
        // Add automatically name to fields in case it is not specified:
        let i = 1;
        $("#m2d2-alert .m2d2-alert-front").findAll("input, select, textarea").forEach(elem => {
            if(elem.name === "") {
                elem.name = "field_" + i++;
            }
        });
        return { close : close };
    }
    $.wait = (title, text, callback) => {
        return $.message({
            icon : "wait",
            title : title,
            buttons : [],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.alert = (title, text, callback) => {
        return $.message({
            icon : "info",
            title : title,
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.success = (title, text, callback) => {
        return $.message({
            icon : "ok",
            title : title,
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.failure = (title, text, callback) => {
        return $.message({
            icon : "error",
            title : title,
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.confirm = (title, text, callback) => {
        return $.message({
            icon : "question",
            title : title,
            buttons : ["yes", "no"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.prompt = (title, text, callback) => {
        return $.message({
            icon : "input",
            title : title,
            buttons : ["cancel","send"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.closeAll = () => {
        close();
    }
});
