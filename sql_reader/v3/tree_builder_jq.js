/**
 * Hyperscript-like builder
 */
class TreeBuilder {

  static splitClass(str){
    let head;
    let tail;

    if(str.indexOf(".") >=1 ){
      const m = str.match(/^(.+?)\.(.+)/);
      head = m[1];
      tail = m[2].replace(/\./g, " ");
    }else{
      head = str;
    }

    return {
      head: head
      ,tail: tail
    }
  }

  static _build(tag, attrs, ...kids){
    let tagName = null;
    let idClass = null;
    let id = null;
    let classNames = null;

    if(tag.indexOf("#") >=1 ){
      const m = tag.match(/^(.+?)#(.+)/);
      tagName = m[1];
      idClass = m[2];

      if(idClass.indexOf(".") >=1 ){
        const ret = this.splitClass(idClass);
        id = ret.head;
        classNames = ret.tail;
      }else{
        tagName = tag;
      }
    }else{
      if(tag.indexOf(".") >=1 ){
        const ret = this.splitClass(tag);
        tagName = ret.head;
        classNames = ret.tail;
      }else{
        tagName = tag;
      }
    }

    const $el = $(`<${tagName}></${tagName}>`);
    if(id){
      $el.attr("id", id);
    }
    if(classNames){
      $el.addClass(classNames);
    }

    for(let [k, v] of Object.entries(attrs)){
      if(k === 'onclick'){
        $el.on("click", v);
      }else if(k === '_html'){
        $el.html(v);
      }else{
        $el.attr(k, v);
      }
    }
    
    kids.forEach((kid)=>{
      if(typeof kid === "string"){
        $el.append(kid);
      }else if(Array.isArray(kid)){
        kid.forEach((el)=>{
          $el.append(el);
        });
      }else{
        $el.append(kid);
      }
    });

    return $el;
  }

  static build(fn){
    return fn(this._build.bind(this));
  }
}
