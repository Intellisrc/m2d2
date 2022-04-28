QUnit.test('append / prepend of m2d2 object produces [object]', function (assert) {
    const body = $(root, `
        <span id='src'>Source</span>
        <div id='tgt'></div>
    `);
    //--------------
    const src = $("#src");
    const tgt = $("#tgt");
    tgt.append(src);
    //--------------
    const span = tgt.find("span");
    assert.ok(span);
    assert.equal(span.text, "Source");
});
