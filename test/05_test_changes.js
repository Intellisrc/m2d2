QUnit.test('Text should respect inner children', function (assert) {
  $(root, `
  <div class="d"><i></i>Text</div>
  `);
   //-------
   const r = $(root, {
        d : "Done"
   });
   assert.equal(r.d.text, "Done");
   assert.equal(r.findAll("i").length, 1);
});
