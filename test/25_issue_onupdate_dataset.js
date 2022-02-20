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
   const user = $("#user", {
        dataset : {
            id : 1000
        },
        onupdate : (ev) => {
            if(ev.detail.property === "value") {
                console.log("Prop: " + ev.detail.property + "; New: " + ev.detail.newValue);
                assert.equal(ev.detail.newValue, "dummy");
            }
        }
   });
   const profile = $("#profile", {
        user_id : [user.dataset, "id"]
   });
   // change it
   user.dataset.id = 2000;
   //-------
   assert.equal(document.querySelector("#profile .user_id").text, "2000");
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
