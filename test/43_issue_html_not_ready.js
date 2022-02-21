QUnit.test('DOM is not ready when using HTML in object', function (assert) {
    assert.expect(2);
    assert.timeout(1000);
    const done = assert.async();
    // Example, getting HTML from server, set in page, assign values:
    const html = "<form><input type='text' name='some' value='1000' /><button>Send</button></form>";
    let buttonClicked = false;
    const r = $(root, {
        html : html,
        button : {
            css : "active",
            onclick : function() {
                buttonClicked = true;
                return false;
            }
        },
        onready : function() {
            this.button.click();
            assert.ok(buttonClicked);
            done();
        }
    });
    assert.equal(document.querySelector("button.active").text, "Send");
});
