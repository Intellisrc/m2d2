const tutorial = [
      {
        id : "v3pr6twe",
        title: "How to start...",
        description: "In this example we will learn how to start using M2D2 with " +
                     "a simple user profile. We 'fill' the fields using a javascript " +
                     "plain object.",
        lessons : [
            'We start by using the function: <code>m2d2.ready()</code> which executes your instructions when the page (DOM) is ready.',
            'The dollar sign in the callback function: <code>m2d2.ready($ => { $("#profile"); })</code> is the suggested symbol for M2D2 (and the one used across all examples and documentation). You can use anything you want, for example: <code>m2d2.ready(m => { m("#profile"); })</code>',
            'Usually you want to use an ID as selector: <code>$("#profile")</code>, but you can use any supported selector, for example: <code>$("body section div:first-child")</code> Although I do not recommend it because your code will perform better and it will be easier to understand if you stick to IDs (more about this later in this tutorial).',
            'You do not need to specify all parents to find an element, for example, instead of: <code>$("#profile", { details : { age : 80 })</code> can be set in a more direct way: <code>$("#profile", { age : 80 });</code>',
        ]
      },
      {
        id : "4o5c83yn",
        title: "DOM objects",
        description : "All objects returned by m2d2 are DOM objects with extra features.",
        lessons : [
            'The value returned by the function: <code>$("#sample")</code> is indeed a DOM element (or Node) which has all standard Javascript properties and functions (like `appendChild`, `classList`, etc). Additionally it has <a href="dom_extend.html">some functions</a> that are useful to keep our code simple.'
        ]
      }
];
m2d2.ready($ => {
    const baseUrl = "//jsfiddle.net/alepe/";
    const codeSuffix = "/embed/js,html,css/dark/";
    const viewSuffix = "/embed/result/dark/";
    function getCodeURL(item) {
        return baseUrl + item.id + codeSuffix;
    }
    function getViewURL(item) {
        return baseUrl + item.id + viewSuffix;
    }
    function showPage() {
        let sel = nav.items.selected();
        if(! sel) {
            const hashId = window.location.hash.replace("#","");
            if(hashId) {
                sel = nav.items.get(hashId);
                if(sel) {
                    sel.selected = true;
                }
            }
            if(!sel) {
                sel = nav.items.first();
            }
        }
        example.items.clear();
        let found = false;
        buttons.prev.dataset.id = "";
        buttons.prev.disabled = true;
        buttons.next.disabled = true;
        tutorial.forEach(item => {
            if(item.id == sel.dataset.id) {
                const copy = Object.assign({}, item);
                delete copy.id; // Remove ID
                $("#lesson", copy);
                example.items.push({
                    css : "code",
                    src : getCodeURL(item)
                });
                example.items.push({
                    css : "view",
                    src : getViewURL(item)
                });
                sel.selected = true;
                found = true;
            } else {
                if(found) {
                    buttons.next.dataset.id = item.id;
                    buttons.next.disabled = false;
                    buttons.next.text = item.title;
                    return;
                } else {
                    buttons.prev.dataset.id = item.id;
                    buttons.prev.disabled = false;
                    buttons.prev.text = item.title;
                }
            }
        });
    }
    const links = [];
    const lessons = [];
    tutorial.forEach(item => {
        links.push({
            dataset : { id : item.id },
            a : {
                text : item.title,
                href : "#" + item.id,
            },
            onclick : function(ev) {
                this.selected = true;
                showPage();
            }
        });
    });
    $(nav, {
        template : { li : { a : {} }},
        items : links
    });
    $(example, {
        template : {
            script : {
                async : true
            }
        },
        items : [
        ]
    });
    const buttons = $("#buttons", {
        prev : {
            onclick : function(ev) {
                if(this.dataset.id) {
                    window.location.hash = "#" + this.dataset.id;
                    nav.items.get(this.dataset.id).selected = true;
                    showPage();
                }
                return false;
            }
        },
        next : {
            onclick : function(ev) {
                if(this.dataset.id) {
                    window.location.hash = "#" + this.dataset.id;
                    nav.items.get(this.dataset.id).selected = true;
                    showPage();
                }
                return false;
            }
        }
    });
    // Load page:
    showPage();
    $("#lessons", lessons).findAll('code').forEach(block => {
        block.classList.add("js");
        hljs.highlightElement(block);
    });
});