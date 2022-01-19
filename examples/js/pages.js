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
        buttons.find(".prev").dataset.id = "";
        buttons.find(".prev").disabled = true;
        buttons.find(".next").disabled = true;
        pages.forEach(item => {
            if(item.id === sel.dataset.id) {
                $("#lesson", {
                    title: item.title,
                    description: item.description
                });
                example.items.push({
                    css : "code",
                    src : getCodeURL(item)
                });
                example.items.push({
                    css : "view",
                    src : getViewURL(item)
                });
                lessons.update(item.lessons);
                sel.selected = true;
                found = true;
            } else {
                if(found) {
                    buttons.find(".next").dataset.id = item.id;
                    buttons.find(".next").disabled = false;
                    buttons.find(".next").text = item.title;
                } else {
                    buttons.find(".prev").dataset.id = item.id;
                    buttons.find(".prev").disabled = false;
                    buttons.find(".prev").text = item.title;
                }
            }
        });
        lessons.findAll('code').forEach(block => {
            block.classList.add("js");
            hljs.highlightElement(block);
        });
    }

    // Add links
    // Declare lessons list:
    const lessons = $("#lessons", {
        items : [],
        update : function(items) {
            this.items.clear();
            this.items.concat(items);
        }
    });

    // Render links:
    const nav = $("#nav", {
        template : {
            li : {
                a : {},
                onclick : function() {
                    this.selected = true;
                    showPage();
                }
            }
        },
        onload : function() {
            pages.forEach(item => {
                this.items.push({
                    dataset : { id : item.id },
                    a : {
                        text : item.title,
                        href : "#" + item.id,
                    },
                });
            });
        }
    });

    // Declare example template:
    const example = $("#example", {
        template : {
            script : {
                async : true
            }
        }
    });

    // Buttons PREV and NEXT:
    const buttons = $("#buttons", {
        button : {  // Same for both buttons
            warn : false, // Do not warn
            onclick : function() {
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
});