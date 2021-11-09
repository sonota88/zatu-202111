let __DEBUG__ = false;

const SQL_KEYWORDS = [
    "into", "values"
    , "where", "in", "exists", "like"
    ,"left", "outer", "inner", "on"
    , "group" ,"order", "by", "asc", "desc"
    , "and", "or", "not"
    , "if", "case", "when", "then", "else", "end"
    , "with", "as"
    , "limit", "offset"
    , "union", "having"
    , "is", "null"
];
const SQL_KEYWORDS_2 = [
  "from", "join"
];
const SQL_KEYWORDS_3 = [
  "select", "insert", "create", "delete",
  "truncate", "drop", "alter", "update"
];

let prevSelected = null;

////////////////////////////////

function puts(){
  if (__DEBUG__) {
    console.log.apply(console, arguments);
  }
}

function last(xs){
  return xs[xs.length - 1];
}

function mkStr(s, n){
  let ss = [];

  for(let i=0; i<n; i++){
    ss.push(s);
  }

  return ss.join("");
}

function indent(text, n){
  if(n === 0){
    return text;
  }
  let head = mkStr(" ", n);
  let lines = text.split("\n");
  return lines.map(line => head + line ).join("\n");
}

function textEl(text){
  return document.createTextNode(text);
}

////////////////////////////////

class Node {}

// TODO Name の方が良い？
class Plain extends Node{
  constructor(t){
    super();
    this.s = t.s;
    this.ln = t.ln;
    this.hl = t.hl;
  }

  toText(){
    return this.s;
  }

  toHtml(){
    if(this.hl){
      let cl = "matched_" + this.hl;
      return `<span class="matched ${cl}">${this.toText()}</span>`;
    }else{
      return textEl(this.toText());
    }
  }

  toEl(){
    let cl = "matched_" + this.hl;

    return TreeBuilder.build(h =>
      (this.hl)
      ? h("span.matched.matched_" + this.hl, {}
        , this.toText()
        )
      : this.toText()
    );
  }
}

class Space extends Node{
  constructor(t){
    super();
    this.s = t.s;
    this.ln = t.ln;
  }

  toText(){
    return this.s;
  }

  toHtml(){
    // return this.toText().replace(/ /g, '&nbsp;');
    return this.toText();
  }

  toEl(){
    return textEl(this.toText());
  }
}

class Newline extends Node{
  constructor(t){
    super();
    this.s = t.s;
    this.ln = t.ln;
  }

  toText(){
    return this.s;
  }

  toHtml(){
    // return span('¶', 'nl') + '<br />' + "\n";
    // return '<br />' + "\n";
    return "\n";
  }

  toEl(){
    return textEl("\n");
  }
}

class Comment extends Node{
  constructor(t){
    super();
    this.s = t.s;
  }

  toText(){
    return this.s;
  }

  toHtml(){
    let s = this.s
        // .replace(/ /g, '&nbsp;')
        // .replace(/\n/g, '<br />')
    ;
    return span(s, 'comment');
  }

  toEl(){
    return TreeBuilder.build(h =>
      h("span.comment", {}, this.s)
    );
  }
}

class Quote extends Node{
  constructor(t){
    super();
    this.s = t.s;
  }

  toText(){
    return this.s;
  }

  toHtml(){
    let s = this.s
        // .replace(/ /g, '&nbsp;')
        // .replace(/\n/g, '<br />')
    ;
    return span(s, 'quote');
  }

  toEl(){
    return TreeBuilder.build(h =>
      h("span.quote", {}, this.s)
    );
  }
}

class Symbol extends Node{
  constructor(t){
    super();
    this.s = t.s;
  }

  toText(){
    return this.s;
  }

  toHtml(){
    let s = this.s
        .replace(/</g, '&lt;')
    ;
    return span(s, 'symbol');
  }

  toEl(){
    return TreeBuilder.build(h =>
      h("span.symbol", {}, this.s)
    );
  }
}

class Block_v2 extends Node{
  static getId(){
    if( Block_v2._maxId == null ){
      Block_v2.resetId();
    }
    Block_v2._maxId++;
    return Block_v2._maxId;
  }
  static resetId(){
    Block_v2._maxId = 0;
  }

