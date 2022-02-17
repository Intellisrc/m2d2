/*
 * Create same tag using "tagName" property should display 2 divs
 * https://gitlab.com/intellisrc/m2d2/-/issues/15
 */

QUnit.test('Using tagName', function (assert) {
    const parts = $(root, {
        user : {
            tagName : "div",
            className : "blue",
            text : "DIV 1: User 1"
        },
        info : {
            tagName : "div",
            className : "red",
            text : "DIV 2: User 2"
        },
        // This will also be sure that 'onload' its not fired more than once
        onload : function() {
            assert.equal(this.info.text, "DIV 2: User 2");
            // Update text:
            this.info.text = "Updated";
            console.log("Loaded");
        }
    });
    assert.ok(parts.user);
    assert.ok(parts.info);
    assert.equal(parts.info.text, "Updated");
})
