
const KEY="angels_agenda_v6";
document.getElementById("clientRequestForm").addEventListener("submit",e=>{e.preventDefault(); const f=Object.fromEntries(new FormData(e.target).entries()); const d=JSON.parse(localStorage.getItem(KEY)||"[]"); d.push({id:String(Date.now()),...f,busca:Boolean(f.busca),status:"Pendente",origem:"Cliente"}); localStorage.setItem(KEY,JSON.stringify(d)); e.target.reset(); document.getElementById("okMsg").classList.remove("hidden"); scrollTo({top:0,behavior:"smooth"});});
