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
        id : "",
        title: "DOM objects",
        description : "AAA",
        lessons : [
            'one'
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
                    nav.items.select(hashId);
                }
            }
            if(!sel) {
                sel = nav.items.first();
            }
        }
        example.items.clear();
        tutorial.forEach(item => {
            if(item.id == sel.dataset.id) {
                $("#lesson", item);
                example.items.push({
                    css : "code",
                    src : getCodeURL(item)
                });
                example.items.push({
                    css : "view",
                    src : getViewURL(item)
                });
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
    // Load page:
    showPage();
    $("#lessons", lessons).findAll('code').forEach(block => {
        block.classList.add("js");
        hljs.highlightElement(block);
    });
});