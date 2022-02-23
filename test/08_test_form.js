QUnit.test('Form test', function (assert) {
  $(root, `
    <form id="form">
        <input type="checkbox" name="active" value="1" />
    </form>
  `);
   //-------
    const form = $("#form", {
        active: {
            checked: true
        }
    });
    assert.equal(form.active.checked , true)
});