  constructor(nodes, depth, id){
    super();
    this.nodes = nodes; // :Node
    this.depth = depth; // :int
    this.id = id; // :int
  }

  toText(){
    let inner = this.getInnerNodes();
    let hs = [];
    let oldln = 1;
    inner.forEach(node =>{
      if( typeEq(node, 'Block_v2') ){
        hs.push('(\n');
        hs.push(node.toText());
        hs.push("\n)");
      }else{
        hs.push(node.toText());
      }
      oldln = node.ln;
    });
    return indent(hs.join(""), this.depth * 2);
  }

  toHtml(){
    let h = '';
    if(this.depth >= 1){
      h += span('(', 'paren');
    }

    let cn = 'block';
    cn += ' block_' + this.depth;
    if(this.isMultiLine()){ cn += ' block_multi'; }
    h += `<div class="${cn}" id="block_${this.id}" title="${this.id}">`;
    if(this.depth > 0 && this.isMultiLine()){
      h += '<div class="button_outer">';
      h += '<button class="fold">-</button>';
      h += '</div>';
    }
    h += '<span class="block_content">';

    let innerNodes = this.getInnerNodes();
    h += innerNodes.map(node => node.toHtml() ).join('');

    h += '</span>';
    h += '</div>';
    if(this.depth >= 1 && this.hasCloseParen()){
      h += span(')', 'paren');
    }
    return h;
  }

  toEl(){
    let cn = '.block';
    cn += '.block_' + this.depth;
    if(this.isMultiLine()){ cn += '.block_multi'; }

    return TreeBuilder.build(h =>
      h("span", {
                  // style: { border: "solid 1px red" }
                }
      , (this.depth >= 1)
        ? h("span.paren", {}, '(')
        : null
      , h("div#block_" + this.id + cn, {}
        , (this.depth > 0 && this.isMultiLine())
          ? h("div.button_outer", {}
            , h("button.fold", {}, "-")
            )
          : null
        , h("span.block_content", {}
          , this.getInnerNodes().map(node => node.toEl() )
          )
        )
      , (this.depth >= 1 && this.hasCloseParen())
        ? h("span.paren", {}, ')')
        : null
      )
    );
  }

  getInnerNodes(){
    let i;
    if(this.hasCloseParen()){
      i = this.nodes.length - 1;
    }else{
      i = this.nodes.length;
    }
    return this.nodes.slice(1, i);
  }

  isMultiLine(){
    let tf = this.nodes[0];
    let tl = this.nodes[this.nodes.length - 1];
    return tf.ln < tl.ln;
  }

  hasCloseParen(){
    return last(this.nodes).s === ')';
  }
}

////////////////////////////////

function getInput(){
  return $("#input").val();
}

function showPreview_v1(html){
  $("#preview_0").html(html);
}

function showPreview_v2(el){
  const $outer = $("#preview_0");
  $outer.empty();
  el.childNodes.forEach(cn => $outer.append(cn) );
}

function procInnerXs(xs, fn){
  const xa = xs[0];
  const xz = last(xs);
  const inner = xs.slice(1, xs.length - 1);

  return [].concat(
    [xa], fn(inner), [xz]
  );
}

function rejectSideBlankLines(_xs){
  return procInnerXs(_xs, (xs)=>{
    // 最初の非空白文字
    let i1 = 0;
    let nli = -1;
    for(let i=0; i<xs.length - 1; i++){
      let x = xs[i];
      // puts(225, x);
      if( x.s === "\n" ){
        nli = i;
      }else if( ! (x.s === "\n" || /^[\t ]*$/.test(x.s)) ){
        // i1 = i;
        i1 = nli + 1;
        break;
      }
    }

    // 最後の非空白文字
    let i2 = xs.length - 1;
    for(let i=xs.length - 1; i>=0; i--){
      let x = xs[i];
      // puts(237, x);
      if( ! (x.s === "\n" || /^[\t ]*$/.test(x.s)) ){
        i2 = i;
        break;
      }
    }

    // puts(227, i1, i2);
    let xs2 = [];
    xs.forEach((x, i)=>{
      if(i1 <= i && i <= i2){
        // 前後の空白行を除外した残り
        xs2.push(x);
      }
    });
    return xs2;
  });
}

