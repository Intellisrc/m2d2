QUnit.test('Items test', function (assert) {
  $(root, `
    <ul id="list"></ul>
  `);
   //-------
   const list = $("#list", {
        template : {
            li : {
                link : {
                    tagName : "a"
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
   assert.equal(list.items.first().link.text, "Link " + 1)
   assert.equal(list.items.last().link.text, "Link " + 100)
   assert.equal(list.items.first().index(), 0)
   assert.equal(list.items.last().index(), 99)
   //---- No selection test:
   assert.equal(list.items.selected(), null);
});

QUnit.test('Items test with selected', function (assert) {
  $(root, `
    <ul id="list"></ul>
  `);
   //-------
   const list = $("#list", {
        template : {
            li : {
                onclick : function(ev) {
                    this.selected = true;
                    this.text = "clicked";
                }
            }
        },
        onload : function() {
            for(let x = 1; x <= 10; x++) {
                this.items.push({
                    text : "Link " + x
                })
            }
        }
   });
   //-------
   assert.equal(list.items.length, 10);
   list.items.get(5).click();
   assert.equal(list.items.get(5).text, "clicked");

   assert.equal(list.items.selected().text, "clicked");
   assert.equal(list.items.selected().index(), 5);
   assert.equal(list.items.selected().dataset.id, 5);
   assert.equal(list.items.selected().prev().index(), 4);
   assert.equal(list.items.selected().next().index(), 6);

   list.items.selected().next().selected = true;
   assert.equal(list.items.selected().index(), 6)
   list.items.selected().prev().selected = true;
   assert.equal(list.items.selected().index(), 5)
});
