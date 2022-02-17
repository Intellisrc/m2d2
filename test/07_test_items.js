QUnit.test('Items test', function (assert) {
  $(root, `
    <ul id="list"></ul>
  `);
   //-------
   const list = $("#list", {
        template : {
            li : {
                link : {
                    tagName : "a",
                    onclick : function(ev) {
                        this.text = "clicked";
                    }
                }
            }
        },
        onload : function() {
            for(let x = 1; x <= 100; x++) {
                this.items.push({
                    link : "Link " + x
                })
            }
        }
   });
   //-------
   assert.equal(list.items.length, 100);
   list.items.get(10).link.click();
   assert.equal(list.items.first().link.text, "Link " + 1)
   assert.equal(list.items.last().link.text, "Link " + 100)
   assert.equal(list.items.get(10).link.text, "clicked");
});
