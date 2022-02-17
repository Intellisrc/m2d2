/*
 * Updating non-existent properties should work.
 * This should disappear and appear again
 * https://gitlab.com/intellisrc/m2d2/-/issues/24
 */

QUnit.test('Adding properties on the fly', function (assert) {
    $(root, `
        <div id="user">
            <div class="name"></div>
            <div class="phone"></div>
            <div class="age"></div>
        </div>
    `);
    //------
    const user = $(root, {
        name  : "Billy",
        phone : "123-456-789",
        age   : {
            style : { color : "blue" }
        }
    });
    // We didn't specified 'text' above, but we can use it:
    user.age.text = 45;
    assert.equal(document.querySelector(".age").textContent, 45);
})
