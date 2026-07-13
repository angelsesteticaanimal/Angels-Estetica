document.documentElement.style.visibility = "hidden";

const KEY = "angels_agenda_v9_backup_local";
const today = new Date().toISOString().slice(0, 10);

let db = null;
let usingFirebase = false;

/* =========================================================
   PROTEÇÃO DO PAINEL ADMINISTRATIVO
========================================================= */

function iniciarFirebaseApp() {
  if (typeof firebase === "undefined") {
    throw new Error("Firebase SDK não foi carregado.");
  }

  if (!window.firebaseConfig) {
    throw new Error("Configuração do Firebase não encontrada.");
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }

  return firebase.app();
}

function protegerPainelAdministrativo() {
  return new Promise((resolve) => {
    try {
      iniciarFirebaseApp();

      const auth = firebase.auth();

      auth.onAuthStateChanged((usuario) => {
        if (!usuario) {
          window.location.replace("login-admin.html");
          resolve(false);
          return;
        }

        document.documentElement.style.visibility = "visible";
        resolve(true);
      });
    } catch (erro) {
      console.error("Erro ao verificar login:", erro);
      window.location.replace("login-admin.html");
      resolve(false);
    }
  });
}

/* Função disponível para um futuro botão de sair */
async function sairDoPainel() {
  try {
    iniciarFirebaseApp();
    await firebase.auth().signOut();
    window.location.replace("login-admin.html");
  } catch (erro) {
    console.error("Erro ao sair:", erro);
    alert("Não foi possível encerrar a sessão.");
  }
}

/* =========================================================
   DADOS DE DEMONSTRAÇÃO / MODO LOCAL
========================================================= */

const demo = [
  {
    id: "1",
    tutor: "Juliana Lima",
    whatsapp: "21987654321",
    pet: "Luna",
    raca: "Shih Tzu",
    servico: "Banho e Tosa",
    porte: "Pequeno",
    data: today,
    hora: "09:00",
    busca: true,
    obs: "Prefere produtos hipoalergênicos.",
    status: "Pendente",
    origem: "App"
  },
  {
    id: "2",
    tutor: "Carlos Eduardo",
    whatsapp: "21977778888",
    pet: "Thor",
    raca: "Golden Retriever",
    servico: "Banho",
    porte: "Grande",
    data: today,
    hora: "10:30",
    busca: false,
    obs: "",
    status: "Confirmado",
    origem: "App"
  }
];

function loadLocal() {
  try {
    const salvo = localStorage.getItem(KEY);

    if (salvo) {
      return JSON.parse(salvo);
    }

    localStorage.setItem(KEY, JSON.stringify(demo));
    return demo;
  } catch (erro) {
    console.error("Erro ao carregar dados locais:", erro);
    return [...demo];
  }
}

