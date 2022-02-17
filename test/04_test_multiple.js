QUnit.test('Test multiple matches', function (assert) {
  $(root, `
  <div>
    <form id="f">
        <input type="number" name="num" value="3"/>
        <input type="text" name="name" value="Lucas"/>
        <input type="password" name="pass" value=""/>
    </form>
  </div>
  `);
   //-------
   const f = $("#f", {
    input : {
        warn : false, //without expect log
        value : "1000"
    }
   });
   ["num", "name", "pass"].forEach(name => {
        const v = f.find("[name="+name+"]").value;
        console.log(name + ":" + v);
        assert.equal(v, "1000");
   });
});