function esc(s){
  return s.replace(/\n/g, "\\n");
}

function toLines(nodes){
  if(nodes.length === 0){
    return [];
  }

  const lines = [];
  let i = 0;
  let buf = [];
  let oldln = nodes[0].ln;
  while(i < nodes.length){
    let n = nodes[i];
    if(n.ln > oldln){
      if(buf.length > 0){ lines.push(buf); }
      buf = [n];
    }else{
      buf.push(n);
    }
    oldln = n.ln;
    i++;
  }
  if(buf.length > 0){ lines.push(buf); }

  return lines;
}

function typeEq(v, typeName){
  return v.constructor.name === typeName;
}

function getMin(lines){
  // string に変換
  const slines = lines.map(line => {
    return line.map(n => {
      if( typeEq(n, 'Block_v2') ){
        return 'BLOCK'; // ダミー文字列
      }else{
        return n.s.replace("\n", '');
      }
    }).join('');
  });
  // puts(300, lines, slines);

  // 空行 を除外
  const slines2 = slines.filter(sline => {
    return ! /^[ \t]*$/.test(sline);
  });
  // puts("---- dedent3");
  // slines2.forEach((line)=>{ puts(line); });
  // puts("<<---- dedent3");

  const lens = slines2.map((line)=>{
    line.match(/^( *)/);
    return RegExp.$1.length;
  });
  return Math.min.apply(null, lens);
}

function dedent(nodes){
  // puts("---- dedent1");
  // nodes.forEach((n)=>{ puts("--", n); });
  // puts("<<---- dedent1");

  let na = nodes[0];
  let nz = null;
  let inner;
  if( last(nodes).s === ')' ){
    nz = last(nodes);
    inner = nodes.slice(1, nodes.length - 1);
  }else{
    inner = nodes.slice(1, nodes.length);
  }

  // puts("---- dedent2");
  // inner.forEach((n)=>{ puts("--", n); });
  // puts("<<---- dedent2");

  const lines = toLines(inner);

  const min = getMin(lines);
  // puts(322, lens, min);
  // puts("326 ----");

  lines.forEach(line =>{
    // puts(335, line);
    if(typeEq(line[0], 'Space')){
      // plain
      line[0].s.match(/^( *)/);
      const splen = RegExp.$1.length;
      // puts(350, line[0], splen);
      if(splen >= min){
        line[0].s = line[0].s.substring(min);
      }
    }else{
      // other
      ;
    }
  });
  // puts("326 <<----");

  return nodes;
}

function parseBlock_v2(ts, depth){
  puts("---->> parseBlock " + depth);
  const nodes = [];
  let pos = 0;

  // 開き括弧は必ず存在する
  nodes.push(new Plain(ts[0]));
  pos++;

  const hasCloseParen = ( last(ts).s === ')' );

  let size;
  let posDelta;

  while(pos < ts.length){
    const t = ts[pos];
    posDelta = 1;
    if(t.type === 'paren' && t.s === '('){
      let ret;
      if(hasCloseParen){
        ret = parseBlock_v2(ts.slice(pos, ts.length - 1), depth + 1);
      }else{
        ret = parseBlock_v2(ts.slice(pos), depth + 1);
      }
      puts("<<---- parseBlock " + depth);
      nodes.push(ret.block);
      posDelta = ret.size;
    }else if(t.type === 'paren' && t.s === ')'){
      nodes.push(new Plain(t));
      break;
    // }else if(t.type === 'hl_tgt'){
    //   nodes.push(new Matched(t));
    }else if(t.type === 'space'){
      nodes.push(new Space(t));
    }else if(t.type === 'quote_s'){
      nodes.push(new Quote(t));
    }else if(t.type === 'quote_b'){
      nodes.push(new Quote(t));
    }else if(t.type === 'cmt_s'){
      nodes.push(new Comment(t));
    }else if(t.type === 'cmt_m'){
      nodes.push(new Comment(t));
    }else if(t.type === 'sym'){
      nodes.push(new Symbol(t));
    }else if(t.type === 'nl'){
      nodes.push(new Newline(t));
    }else{
      // puts(446, t);
      nodes.push(new Plain(t));
    }
    pos += posDelta;
  }

  // puts("409 nodes", nodes);
  const nodes2 = rejectSideBlankLines(nodes);
  // puts("387", nodes2);
  const nodes3 = dedent(nodes2);
  // puts("424 nodes3", nodes3);

  return {
    block: new Block_v2(nodes3, depth, Block_v2.getId())
    ,size: pos + 1
  };
}

