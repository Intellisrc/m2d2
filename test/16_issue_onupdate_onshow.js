/*
 * It should not duplicate content on update
 * https://gitlab.com/intellisrc/m2d2/-/issues/16
 */

QUnit.test('Do not duplicate on update', function (assert) {
    // NOTE: show property depends on viewport, in tests, its always hidden.
    let shown = false;
    const objs = $(root, {
        show : false,
        template : {
            div : {
                text : "",
                style : { color : "red" }
            }
        },
        items : ["only this item should be shown"],
        // This will also test the minimum functionality in 'onupdate'
        onupdate : function(ev) {
            console.log("Updated : " + JSON.stringify(ev));
            console.log("**** FIXME (16) ****");
            //FIXME: assert.equal(ev.property, "show");
        },
        onshow : function() {
            console.log("Shown");
            shown = true;
        }
    });
    assert.ok(!shown);
    objs.show = true;
    assert.ok(shown); shown = false;
    objs.show = false;
    assert.ok(!shown);
    objs.show = true;
    assert.ok(shown); shown = false;

    assert.equal(objs.items.length, 1);
    assert.equal(objs.items.first().style.color, "red");
    assert.equal(document.querySelectorAll(root + ' div').length, 1);
})
