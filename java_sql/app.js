function puts(...args) {
  console.log(...args);
}

function getEls(sel, root = document) {
  return root.querySelectorAll(sel);
}

function getEl(sel, root = document) {
  return getEls(sel, root)[0];
}

function convertJavaToSql(javaSrc) {
  const lines = javaSrc.split("\n");
  let lines2 = [];
  lines.forEach(line =>{
    let m;
    if (line.match(/^ *$/)) {
      lines2.push("");
    } else if (line.match(/ *\+ "(.+)"/)) {
      lines2.push(RegExp.$1);
    } else if (line.match(/ *"(.+)"/)) {
      lines2.push(RegExp.$1);
    } else {
      lines2.push(`-- ? (${line})`);
    }
  });

  return (lines2.join("\n"));
}

document.addEventListener("DOMContentLoaded", ()=>{
  puts(27, getEl("#to_sql"));
  getEl("#to_sql").addEventListener("click", ()=>{
    puts(
      getEl("#java").value
    );
    getEl("#sql").value =
      convertJavaToSql(
        getEl("#java").value
      );
  });
  puts(123);
});
