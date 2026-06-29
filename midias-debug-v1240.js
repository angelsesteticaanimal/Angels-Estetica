
(function(){
  const firebaseConfigMidias = {
    apiKey: "AIzaSyBod60eSEo-zfVsa4XD_ZzWVzKpJlsZVcM",
    authDomain: "angels-agenda.firebaseapp.com",
    projectId: "angels-agenda",
    storageBucket: "angels-agenda.firebasestorage.app",
    messagingSenderId: "796463233277",
    appId: "1:796463233277:web:471e0796be00b489812694",
    measurementId: "G-Y2M68MDTGR"
  };

  function log(txt, mode){
    const el = document.getElementById("midiaConsole");
    if(!el) return;
    el.className = mode || "";
    el.textContent = txt;
  }

  function db(){
    if(typeof firebase === "undefined"){
      throw new Error("Firebase não carregou. Verifique internet ou bloqueio do navegador.");
    }
    if(!firebase.apps.length){
      firebase.initializeApp(firebaseConfigMidias);
    }
    return firebase.firestore();
  }

  function value(id, fallback){
    const el = document.getElementById(id);
    return ((el && el.value) ? el.value : (fallback || "")).trim();
  }

  function fileToImage(file){
    return new Promise((resolve, reject)=>{
      if(!file) return reject(new Error("Nenhuma foto selecionada."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Erro ao ler a foto."));
      reader.onload = (e)=>{
        const img = new Image();
        img.onerror = () => reject(new Error("Erro ao carregar a foto."));
        img.onload = ()=>{
          const canvas = document.createElement("canvas");
          const max = 850;
          let w = img.width;
          let h = img.height;
          if(w > h && w > max){ h = Math.round(h * max / w); w = max; }
          if(h >= w && h > max){ w = Math.round(w * max / h); h = max; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function testarFirebase(){
    try{
      log("Testando Firebase agora...");
      await db().collection("teste_conexao").add({
        teste: true,
        origem: "botao-direto-v1240",
        createdAt: new Date().toISOString()
      });
      log("✅ Firebase aceitou gravação.\nAgora você pode publicar foto, louvor ou vídeo.", "ok");
    }catch(e){
      console.error(e);
      log("❌ Firebase não aceitou gravação.\nErro: " + (e.message || e) + "\n\nConfira se as regras foram publicadas e se a chave API permite este domínio.", "err");
    }
  }

  async function publicarFoto(){
    try{
      log("Preparando foto e enviando para o Firebase...");
      const input = document.getElementById("galleryFile");
      const file = input && input.files && input.files[0];
      const imagem = await fileToImage(file);
      await db().collection("galeria").add({
        titulo: value("galleryTitle", "Publicação Angels"),
        descricao: value("galleryDesc", ""),
        categoria: value("galleryCat", "Instagram"),
        imagem,
        createdAt: new Date().toISOString()
      });
      log("✅ Foto publicada no Firebase.\nAbra o site público e atualize com Ctrl + F5.", "ok");
    }catch(e){
      console.error(e);
      log("❌ A foto não publicou.\nErro: " + (e.message || e), "err");
    }
  }

  async function publicarLouvor(){
    try{
      log("Publicando louvor no Firebase...");
      const link = value("musicLink", "");
      if(!link) throw new Error("Cole o link do YouTube na área Louvores Ambiente do Site.");
      await db().collection("louvores").add({
        titulo: value("musicTitle", "Louvor ambiente"),
        cantor: value("musicSinger", ""),
        link,
        tipo: "youtube",
        ativo: true,
        createdAt: new Date().toISOString()
      });
      log("✅ Louvor publicado no Firebase.\nAbra o site público e teste o player de louvor.", "ok");
    }catch(e){
      console.error(e);
      log("❌ O louvor não publicou.\nErro: " + (e.message || e), "err");
    }
  }

  async function publicarVideo(){
    try{
      log("Publicando vídeo no Firebase...");
      const link = value("videoLink", "");
      if(!link) throw new Error("Cole o link do vídeo na área Vídeos do Site.");
      await db().collection("videos").add({
        titulo: value("videoTitle", "Vídeo Angels"),
        descricao: value("videoDesc", ""),
        categoria: value("videoCat", "Vídeo"),
        link,
        createdAt: new Date().toISOString()
      });
      log("✅ Vídeo publicado no Firebase.\nAbra o site público e atualize com Ctrl + F5.", "ok");
    }catch(e){
      console.error(e);
      log("❌ O vídeo não publicou.\nErro: " + (e.message || e), "err");
    }
  }

  function bind(){
    const map = [
      ["btnMidiaTeste", testarFirebase],
      ["btnFotoDireta", publicarFoto],
      ["btnLouvorDireto", publicarLouvor],
      ["btnVideoDireto", publicarVideo]
    ];
    map.forEach(([id,fn])=>{
      const el = document.getElementById(id);
      if(el){
        el.onclick = fn;
      }
    });
    log("✅ Botões de mídia carregados. Clique em Testar Firebase agora.", "ok");
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bind);
  }else{
    bind();
  }
})();


(function(){
function msg(t,m){const e=document.getElementById("playlistMsg");if(e){e.className=m||"";e.textContent=t}}
function db(){if(typeof firebase==="undefined")throw new Error("Firebase não carregou.");if(!firebase.apps.length)firebase.initializeApp(firebaseConfigMidias||firebaseConfig);return firebase.firestore()}
function val(id){return(document.getElementById(id)?.value||"").trim()}
function listId(u){let m=String(u||"").replace(/&amp;/g,"&").match(/[?&]list=([^&]+)/);return m?m[1]:""}
function vidId(u){let s=String(u||"").replace(/&amp;/g,"&");let m=s.match(/[?&]v=([^&]+)/)||s.match(/youtu\.be\/([^?&/]+)/)||s.match(/youtube\.com\/shorts\/([^?&/]+)/);return m?m[1]:""}
async function salvar(){try{const link=val("playlistLouvorLink"),titulo=val("playlistLouvorTitulo")||"Louvores Angels 24h";if(!link)throw new Error("Cole um link de playlist ou vídeo.");const l=listId(link),v=vidId(link);if(!l&&!v)throw new Error("Não encontrei ID de playlist ou vídeo.");await db().collection("config").doc("louvor24h").set({titulo,link,listId:l,videoId:v,updatedAt:new Date().toISOString()});msg("✅ Playlist salva. Abra o site público e atualize com Ctrl+F5.","ok")}catch(e){console.error(e);msg("❌ Não salvou: "+(e.message||e),"err")}}
function testar(){const link=val("playlistLouvorLink"),l=listId(link),v=vidId(link);let url=l?"https://www.youtube.com/embed/videoseries?list="+encodeURIComponent(l)+"&autoplay=1&mute=1&loop=1&controls=1&rel=0&playsinline=1":v?"https://www.youtube.com/embed/"+encodeURIComponent(v)+"?autoplay=1&mute=1&controls=1&rel=0&playsinline=1":"";if(url)window.open(url,"_blank");else msg("Cole um link válido para testar.","err")}
function bind(){let a=document.getElementById("btnSalvarPlaylistLouvor"),b=document.getElementById("btnTestarPlaylistLouvor");if(a)a.onclick=salvar;if(b)b.onclick=testar}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",bind):bind()
})();
