QUnit.test('adding class', function (assert) {
  const q = $(root, { css : 'foo' });
  assert.ok(q.classList.contains('foo'));
})

QUnit.test('adding class using array', function (assert) {
  const q = $(root, { css : ['foo', 'boo'] });
  assert.ok(q.classList.contains('foo'));
  assert.ok(q.classList.contains('boo'));
})

QUnit.test('adding or removing classes using object', function (assert) {
  $(root, `
  <div id="main" class="one two three"></div>
  `);
   //-------
  const d = $("#main", {
    css :  {
        two  : false,
        four : true,
        five : true
    }
  });
  assert.equal(d.css.length, 4);
  assert.ok(! d.css.contains('two'));
  assert.ok(d.css.contains('four'));
  assert.ok(d.css.contains('five'));
})