function saveLocal(dados) {
  try {
    localStorage.setItem(KEY, JSON.stringify(dados));
  } catch (erro) {
    console.error("Erro ao salvar dados locais:", erro);
  }
}

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function fmt(data) {
  if (!data) {
    return "";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function wa(agendamento) {
  const telefone = (agendamento.whatsapp || "").replace(/\D/g, "");

  const mensagem =
    `Olá, ${agendamento.tutor}! ` +
    `Somos da Angels Estética Animal. ` +
    `O agendamento do pet ${agendamento.pet} para ` +
    `${agendamento.servico} está como ${agendamento.status}. ` +
    `Data: ${fmt(agendamento.data)} às ${agendamento.hora}.`;

  return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   CARTÕES DOS AGENDAMENTOS
========================================================= */

function card(agendamento) {
  const id = escaparHtml(agendamento.id);
  const pet = escaparHtml(agendamento.pet);
  const servico = escaparHtml(agendamento.servico);
  const tutor = escaparHtml(agendamento.tutor);
  const raca = escaparHtml(
    agendamento.raca || "Raça não informada"
  );
  const origem = escaparHtml(agendamento.origem || "App");
  const hora = escaparHtml(agendamento.hora);
  const observacao = escaparHtml(agendamento.obs || "");
  const status = escaparHtml(agendamento.status);

  return `
    <div class="booking">
      <div class="booking-top">
        <div>
          <h4>${pet} — ${servico}</h4>

          <p>
            Tutor: ${tutor} • ${raca} • Origem: ${origem}
          </p>

          <p>
            ${fmt(agendamento.data)} às ${hora} •
            ${
              agendamento.busca
                ? "Com busca e entrega"
                : "Sem busca"
            }
          </p>

          ${
            observacao
              ? `<p>Obs.: ${observacao}</p>`
              : ""
          }
        </div>

        <span class="badge ${status}">
          ${status}
        </span>
      </div>

      <div class="booking-actions">
        <button
          class="ok"
          onclick="setStatus('${id}', 'Confirmado')">
          Confirmar
        </button>

        <button
          onclick="setStatus('${id}', 'Atendimento')">
          Atendimento
        </button>

        <button
          onclick="setStatus('${id}', 'Concluído')">
          Finalizar
        </button>

        <button
          class="no"
          onclick="setStatus('${id}', 'Cancelado')">
          Cancelar
        </button>

        <button
          class="wa"
          onclick="window.open('${wa(agendamento)}', '_blank')">
          WhatsApp
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
   STATUS DA CONEXÃO
========================================================= */

function setSyncStatus(texto, classe = "notice") {
  const elemento = document.getElementById("syncStatus");

  if (!elemento) {
    return;
  }

  if (elemento.parentElement) {
    elemento.parentElement.className = classe;
  }

  elemento.textContent = texto;
}

/* =========================================================
   FIREBASE / FIRESTORE
========================================================= */

async function initFirebase() {
  try {
    if (!window.firebaseEnabled) {
      setSyncStatus("Modo local: Firebase desativado.");
      return false;
    }

    if (
      !window.firebaseConfig ||
      window.firebaseConfig.apiKey === "COLE_AQUI"
    ) {
      setSyncStatus("Firebase sem configuração.");
      return false;
    }

    iniciarFirebaseApp();

    if (!firebase.firestore) {
      setSyncStatus(
        "Firebase Firestore não foi carregado."
      );
      return false;
    }

    db = firebase.firestore();
    usingFirebase = true;

    setSyncStatus(
      "Firebase online: sincronização ativada.",
      "success"
    );

    listenBookings();
    return true;
  } catch (erro) {
    console.error("Erro ao conectar no Firebase:", erro);

    setSyncStatus(
      "Erro ao conectar no Firebase. Usando modo local."
    );

    usingFirebase = false;
    return false;
  }
}

function listenBookings() {
  if (!db) {
    return;
  }

  db.collection("agendamentos")
    .orderBy("data")
    .orderBy("hora")
    .onSnapshot(
      (snapshot) => {
        const itens = [];

        snapshot.forEach((documento) => {
          itens.push({
            id: documento.id,
            ...documento.data()
          });
        });

        renderItems(itens);
      },
      (erro) => {
        console.error("Erro ao ler agendamentos:", erro);

        setSyncStatus(
          "Erro ao ler Firebase. Verifique as regras do Firestore."
        );
      }
    );
}

/* =========================================================
   SALVAR E ALTERAR AGENDAMENTOS
========================================================= */

async function saveItem(item) {
  try {
    if (usingFirebase && db) {
      const { id, ...dados } = item;

      await db.collection("agendamentos").add({
        ...dados,
        criadoEm:
          firebase.firestore.FieldValue.serverTimestamp()
      });

      return;
    }

    const dadosLocais = loadLocal();
    dadosLocais.push(item);
    saveLocal(dadosLocais);
    renderLocal();
  } catch (erro) {
    console.error("Erro ao salvar agendamento:", erro);
    alert("Não foi possível salvar o agendamento.");
  }
}

async function setStatus(id, status) {
  try {
    if (usingFirebase && db) {
      await db
        .collection("agendamentos")
        .doc(id)
        .update({
          status,
          atualizadoEm:
            firebase.firestore.FieldValue.serverTimestamp()
        });

      return;
    }

    const dadosLocais = loadLocal();
    const indice = dadosLocais.findIndex(
      (item) => item.id === id
    );

    if (indice >= 0) {
      dadosLocais[indice].status = status;
      saveLocal(dadosLocais);
      renderLocal();
    }
  } catch (erro) {
    console.error("Erro ao atualizar status:", erro);
    alert("Não foi possível atualizar o agendamento.");
  }
}

/* =========================================================
   EXIBIÇÃO DOS DADOS
========================================================= */

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

function atualizarHtml(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.innerHTML = valor;
  }
}

function renderItems(itens) {
  const ordenados = [...itens].sort((a, b) => {
    const primeiro = `${a.data || ""}${a.hora || ""}`;
    const segundo = `${b.data || ""}${b.hora || ""}`;

    return primeiro.localeCompare(segundo);
  });

  atualizarTexto(
    "countHoje",
    ordenados.filter(
      (item) => item.data === today
    ).length
  );

  atualizarTexto(
    "countPendentes",
    ordenados.filter(
      (item) => item.status === "Pendente"
    ).length
  );

  atualizarTexto(
    "countConfirmados",
    ordenados.filter(
      (item) => item.status === "Confirmado"
    ).length
  );

  atualizarTexto(
    "countClubinho",
    ordenados.filter(
      (item) => item.servico === "Clubinho"
    ).length
  );

  const vazio = `
    <div class="empty">
      Nenhum agendamento cadastrado ainda.
    </div>
  `;

  atualizarHtml(
    "recentList",
    ordenados.slice(0, 3).map(card).join("") || vazio
  );

  atualizarHtml(
    "agendaList",
    ordenados.map(card).join("") || vazio
  );
}

function renderLocal() {
  renderItems(loadLocal());
}

/* =========================================================
   NAVEGAÇÃO DO PAINEL
========================================================= */

function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((tela) => {
      tela.classList.remove("active");
    });

  const telaSelecionada = document.getElementById(id);

  if (telaSelecionada) {
    telaSelecionada.classList.add("active");
  }

  document
    .querySelectorAll(".bottom-nav button")
    .forEach((botao) => {
      botao.classList.toggle(
        "active",
        botao.dataset.screen === id
      );
    });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   FORMULÁRIO
========================================================= */

function configurarEventosDoPainel() {
  document
    .querySelectorAll(".bottom-nav button")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        showScreen(botao.dataset.screen);
      });
    });

  const formulario = document.getElementById("bookingForm");

  if (formulario) {
    formulario.addEventListener(
      "submit",
      async (evento) => {
        evento.preventDefault();

        const dados = Object.fromEntries(
          new FormData(evento.target).entries()
        );

        await saveItem({
          id: String(Date.now()),
          ...dados,
          busca: Boolean(dados.busca),
          status: "Pendente",
          origem: "App"
        });

        evento.target.reset();
        showScreen("agenda");
      }
    );
  }
}

async function copyClientMessage() {
  const elemento =
    document.getElementById("clientMessage");

  if (!elemento) {
    return;
  }

  const texto = elemento.innerText.trim();

  try {
    await navigator.clipboard.writeText(texto);
    alert("Mensagem copiada!");
  } catch (erro) {
    console.error("Erro ao copiar mensagem:", erro);
    alert(texto);
  }
}

/* =========================================================
   INICIALIZAÇÃO DO PAINEL
========================================================= */

async function iniciarPainel() {
  configurarEventosDoPainel();

  const conectado = await initFirebase();

  if (!conectado) {
    renderLocal();
  }
}

protegerPainelAdministrativo().then(
  (usuarioAutorizado) => {
    if (usuarioAutorizado) {
      iniciarPainel();
    }
  }
);
