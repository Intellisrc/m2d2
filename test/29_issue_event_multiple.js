QUnit.test('event in multiple tags', function (assert) {
   $(root, `
  <div class="a">Text 1</div>
  <div class="b">Text 2</div>
  <div class="c">Text 3</div>
  <div class="d">Text 4</div>
  `);
    //-------
    let clicked = 0
    const r = $(root, {
        div : {
            warn : false,
            onclick : function () {
                clicked ++
            }
        }
    })
    r.find(".a").click();
    assert.equal(clicked, 1);
    r.find(".b").click();
    assert.equal(clicked, 2);
    r.find(".c").click();
    assert.equal(clicked, 3);
    r.find(".d").click();
    assert.equal(clicked, 4);
})
