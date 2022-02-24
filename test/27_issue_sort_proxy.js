/*
 * Clicking several times on table headers (to sort),
 * should not slow down over time (due to Proxy object creation).
 * https://gitlab.com/intellisrc/m2d2/-/issues/27
 */

QUnit.test('Sorting a list should not increase Proxy objects', function (assert) {
    $(root, `
        <h3>Fruit Inventory:</h3>
        <table id="list">
            <thead class="headers">
                <tr>
                    <th class="fruit">Fruit</th>
                    <th class="qty">Qty</th>
                </tr>
            </thead>
            <tbody class="data">
                <template>
                    <tr>
                        <td class="fruit"></td>
                        <td class="qty"></td>
                    </tr>
                </template>
            </tbody>
        </table>
    `);
    //------
    let startTime, endTime;
    let printTable = true;
    let ms = 0;

    function start() {
      startTime = new Date();
    };
    function end() {
      endTime = new Date();
      return endTime - startTime;
    }
    function sortTable(ev) {
        const th    = ev.target;
        const label = th.text;
        const prop  = th.classList[0];
        const compare = ( a, b ) => {
            return a[prop].text < b[prop].text ? -1 : (a[prop].text > b[prop].text ? 1 : 0)
        }
        if(list.dataset.sortedBy === label) {
            list.data.items.reverse();
        } else {
            list.dataset.sortedBy = label;
            list.data.items.sort(compare);
        }
        //--- show table ---
        if(printTable) {
            let out = [];
            list.data.items.forEach(item => {
                out.push(item.fruit.text.padEnd(10, " ") + " : " + item.qty.text);
            });
            console.log("------------\n" + out.join("\n") + "\n------------");
        }
    }
    //-------
    const list = $("#list", {
        dataset: { sortedBy: "" },
        headers : {
            fruit : { onclick : sortTable },
            qty   : { onclick : sortTable }
        },
        data : {
            items: [
                { fruit : "Apple",      qty: 19, onclick: function() { console.log("I have an apple") }},
                { fruit : "Orange",     qty: 34 },
                { fruit : "Banana",     qty: 62 },
                { fruit : "Peach",      qty: 15 },
                { fruit : "Mango",      qty: 18 },
                { fruit : "Watermelon", qty: 30 },
                { fruit : "Papaya",     qty: 14 },
                { fruit : "Pear",       qty: 22 },
                { fruit : "Strawberry", qty: 45 }
            ]
        }
    });
    //TODO: measure time
    assert.equal(list.data.items.length, 9);

    start();
    list.headers.fruit.click();
    ms = end();
    console.log("Executed in: " + ms + "ms");
    assert.equal(list.data.items.first().fruit.text, "Apple");
    assert.equal(list.data.items.last().fruit.text, "Watermelon");

    start();
    list.headers.fruit.click();
    ms = end();
    console.log("Executed in: " + ms + "ms");
    assert.equal(list.data.items.first().fruit.text, "Watermelon");
    assert.equal(list.data.items.last().fruit.text, "Apple");

    start();
    list.headers.qty.click();
    ms = end();
    console.log("Executed in: " + ms + "ms");
    assert.equal(list.data.items.first().fruit.text, "Papaya");
    assert.equal(list.data.items.last().fruit.text, "Banana");

    // Let's click many times...
    printTable = false;
    console.log("Clicked 1000 times");
    for(let i = 0; i < 1000; i++) {
        list.headers.qty.click();
    }
    printTable = true;

    start();
    list.headers.qty.click();
    const newms = end();
    console.log("Executed in: " + newms + "ms");
    assert.equal(list.data.items.first().fruit.text, "Banana");
    assert.equal(list.data.items.last().fruit.text, "Papaya");
    assert.ok(Math.abs(newms - ms) < 5);
});
