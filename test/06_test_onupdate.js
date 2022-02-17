QUnit.test('Testing pushing changes', function (assert) {
  $(root, `
    <section id="user">
        <form>
            <input type="text" name="nickname" value="" />
        </form>
    </section>
    <section id="profile">
        <span class="nickname"></span>
    </section>
  `);
   //-------
   const profile = $("#profile", {
        nickname : ""
   });
   const user = $("#user", {
        nickname : {
            onchange : function(ev) {
                profile.nickname.text = this.value;
            }
        }
   });
   // change it
   user.nickname.value = "dummy";
   user.nickname.onchange(); // Required in this example
   //-------
   assert.equal(document.querySelector("#profile .nickname").text, "dummy");
});

QUnit.test('Testing pulling changes', function (assert) {
  $(root, `
    <section id="user">
        <form>
            <input type="text" name="nickname" value="" />
        </form>
    </section>
    <section id="profile">
        <span class="nickname"></span>
    </section>
  `);
   //-------
   const user = $("#user", {
        nickname : "",
        onupdate : (ev) => {
            if(ev.detail.property === "value") {
                console.log("Prop: " + ev.detail.property + "; New: " + ev.detail.newValue);
                assert.equal(ev.detail.newValue, "dummy");
            }
        }
   });
   const profile = $("#profile", {
        nickname : [user.nickname, "value"]
   });
   // change it
   user.nickname.value = "dummy";
   //-------
   assert.equal(document.querySelector("#profile .nickname").text, "dummy");
});
