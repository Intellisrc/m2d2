/**
 * M2D2 Alerts Extension
 * @since 2021-05-20
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
 *
 * Example Usage:
 *   - Common uses:
 *  $.wait :
 *      const waitMsg = $.wait("Please wait...");
 *      setTimeout(() => { waitMsg.close(); }, 2000);
 *
 *  $.alert, $.success, $.failure :
 *      $.alert("Hint of the day", "To exit, click in 'logout' button.", () => { console.log("The alert has been closed.") });
 *      $.success("Data has been saved!", () => { console.log("The alert has been closed. I didn't specified text, just title.") });
 *      $.failure("Server error"); //Display just the message
 *
 *  $.confirm:
 *      $.confirm("Are you sure?", "You are about to delete all images!", (res) => { if(res) { console.log("All images are gone!") });
 *
 *  $.prompt:
 *      $.prompt("Please enter your name:", (res) => { console.log("your name is:" + res); });
 *      $.prompt("Please enter your age:", "No need to lie...", (res) => { console.log("your age is:" + res); });
 *      $.prompt("Please enter your sex:", {
 *          select : ["Female","Male","Other"]
 *      }, (res, raw) => { console.log("your sex is:" + res); });
 *
 *  $.message:
 *      $.message({
            icon : "times",     // OPTIONAL: you can use : "question", "info", "error", "ok", "input", "wait"
            css  : "special",   // Set class or classes
            title : "Title",
            text  : "Text to use",
            buttons : ["No way!", "Roger"], // Specify button text and classes which in this case be: "no_way" and "roger"
            callback : function() {}
        });
 *
 *  Notes:
 *   - callback gets two arguments:
 *        * The first one is the simplest return value when possible
 *        * The second one is the form data as an object, for example: { button : "send", answer : "Hello" }
 */
m2d2.load($ => {
    function close(afterClose) {
        let win = $("#m2d2-alert .m2d2-alert-front");
        if(win) {
            win.css.add("vanish");
            setTimeout(() => {
                win = $("#m2d2-alert .m2d2-alert-front");
                if(win) {
                    $("#m2d2-alert").remove(); // Be sure it exists before trying to remove
                }
                if(afterClose) {
                    afterClose();
                }
            }, 400); //Animation takes 500, after that will be restored, so we need to remove it before that time.
        }
    }
    function getIconClass(type) {
        let css = [];
        switch(type) {
            case "question" :
                css = ["fa", "fa-question-circle"];
            break
            case "info" :
                css = ["fa", "fa-exclamation-circle"];
            break
            case "error":
                css = ["fa", "fa-exclamation-triangle"];
            break
            case "ok":
                css = ["fa", "fa-check"];
            break
            case "input":
                css = ["fa", "fa-edit"];
            break
            case "wait":
                css = ["fa", "fa-cog", "fa-spin"];
            break
        }
        return css
    }
    $.message = function(options) {
        if(options) {
            if(! $.isFunction(options.callback)) {
                if(options.callback &&! options.text) {
                    options.text = options.callback;
                }
                options.callback = () => {}
            }
 		    if(! options.text) { options.text = "" }
        }
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
                    front : {
                        tagName : "form",
                        css : (options.css || []).concat(["m2d2-alert-front", "popup", options.icon], getIconClass(options.icon)),
                        style : {
                            zIndex : 100
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
                    }
                }
            }
        });
        if(options.buttons.length) {
            const newButtons = {
                buttons : {
                    tagName : "div",
                    css : "m2d2-alert-buttons"
                }
            };
            options.buttons.forEach(b => {
                const key = b.toLowerCase().replace(/[^a-z ]/g,"").replace(" ","_");
                newButtons.buttons[b] = {
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
            $("#m2d2-alert .m2d2-alert-front", newButtons);
        }
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
            title : title + " !",
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.failure = (title, text, callback) => {
        return $.message({
            icon : "error",
            title : title + " !",
            buttons : ["ok"],
            text : callback === undefined ? null : text,
            callback : callback === undefined ? text : callback
        });
    }
    $.confirm = (title, text, callback) => {
        return $.message({
            icon : "question",
            title : title + " ?",
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
