(()=>{
  const TAB = "\t";
  const LF = "\n";
  const NBSP = String.fromCharCode(160);

  function dumpToken(t){
    return "ln=" + t.ln + ", type=" + t.type + ", s=" + esc(t.s);
  }

  function _parse(input){
    let ts = tokenize_v2("("+ input +")", "");
    let ret = parseBlock_v2(ts, 0, 1);
    return ret.block;
  }

  function _parse2(input){
    let ts = tokenize_v2("("+ input +")", "");
    let ret = parseBlock_v2(ts, 0, 1);
puts(12123, ret);
    let h = ret.block.toHtml();
    let $el = $(h);
    $el.find("button").remove();
puts(12123, $el, $el.text(), $el.html());
    // return ret.block;
    return $el.text().replace(new RegExp(NBSP, "g"), " ");
  }

  window.test = function(){

    QUnit.test( "Consume single comment", (assert)=>{
      let ret = consumeCommentSingle_v2("-- hoge\naa", 0);
      assert.equal( ret.len, 7 );
      assert.equal( ret.s, "-- hoge" );
    });

    QUnit.test( "Consume single comment 2", (assert)=>{
      let ret = consumeCommentSingle_v2("bb-- hoge\naa", 2);
      assert.equal( ret.len, 7 );
      assert.equal( ret.s, "-- hoge" );
    });

    QUnit.test( "Consume single comment 3", (assert)=>{
      let ret = consumeCommentSingle_v2("bb--\naa", 2);
      assert.equal( ret.len, 2 );
      assert.equal( ret.s, "--" );
    });

    QUnit.test( "Consume single comment 4", (assert)=>{
      let ret = consumeCommentSingle_v2("bb--aa", 2);
      assert.equal( ret.len, 4 );
      assert.equal( ret.s, "--aa" );
    });

    ////////////////////////////////

    QUnit.test( "tokenize 1", function( assert ) {
      let ts = tokenize_v2("", "");
      assert.equal( ts.length, 0 );
    });

    QUnit.test( "tokenize ln", function( assert ) {
      let ts = tokenize_v2("ab\ncd", "");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[1]), "ln=1, type=nl, s=\\n" );
      assert.equal( dumpToken(ts[2]), "ln=2, type=plain, s=cd" );
    });

    QUnit.test( "tokenize 3", function( assert ) {
      let ts = tokenize_v2("ab(cd", "");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[1]), "ln=1, type=paren, s=(" );
    });

    QUnit.test( "tokenize sym", function( assert ) {
      let ts = tokenize_v2("ab.cd", "");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[1]), "ln=1, type=sym, s=." );
    });

    QUnit.test( "tokenize string", function( assert ) {
      let ts = tokenize_v2("ab'cd'ef", "");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[1]), "ln=1, type=quote_s, s='cd'" );
    });

    QUnit.test( "tokenize > backquote", function( assert ) {
      let ts = tokenize_v2("ab`cd`ef", "");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[1]), "ln=1, type=quote_b, s=`cd`" );
    });

    QUnit.test( "tokenize comment single", function( assert ) {
      let ts = tokenize_v2("ab--cd\nef", "");
      assert.equal( ts.length, 4 );
      assert.equal( dumpToken(ts[1]), "ln=1, type=cmt_s, s=--cd" );
    });

    QUnit.test( "tokenize comment multi", function( assert ) {
      let ts = tokenize_v2("ab/*cd\nef*/gh", "");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[1]), "ln=1, type=cmt_m, s=/*cd\\nef*/" );
    });

    QUnit.test( "tokenize tgt", function( assert ) {
      let ts = tokenize_v2("ab t1", "");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[2]), "ln=1, type=plain, s=t1" );
    });
    QUnit.test( "tokenize tgt2", function( assert ) {
      let ts = tokenize_v2("ab t1", "t1");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[2]), "ln=1, type=hl_tgt, s=t1" );
    });
    QUnit.test( "tokenize tgt21", function( assert ) {
      let ts = tokenize_v2("t1 ab", "t1");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[0]), "ln=1, type=hl_tgt, s=t1" );
    });

    QUnit.test( "tokenize tgt3", function( assert ) {
      let ts = tokenize_v2("_t1", "t1");
      assert.equal( ts.length, 1 );
      assert.equal( dumpToken(ts[0]), "ln=1, type=plain, s=_t1" );
    });

    QUnit.test( "tokenize tgt32", function( assert ) {
      let ts = tokenize_v2("t1_", "t1");
      assert.equal( ts.length, 1 );
      assert.equal( dumpToken(ts[0]), "ln=1, type=plain, s=t1_" );
    });

    ////////////////////////////////

    QUnit.test( "tokenize 長い方からマッチ", function( assert ) {
      let ts = tokenize_v2("abc ab", "ab\nabc");
      assert.equal( ts.length, 3 );
      assert.equal( dumpToken(ts[0]), "ln=1, type=hl_tgt, s=abc" );
      assert.equal( dumpToken(ts[2]), "ln=1, type=hl_tgt, s=ab" );
    });

    ////////////////////////////////

    QUnit.test( "to text 1", function( assert ) {
      let block = _parse("ab");
      assert.equal( block.toText(), "ab" );
    });

    QUnit.test( "to text 2", function( assert ) {
      let block = _parse("ab(cd)ef");
      assert.equal(
        block.toText()
        ,   "ab(\n"
          + "  cd\n"
          + ")ef" );
    });

    QUnit.test( "to text 3", function( assert ) {
      let ret = _parse2("ab(cd(ef)gh)ij");
      assert.equal( ret, "ab(cd(ef)gh)ij" );
    });

    QUnit.test( "to text 4", function( assert ) {
      let ret = _parse2(
                 "ab("
          + LF + "cd)ef"
      );
      assert.equal(
        ret
        ,        "ab("
          + LF + "cd)ef" );
    });

    // QUnit.test( "to text 5 indent", function( assert ) {
    //   let block = _parse2(
    //         "ab(" + "\n"
    //       + "  cd" + "\n"
    //       + "    ef)gh"
    //   );
    //   assert.equal( block,
    //         "ab(" + ""
    //       + "cd" + ""
    //       + "  ef"+""
    //       + ")gh"
    //               );
    // });

    ////////////////////////////////

    QUnit.test( "No right paren > 1", function( assert ) {
      let ret = _parse2(
        "ab(cd"
      );
      assert.equal( ret, "ab(cd" );
    });

    ////////////////////////////////

    QUnit.test( "Convert tab", function( assert ) {
      let ret = _parse2(
               TAB + "ab"
        + LF + TAB + TAB + "cd"
      );
      assert.equal( ret, "ab" + LF + "    cd" );
    });

  }
})();
