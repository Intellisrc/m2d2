/**
 * Author : A.Lepe (dev@alepe.com) - intellisrc.com
 * License: MIT
 * Version: 2.1.2
 * Updated: 2022-03-07
 * Content: Extension (Debug)
 */

m2d2.load($ => {
    /*
     * M2D2 Storage Extension
     * @author: A. Lepe
     * @since 2021-06-02
     *
     * Wrapper for different kinds of storage.
     * One advantage is that objects are stored with type instead of string.
     *
     * This extension provides:
     * $.local : To get/set values in localStorage
     * $.session : To get/set values in sessionStorage
     *
     * Documentation:
     * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/storage.md
     * https://github.com/intellisrc/m2d2/tree/master/documentation/storage.md
     *
     */
    function Storage(type) {
        switch(type) {
            case 'local'  : if(window.localStorage)     this.store = localStorage; break;
            case 'session': if(window.sessionStorage)   this.store = sessionStorage; break;
        }
        if(this.store == undefined) this.store = localStorage; //Default
        this.set = function(key, val) {
            if(typeof(val) === 'string') {
                val = { '$' : val };
            }
            this.store.setItem(key, JSON.stringify(val));
        }
        this.get = function(key) {
            let val;
            try {
                val = JSON.parse(this.store.getItem(key)) || {};
            } catch(ignore) {
                val = this.store.getItem(key);
            }
            if(val["$"] !== undefined) {
                val = val["$"];
            } else if(Object.keys(val).length === 0 && val.constructor === Object) {
                val = null;
            }
            return val;
        }
        this.del = function(key) { this.store.removeItem(key); }
        this.keys = function() { return Object.keys(this.store).sort(); }
        this.clear = function() { this.store.clear(); }
        this.exists = function(key) { return this.store.hasOwnProperty(key); }
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