QUnit.test('onupdate on dataset (not nodes)', function (assert) {
  $(root, `
    <section id="user">
        <form>
            <input type="text" name="nickname" value="" />
        </form>
    </section>
    <section id="profile">
        <span class="user_id"></span>
    </section>
  `);
   //-------
   const done = assert.async()
   const user = $("#user", {
        dataset : {
            id : 1000
        }
   });
   const profile = $("#profile", {
       title : [user.dataset, "id"],
       user_id : { text : [user.dataset, "id"] },
       onready : function () {
           //-------
           assert.equal(profile.title, "2000");
           assert.equal(profile.user_id.text, "2000");
           assert.equal(document.querySelector("#profile .user_id").text, "2000");
           done();
       }
   });

   // change it
   user.dataset.id = 2000;
})

QUnit.test('onupdate on style (not nodes)', function (assert) {
    $(root, `
    <section id="user">
        <form>
            <input type="text" name="nickname" value="" />
        </form>
    </section>
    <section id="profile">
        <span class="color"></span>
    </section>
  `);
    //-------
    const done = assert.async()
    const user = $("#user", {
        style : {
            color: "red"
        }
    });
    const profile = $("#profile", {
        color : {
            text : [user.style, "color"]
        },
        onready : function () {
            assert.equal(document.querySelector("#profile .color").text, "blue");
            done();
        }
    });
    // change it
    user.style.color = "blue"
    //-------
})

QUnit.test('onupdate on plain objects', function (assert) {
  $(root, `
    <section id="profile">
        <span class="user_id"></span>
    </section>
  `);
   //-------
   // When no selector is used, it will create an HTML Fragment
   const user = $({
      id    : 200,
      name  : "Mary"
   });
   assert.ok($.isNode(user));
   assert.ok(! $.isElement(user));

   const profile = $("#profile", {
        user_id : [user, "id"]
   });
   // change it
   user.id = 2000;
   //-------
   assert.equal(document.querySelector("#profile .user_id").text, "2000");
})
