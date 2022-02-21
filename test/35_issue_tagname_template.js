
QUnit.test('NOT Using tagName as template tag is not working', function (assert) {
    // This test is to be sure that the "usual" way works as expected
    $(root, `
        <div id="list"></div>
    `);
    //------
    const list = $("#list", {
        template : {
            span : {
                name : {
                    tagName : "a",
                    css : "name"
                }
            }
        }
    });

    list.items.push({
        name : "test"
    });

    assert.equal(list.items.length, 1)
    assert.equal(list.items.first().name.text, "test")
})

QUnit.test('Using tagName as template tag is not working', function (assert) {
    $(root, `
        <div id="list"></div>
    `);
    //------
    const list = $("#list", {
        template : {
            child : {
                tagName : "span", // <---- This doesn't work
                name : {
                    tagName : "a",   // <---- This works
                    css : "name"
                }
            }
        }
    });

    list.items.push({
        name : "test"
    });

    assert.equal(list.items.length, 1)
    assert.equal(list.items.first().name.text, "test")
})
