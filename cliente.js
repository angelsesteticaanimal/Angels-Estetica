
const KEY="angels_agenda_v9_backup_local";
let db=null; let usingFirebase=false;
function saveLocalRequest(item){const d=JSON.parse(localStorage.getItem(KEY)||"[]"); d.push(item); localStorage.setItem(KEY,JSON.stringify(d));}
async function initFirebaseClient(){try{if(!window.firebaseEnabled)return false; if(!window.firebaseConfig||window.firebaseConfig.apiKey==="COLE_AQUI")return false; if(typeof firebase==="undefined")return false; firebase.initializeApp(window.firebaseConfig); db=firebase.firestore(); usingFirebase=true; return true;}catch(e){console.error(e); return false;}}
async function saveRequest(item){if(usingFirebase){const {id,...data}=item; await db.collection("agendamentos").add({...data,criadoEm:firebase.firestore.FieldValue.serverTimestamp()});}else{saveLocalRequest(item);}}
document.getElementById("clientRequestForm").addEventListener("submit",async e=>{e.preventDefault(); const f=Object.fromEntries(new FormData(e.target).entries()); await saveRequest({id:String(Date.now()),...f,busca:Boolean(f.busca),status:"Pendente",origem:"Cliente"}); e.target.reset(); document.getElementById("okMsg").classList.remove("hidden"); scrollTo({top:0,behavior:"smooth"});});
initFirebaseClient();
