QUnit.test('items.concat and items.push do not work with strings', function (assert) {
  $(root, `
    <ul id="list"></ul>
  `);
   //-------
   const list = $("#list", {
        items : [],
        onload : function() {
            for(let x = 1; x <= 10; x++) {
                this.items.push("Link " + x)
            }
            assert.equal(this.items.length, 10);
            this.items.concat(["one", "two", "three", "four", "five"]);
            assert.equal(this.items.length, 15);
        }
   });
   //-------
   assert.equal(list.items.length, 15);
   assert.equal(list.items.first().link.text, "Link " + 1);
   assert.equal(list.items.last().link.text, "five");
});