function _t_plain(s, ln){
  return { type: 'plain', s: s, ln: ln };
}

function _t_space(s, ln){
  return { type: 'space', s: s, ln: ln };
}

function _t_nl(s, ln){
  return { type: 'nl', s: s, ln: ln };
}

function _t_paren(s, ln){
  return { type: 'paren', s: s, ln: ln };
}

function _t_sym(s, ln){
  return { type: 'sym', s: s, ln: ln };
}

function _t_hl_tgt(s, ln, n){
  return { type: 'hl_tgt', s: s, ln: ln, n: n };
}

function getTgts(input){
  const lines = input.split("\n")
      .filter((line)=>{ return ! /^\s*$/.test(line); });
  const words = [];
  lines.forEach((line, i) => {
    line.split(/ +/).forEach(w =>{
      words.push({ s: w, ln: i + 1 });
    });
  });
  const ret = words
       .sort((a, b) => a.s.length < b.s.length )
       .map(word =>{
         return {
           word: word.s
           ,wordLower: word.s.toLowerCase()
           // ,re: new RegExp("^" + word.s + "([^a-zA-Z0-9_]|$)")
           // ,len: word.s.length
           ,n: word.ln
         };
       })
  puts(467, ret);

  return ret;
}

function consumeQuoteSingle(input, pos, ln){
  let ss = ["'"];
  pos++;
  let lnDelta = 0;
  let len;

  while(pos < input.length){
    len = 1;
    let c = input.charAt(pos);
    let _s;
    if(c === "'"){
      _s = c;
      ss.push(_s);
      pos += _s.length;
      break;
    }else if(c === "\\"){
      _s = input.substring(pos, pos + 2);
      len = 2;
    }else if(c === "\n"){
      _s = c;
      lnDelta++;
    }else{
      _s = c;
    }
    ss.push(_s);
    pos += _s.length;
  }
  let s = ss.join("");

  return {
    len: s.length
    ,s: s
    ,lnDelta: lnDelta
  };
}

function consumeQuoteBackquote(input, pos, ln){
  let ss = ["`"];
  pos++;
  let lnDelta = 0;
  let len;

  while(pos < input.length){
    len = 1;
    let c = input.charAt(pos);
    let _s;
    if(c === "`"){
      _s = c;
      ss.push(_s);
      pos += _s.length;
      break;
    }else if(c === "\\"){
      _s = input.substring(pos, pos + 2);
      len = 2;
    }else if(c === "\n"){
      _s = c;
      lnDelta++;
    }else{
      _s = c;
    }
    ss.push(_s);
    pos += _s.length;
  }
  let s = ss.join("");

  return {
    len: s.length
    ,s: s
    ,lnDelta: lnDelta
  };
}

function consumeCommentSingle_v2(input, pos){
  const origPos = pos; // 起点

  let nlPos = input.indexOf("\n", origPos + 2);
  if(nlPos === -1){
    // クエリ末尾の single comment かつ改行がない場合
    nlPos = input.length;
  }

  return {
    len: nlPos - origPos
    ,s: input.substring(origPos, nlPos)
  };
}

function consumeCommentMulti(input, pos){
  let ss = ["/*"];
  pos += 2;
  let len;
  let lnDelta = 0;

  while(pos < input.length){
    len = 1;
    let c = input.charAt(pos);
    let cc = input.substring(pos, pos + 2);
    let _s;
    if(cc === "*/"){
      _s = cc;
      ss.push(_s);
      pos += _s.length;
      break;
    }else if(c === "\n"){
      _s = c;
      lnDelta++;
    }else{
      _s = c;
    }
    ss.push(_s);
    pos += _s.length;
  }
  let s = ss.join("");

  return {
    len: s.length
    ,s: s
    ,lnDelta: lnDelta
  };
}

