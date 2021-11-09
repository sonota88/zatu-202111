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

    const el = document.createElement(tagName);
    if(id){
      el.id = id;
    }
    if(classNames){
      const cs = classNames.split(" ")
      cs.forEach(c =>{
        el.classList.add(c)
      });
    }

    for(let [k, v] of Object.entries(attrs)){
      if(/^_on(.+)/.test(k)){
        puts("TODO add event linstener")
      }else if(k === 'style'){
        for(let [sk, sv] of Object.entries(v)){
          el.style[sk] = sv;
        }
      }else if(k === '_html'){
        el.innerHTML = v;
      }else{
        el.setAttribute(k, v);
      }
    }
    
    kids.forEach((kid)=>{
      if(kid == null){
        ;
      }else if(typeof kid === "string"){
        el.appendChild(document.createTextNode(kid));
      }else if(Array.isArray(kid)){
        kid.forEach((_el)=>{
          // puts(84, _el);
          // puts(84, JSON.stringify(_el));
          if(typeof _el === 'string'){
            el.appendChild(document.createTextNode(_el));
          }else{
            el.appendChild(_el);
          }
        });
      }else{
        el.appendChild(kid);
      }
    });

    return el;
  }

  static build(fn){
    return fn(this._build.bind(this));
  }
}
