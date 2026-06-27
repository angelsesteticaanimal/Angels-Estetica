
const KEY = "angels_agenda_v7_backup_local";
const today = new Date().toISOString().slice(0,10);
let db = null;
let usingFirebase = false;

const demo = [
  {id:"1",tutor:"Juliana Lima",whatsapp:"21987654321",pet:"Luna",raca:"Shih Tzu",servico:"Banho e Tosa",porte:"Pequeno",data:today,hora:"09:00",busca:true,obs:"Prefere produtos hipoalergênicos.",status:"Pendente",origem:"App"},
  {id:"2",tutor:"Carlos Eduardo",whatsapp:"21977778888",pet:"Thor",raca:"Golden Retriever",servico:"Banho",porte:"Grande",data:today,hora:"10:30",busca:false,obs:"",status:"Confirmado",origem:"App"},
  {id:"3",tutor:"Mariana Alves",whatsapp:"21966667777",pet:"Mia",raca:"Persa",servico:"Clubinho",porte:"Pequeno",data:today,hora:"13:00",busca:false,obs:"Meio período.",status:"Pendente",origem:"Cliente"}
];

function loadLocal(){
  const s = localStorage.getItem(KEY);
  if(s) return JSON.parse(s);
  localStorage.setItem(KEY, JSON.stringify(demo));
  return demo;
}
function saveLocal(d){ localStorage.setItem(KEY, JSON.stringify(d)); }

function fmt(d){
  if(!d) return "";
  const p=d.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}
function wa(b){
  const phone=(b.whatsapp||"").replace(/\D/g,"");
  const msg=`Olá, ${b.tutor}! Somos da Angels Estética Animal. O agendamento do pet ${b.pet} para ${b.servico} está como ${b.status}. Data: ${fmt(b.data)} às ${b.hora}.`;
  return `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
}
function card(b){
  return `<div class="booking">
    <div class="booking-top">
      <div>
        <h4>${b.pet} — ${b.servico}</h4>
        <p>Tutor: ${b.tutor} • ${b.raca||"Raça não informada"} • Origem: ${b.origem||"App"}</p>
        <p>${fmt(b.data)} às ${b.hora} • ${b.busca?"Com busca e entrega":"Sem busca"}</p>
        ${b.obs?`<p>Obs.: ${b.obs}</p>`:""}
      </div>
      <span class="badge ${b.status}">${b.status}</span>
    </div>
    <div class="booking-actions">
      <button class="ok" onclick="setStatus('${b.id}','Confirmado')">Confirmar</button>
      <button onclick="setStatus('${b.id}','Atendimento')">Atendimento</button>
      <button onclick="setStatus('${b.id}','Concluído')">Finalizar</button>
      <button class="no" onclick="setStatus('${b.id}','Cancelado')">Cancelar</button>
      <button class="wa" onclick="window.open('${wa(b)}','_blank')">WhatsApp</button>
    </div>
  </div>`;
}

function setSyncStatus(text, cls="notice"){
  const el = document.getElementById("syncStatus");
  if(el){
    el.className = cls;
    el.textContent = text;
  }
}

async function initFirebase(){
  try{
    if(!window.firebaseEnabled){
      setSyncStatus("Modo local: Firebase ainda não foi ativado.");
      return false;
    }
    if(!window.firebaseConfig || window.firebaseConfig.apiKey === "COLE_AQUI"){
      setSyncStatus("Firebase ativado, mas configuração ainda não foi preenchida.");
      return false;
    }
    firebase.initializeApp(window.firebaseConfig);
    db = firebase.firestore();
    usingFirebase = true;
    setSyncStatus("Firebase online: sincronização ativada.", "success");
    listenBookings();
    return true;
  }catch(e){
    console.error(e);
    setSyncStatus("Erro ao conectar no Firebase. Usando modo local.");
    return false;
  }
}

function listenBookings(){
  db.collection("agendamentos").orderBy("data").orderBy("hora")
    .onSnapshot(snapshot=>{
      const items = [];
      snapshot.forEach(doc => items.push({id: doc.id, ...doc.data()}));
      renderItems(items);
    }, error=>{
      console.error(error);
      setSyncStatus("Erro ao ler Firebase. Verifique regras do Firestore.");
    });
}

async function saveItem(item){
  if(usingFirebase){
    const {id, ...data} = item;
    await db.collection("agendamentos").add({
      ...data,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }else{
    const d=loadLocal();
    d.push(item);
    saveLocal(d);
    renderLocal();
  }
}

async function setStatus(id,status){
  if(usingFirebase){
    await db.collection("agendamentos").doc(id).update({status});
  }else{
    const d=loadLocal();
    const i=d.find(x=>x.id===id);
    if(i){i.status=status; saveLocal(d); renderLocal();}
  }
}

function renderItems(items){
  const sorted = items.sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
  document.getElementById("countHoje").textContent=sorted.filter(x=>x.data===today).length;
  document.getElementById("countPendentes").textContent=sorted.filter(x=>x.status==="Pendente").length;
  document.getElementById("countConfirmados").textContent=sorted.filter(x=>x.status==="Confirmado").length;
  document.getElementById("countClubinho").textContent=sorted.filter(x=>x.servico==="Clubinho").length;
  const empty=`<div class="empty">Nenhum agendamento cadastrado ainda.</div>`;
  document.getElementById("recentList").innerHTML=sorted.slice(0,3).map(card).join("")||empty;
  document.getElementById("agendaList").innerHTML=sorted.map(card).join("")||empty;
}
function renderLocal(){
  renderItems(loadLocal());
}
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));
  scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".bottom-nav button").forEach(btn=>btn.addEventListener("click",()=>showScreen(btn.dataset.screen)));

document.getElementById("bookingForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const f=Object.fromEntries(new FormData(e.target).entries());
  await saveItem({id:String(Date.now()),...f,busca:Boolean(f.busca),status:"Pendente",origem:"App"});
  e.target.reset();
  showScreen("agenda");
});

async function copyClientMessage(){
  const text=document.getElementById("clientMessage").innerText.trim();
  try{await navigator.clipboard.writeText(text); alert("Mensagem copiada!");}catch(e){alert(text);}
}

initFirebase().then(ok=>{ if(!ok) renderLocal(); });