function tokenize_v2(_input){
  const input = _input.replace(/\t/g, "    ");

  let pos = 0;
  let ln = 1;
  let len;
  let ts = []; // tokens
  let buf = "";

  while(pos < input.length){
    len = 1;
    let c = input.charAt(pos);
    let cc = input.substring(pos, pos+2);

    if(c === "\n"){
      if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
      ts.push(_t_nl(c, ln));
      ln++;
    }else if(c === '(' || c === ')'){
      if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
      ts.push(_t_paren(c, ln));
    }else if(c === "'"){
      if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
      let ret = consumeQuoteSingle(input, pos);
      ts.push({ type: 'quote_s', s: ret.s, ln: ln });
      len = ret.len;
      ln += ret.lnDelta;
    }else if(c === "`"){
      if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
      let ret = consumeQuoteBackquote(input, pos);
      ts.push({ type: 'quote_b', s: ret.s, ln: ln });
      len = ret.len;
      ln += ret.lnDelta;
    }else if(cc === "--"){
      if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
      let ret = consumeCommentSingle_v2(input, pos);
      ts.push({ type: 'cmt_s', s: ret.s, ln: ln });
      len = ret.len;
    }else if(cc === "/*"){
      if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
      let ret = consumeCommentMulti(input, pos);
      ts.push({ type: 'cmt_m', s: ret.s, ln: ln });
      len = ret.len;
      ln += ret.lnDelta;
    }else if('${},."*<>=;[]'.includes(c)){
      // SQL の symbol ではなく、単なる symbol
      if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
      ts.push(_t_sym(c, ln));
    }else{
      let rest = input.substring(pos);
      if(rest.match(/^( +)/)){
        let word = RegExp.$1;
        if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
        ts.push(_t_space(word, ln));
        len = word.length;
      }else if(rest.match(/^([a-zA-Z0-9_]+)/)){
        let word = RegExp.$1;
        if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
        ts.push(_t_plain(word, ln));
        len = word.length;
      }else{
        buf += c;
      }
    }
    if(len <= 0){ throw "768_" + len; }
    pos += len;
  }
  if(buf.length > 0){ ts.push(_t_plain(buf, ln)); buf = ""; }
  return ts;
}

function dumpTokens(ts){
  // ts.forEach((t)=>{
  //   let s = t.s.replace(/\n/g, "\\n");
  //   puts("DUMP: " + t.ln + ": " + t.type + " : <" + s + ">", t);
  // });
  let hs = [];
  ts.forEach((t, i)=>{
    let s = t.s.replace(/\n/g, "\\n");
    let h = "" + i + ": ln=" + t.ln;
    h += ' ＜<span class="dump_s">' + s + '</span>＞';
    h += ' ' + t.type;
    h += ' - ' + JSON.stringify(t);
    hs.push(h);
  });
  
  let $el = $("#dump");
  $el.html(hs.join("<br />"));
}

function span(s, type){
  return `<span class="span ${type}">${s}</span>`;
}

function escape(s){
  return s
    .replace(/</g, '&lt;')
    // .replace(/ /g, '&nbsp;')
  ;
}

function toHtml(s){
  return s
    // .replace(/ /g, '&nbsp;')
    .replace(/</g, '&lt;')
    // .replace(/\n/g, '<br />')
  ;
}

function isSqlKw(s){
  return SQL_KEYWORDS.includes(s.toLowerCase())
    || SQL_KEYWORDS_2.includes(s.toLowerCase())
    || SQL_KEYWORDS_3.includes(s.toLowerCase())
  ;
}

function uniq(xs){
  let newxs = [];
  xs.forEach(x =>{
    if( ! newxs.includes(x) ){ newxs.push(x); }
  });
  return newxs;
}

