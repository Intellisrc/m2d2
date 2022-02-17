QUnit.test('test M2D2 object', assert => {
    assert.ok($.isFunction($));
    //console.log($);
});

QUnit.test('set innerHTML', function (assert) {
  const q = $(root, { text : 'foo' });
  assert.ok($.isNode(q));
  assert.ok($.isElement(q));
  assert.equal(q.text, 'foo');
  assert.equal(document.getElementById(id).textContent, 'foo')
})

QUnit.test('verify that innerHTML is reset', function (assert) {
  assert.equal($(root).text, '')
})

QUnit.test('verify change content', function (assert) {
  const q = $(root, { text : 'foo' });
  assert.equal(q.text, 'foo');
  q.text = 'boo';
  assert.equal(q.text, 'boo');
})
