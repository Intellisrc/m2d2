/*
 * SELECT should create OPTION
 * UL should create LI
 * and so on..
 * https://gitlab.com/intellisrc/m2d2/-/issues/17
 */

QUnit.test('Choosing template automatically', function (assert) {
    $(root, `
        <form>
            <select></select>
            <datalist></datalist>
            <ul></ul>
            <ol></ol>
            <nav></nav>
            <dl></dl>
        </form>
    `);
    //------
    const form = $("form", {
        select : {
            items : ["one"]
        },
        datalist : {
            items : ["two"]
        },
        ul : {
            items : ["three"]
        },
        ol : {
            items : ["four"]
        },
        nav : {
            items : ["five"]
        },
        dl : {
            items : ["six"]
        }
    })
    assert.equal(form.select.items.first().tagName, "OPTION")
    assert.equal(form.datalist.items.first().tagName, "OPTION")
    assert.equal(form.ul.items.first().tagName, "LI")
    assert.equal(form.ol.items.first().tagName, "LI")
    assert.equal(form.nav.items.first().tagName, "A")
    assert.equal(form.dl.items.first().tagName, "DD")
})