// "." の前のトークン
function extractHlwords(ts){
  let ts2 = ts.filter(t =>{
    return ! (
         t.type === "nl"
      || t.type === "space"
      || t.type === "cmt_s"
      || t.type === "cmt_m"
    );
  });
  ts2.forEach(t =>{
    // puts(728, t);
  });
  let hltokens = [];
  for(let i=ts2.length-1; i>=1; i--){
    if(ts2[i].s === "."
       && ts2[i-1].s !== "." // db..table というパターンがある
       && (ts2[i-1].type === "plain" && ! isSqlKw(ts2[i-1].s))
      ){
      hltokens.push(ts2[i-1]);
    }
  }
  let hlwords = hltokens.filter(t =>{
    return ! (
      t.type === "paren"
        || t.type === "symbol"
        || /^\d+$/.test(t.s)
    );
  }).map(t => t.s);
  hlwords = uniq(hlwords);
  puts(747, hlwords);
  puts(747, hlwords.join(" "));
  return hlwords;
}

// 名前っぽいもの and 複数回出現
function extractHlwords_v2(ts){
  let ts2 = ts.filter(t =>{
    return ! (
           t.type === "plain"
        || t.type === "space"
        || t.type === "nl"
        || t.type === "cmt_s"
        || t.type === "cmt_m"
        || t.type === "sym"
        || t.type === "paren"
        || t.type === "quote_s"
        || t.type === "quote_b"
        || /^\d+$/.test(t.s)
        || /[\"\*<>=;]/.test(t.s)
        || isSqlKw(t.s)
    );
  });
  // word count
  let wc = {};
  ts2.forEach(t =>{
    puts(784, t);
    if( ! (t.s in wc) ){
      wc[t.s] = 0;
    }
    wc[t.s]++;
  });
  puts(796, wc);
  let ws = [];
  for(let k in wc){
    puts(799, k, wc[k]);
    if(wc[k] >= 2){ ws.push(k); }
  }
  puts(802, ws, ws.join(" "));
  return ws;
}

function setHlTgts(){
  let inputTgt = $("#hl_tgts").val();
  if(inputTgt.length > 0){
    return;
  }
  let input = getInput();
  let ts = tokenize_v2('(' + input + ')', "");
  // puts(ts.map(t => t.s +":"+ t.type));

  let hlwords = extractHlwords(ts);
  // let hlwords = extractHlwords_v2(ts);
  inputTgt = hlwords.join("\n");
  $("#hl_tgts").val(inputTgt);
}

function dupToken(t){
  let newToken = {};
  for(let k in t){
    newToken[k] = t[k];
  }
  return newToken;
}

function addHl(ts, hlTgtsText){
  let hlTgts = getTgts(hlTgtsText);
  // puts(575, hlTgts);

  let ts2 = ts.map((t)=>{
    let matched = hlTgts.find( tgt =>{
      return tgt.wordLower === t.s.toLowerCase();
    });
    if( matched != null ){
      let new_t = dupToken(t);
      // puts(928, matched);
      new_t.hl = matched.n;
      return new_t;
    }else{
      return t;
    }
  });

  return ts2;
}

function refresh_v2(){
  puts("refresh_v2");
  let input = getInput();
  let ts = tokenize_v2('(' + input + ')');
  if(__DEBUG__) dumpTokens(ts);
  let hlTgtsText = $("#hl_tgts").val();
  let ts2 = addHl(ts, hlTgtsText);
  if(__DEBUG__) dumpTokens(ts2);

  Block_v2.resetId()
  let ret = parseBlock_v2(ts2, 0);
  puts(951, ts2.length, ret.size, ts2.length === ret.size);
  if (ts2.length === ret.size) {
    // accepted
    puts(ret.block.toText());
    puts(ret.block.toHtml());
    // showPreview(ret.block.toHtml());
    showPreview_v2(ret.block.toEl());
  }else{
    // rejected
    // showPreview(toHtml(input));
    showPreview_v2(toEl(input));
  }

    // 折りたたみ
  $("#preview_0 button.fold").on("click", (ev)=>{
    let $tgt = $(ev.target)
    let $outer = $tgt.closest(".block");
    let $bc = $outer.find("> .block_content");
    if( $bc.hasClass("folded") ){
      // $outer.addClass("block_multi");
      $bc.removeClass("folded");
      $tgt.text("-");
    }else{
      // $outer.removeClass("block_multi");
      $bc.addClass("folded");
      $tgt.text("+");
    }
  })

  // クリックしたものを強調
  $(".matched").on("click", (ev)=>{
    const $tgt = $(ev.target);
    const selected = $tgt.attr("class").split(/ +/).find((cl)=>{
      return /matched_\d+/.test(cl);
    })
    $(".matched").removeClass("selected");

    if(selected === prevSelected){
      prevSelected = null;
    }else{
      $('.' + selected).addClass('selected');
      prevSelected = selected;
    }
  });
}

function makeDataKeywords(){
  return [
    [SQL_KEYWORDS_3.join(" ")
     ,SQL_KEYWORDS_3.join(" ").toUpperCase()
    ].join(" ")
    ,
    [SQL_KEYWORDS.join(" ")
     ,SQL_KEYWORDS.join(" ").toUpperCase()
    ].join(" ")
    ,
    [SQL_KEYWORDS_2.join(" ")
     ,SQL_KEYWORDS_2.join(" ").toUpperCase()
    ].join(" ")
    ,
    "?" // prepared statement placeholder
  ].join("\n")
}


// --------------------------------

class Editor {

  /**
   * 選択範囲を加工する
   */
  static modifySelection(proc){
    const textarea = $("#input").get(0);
    const posStart = textarea.selectionStart;
    const posEnd = textarea.selectionEnd;
    if (posStart === posEnd) {
      return;
    }

    const orig = textarea.value;
    const pre = orig.substr(0, posStart);
    const sel = orig.substring(posStart, posEnd);
    const post = orig.substr(posEnd);
    const modified = proc(sel);
    textarea.value = pre + modified + post;
    textarea.setSelectionRange(posStart, posStart + modified.length);
    textarea.focus();
  }

  static _indent(text, indentStr){
    const lines = text.split("\n");

    return lines
      .map((line, i)=>{
        if (i === lines.length - 1 && line === "") {
          return "";
        } else {
          return indentStr + line;
        }
      })
      .join("\n");
  }

  static _dedent(text){
    const lines = text.split("\n");

    return lines
      .map((line)=>{
        if (line.match(/^\t/)) {
          line.match(/^(\t+)(.*)$/);
          const tabs = RegExp.$1;
          const rightContext = RegExp.$2;
          return tabs.replace(/\t/g, "        ") + rightContext;
        } else {
          return line;
        }
      })
      .map((line)=>{
        return line.replace(/^ /, "");
      })
      .join("\n");
  }

  static indent(){
    this.modifySelection((sel)=>{
      return this._indent(sel, " ");
    });
  }

  static dedent(){
    this.modifySelection((sel)=>{
      return this._dedent(sel);
    });
  }

}


// --------------------------------

function start(){
  puts("start");

  $("#data_keywords").val(
    makeDataKeywords()
  );

  // Events

  const debouncedRefresh = _.debounce(refresh_v2, 500);

  $("#input").on("input", debouncedRefresh);
  $("#hl_tgts").on("input", debouncedRefresh);
  $("#auto").on("click", ()=>{
    let input = getInput();
    let ts = tokenize_v2('(' + input + ')');
    let hlwords = extractHlwords(ts);
    let inputTgt = hlwords.join("\n");
    $("#hl_tgts").val(inputTgt);
    refresh_v2();
  });
  $("#keyword").on("click", ()=>{
    let kw = $("#data_keywords").val();
    $("#hl_tgts").val(kw);
    refresh_v2();
  });

  $("#indent").on("click", ()=>{
    Editor.indent();
    debouncedRefresh();
  });
  $("#dedent").on("click", ()=>{
    Editor.dedent();
    debouncedRefresh();
  });

  // Init
  refresh_v2();
}

$(()=>{
  if( /\?debug=1$/.test(location.href) ){
    __DEBUG__ = true;
  }

  if( $("#qunit").length > 0 ){
    test();
  }else{
    start();
  }
});
