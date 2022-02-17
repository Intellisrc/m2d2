/*
 * Mixing object and items should not duplicate items in list:
 * https://gitlab.com/intellisrc/m2d2/-/issues/13
 */

QUnit.test('Using lists inside object', function (assert) {
    $(root, `
        <div id="user">
            <div class="name"></div>
            <div class="phone"></div>
            <div class="age"></div>
            <ul class="hobbies"></ul>
        </div>
    `);
    const done = assert.async();
    const user = $("#user", {
      name  : "Billy",
      phone : "123-456-789",
      age   : 34,
      hobbies : [ "Sports", "Reading" ],
      onready : function () {
          user.age = 45;
          assert.equal(user.age.text, 45);
          assert.equal(user.hobbies.items.length, 2);
          assert.equal(document.querySelectorAll("ul li").length, 2);
          console.log("Ready called");
          done();
      }
    });
    assert.equal(user.name.text, "Billy");
    assert.equal(user.phone.text, "123-456-789");
    assert.equal(user.age.text, 34);
    assert.equal(user.hobbies.items.length, 2);
})
