QUnit.test('adding class', function (assert) {
  const q = $(root, { css : 'foo' });
  assert.ok(q.classList.contains('foo'));
})

QUnit.test('adding class using array', function (assert) {
  const q = $(root, { css : ['foo', 'boo'] });
  assert.ok(q.classList.contains('foo'));
  assert.ok(q.classList.contains('boo'));
})
