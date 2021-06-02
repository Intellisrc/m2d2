m2d2.load($ => {
    /*
     * M2D2 Storage Extension
     * @since 2021-06-02
     *
     * This extension provides:
     * $.local : To get/set values in localStorage
     * $.session : To get/set values in sessionStorage
     *
     * Description:
     * Wrapper for different kinds of storage. One advantage is that objects are stored with type instead of string.
     *
     * @author: Alberto Lepe
     * @since: Jul 9, 2010
     * @param method: local, session (which means:)
     *                localStorage, sessionStorage (default)
     * Methods:
     * set      : saves the information
     * get      : retrieve the info.
     * del      : remove data
     * clear    : remove all keys
     * exists   : check if key exists
     * log      : add in array (it will keep "n" number of items in queue)
     *
     * The way to use it is:
     *
     * $.local.set("mykey",myval);
     * console.log(local.get("mykey"));
     * console.log(local.exists("mykey")); // returns: true
     * $.local.del("mykey");
     * $.local.log("mylog", message, 10); // Keep only the last 10
     * $.local.clear(); // Remove all keys
     *
     * myval can be : string, number, object, array
     */
    function Storage(method) {
        switch(method) {
            case 'local'  : if(window.localStorage)     this.method = localStorage; break;
            case 'session': if(window.sessionStorage)   this.method = sessionStorage; break;
        }
        if(this.method == undefined) this.method = localStorage; //Default
        this.set = function(key, val) { if(typeof(val) == 'string') val = { '$' : val }; this.method.setItem(key, JSON.stringify(val)); }
        this.get = function(key) { let val = JSON.parse(this.method.getItem(key)) || {}; if(val["$"] != undefined) val = val["$"]; else if(Object.keys(val).length === 0 && val.constructor === Object) val = null; return val; }
        this.del = function(key) { this.method.removeItem(key); }
        this.clear = function() { this.method.clear(); }
        this.exists = function(key) { return this.method.hasOwnProperty(key); }
        this.log = function(key, val, n) {
            if(n == undefined) n = 10;
            const tmp = this.get(key) || [];
            tmp.push(val);
            while(tmp.length > n) tmp.shift();
            this.set(key,tmp);
        }
    }
    $.local = new Storage("local");
    $.session = new Storage("session");
});