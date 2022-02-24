QUnit.test('Test selectors', function (assert) {
  $(root, `
  <div>
    <form id="f">
        <span class="label">Number: </span>
        <input type="number" name="num" value="3"/>
        <img id="i" src="" />
        <button>Save</button>
    </form>
  </div>
  `);
   //-------
   const f = $("#f", {
     label  : "NewNum",               //by class  : text
     num    : 100,                    //by name   : value
     i      : "http://example.com/",  //by id     : src
     button : "Send"                  //by tag    : text
   });
   assert.equal(f.label.text, "NewNum");
   assert.equal(f.num.value, 100);
   assert.equal(f.button.text, "Send");
   assert.equal(f.i.src, "http://example.com/");
});

QUnit.test("Automatic select property or child", assert => {
  $(root, `
  <div class="wrap">
    <h1 class="title">TITLE</h1>
    <a class="link">LINK</a>
    <input type="checkbox" name="check" />
  </div>
  `);
   //-------
    const r = $(root, {
        wrap : {
            title : { text : "Hello" },
            link : { href : "http://example.com/", title : "Click Me" },
            check : { disabled : true, checked : false }
        }
    });
    assert.equal(r.wrap.$title.tagName, "H1");
    assert.equal(r.wrap.$title.text, "Hello");
    assert.equal(r.wrap.link.href, "http://example.com/");
    assert.equal(r.wrap.link.title, "Click Me");
    assert.ok(! r.wrap.check.checked);
    assert.ok(r.wrap.check.disabled);
});
