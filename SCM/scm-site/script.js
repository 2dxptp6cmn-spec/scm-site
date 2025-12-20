/* =========================
   Utils
========================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const STORAGE_KEY = "scm_convocation_v2";

function safeJSONParse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

async function tryFetchJSON(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null; // fallback côté JS
  }
}

function formatDateFR(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/* =========================
   Navigation
========================= */
const navToggle = $(".nav-toggle");
const nav = $("#main-nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$(".nav-link", nav).forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }));
}

const sections = ["accueil","resultats","galerie","joueurs","convocation","infos","contact"]
  .map(id => document.getElementById(id))
  .filter(Boolean);
const navLinks = $$(".nav-link");

function setActiveLink() {
  const y = window.scrollY + 120;
  let activeId = sections[0]?.id || "accueil";
  for (const sec of sections) {
    if (sec.offsetTop <= y) activeId = sec.id;
  }
  navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${activeId}`));
}
window.addEventListener("scroll", setActiveLink, { passive: true });
setActiveLink();

$("#printPageBtn")?.addEventListener("click", () => window.print());
$("#year")?.append(String(new Date().getFullYear()));

/* =========================
   Fallback data (si fetch bloqué)
========================= */
const fallbackClub = {
  identity: {
    name: "S. C. MORLAIX",
    affiliationNumber: "553186",
    league: "BRETAGNE",
    district: "FINISTERE",
    kitColors: "Bleu marine et rouge",
    teamsCount: 20
  },
  contacts: { address: "BP 57233 rue de kerveguen 29672 MORLAIX" },
  installations: [
    { name: "Stade Maurice Marzin", address: "La Vierge Noire 29600 MORLAIX" },
    { name: "Stade Arthur Aurégan", address: "Avenue du Parc 29600 MORLAIX" },
    { name: "Stade de la Madeleine", address: "29600 MORLAIX" },
    { name: "Stade de Coatserho 1", address: "Route de Porsmoguer 29600 MORLAIX" }
  ],
  staff: [
    { role: "Président", name: "POSTOLLEC Stéphane", phone: "06 81 88 54 95", email: "sp.scmorlaix@gmail.com" },
    { role: "Co-président", name: "HABEAU André", phone: "", email: "" },
    { role: "Secrétaire général", name: "BOULANGER Jean-Jacques", phone: "06 64 51 16 20", email: "jjb.scmorlaix@gmail.com" },
    { role: "Trésorier", name: "FRANCOIS Claude", phone: "06 17 10 21 67", email: "claudefrancois.scmorlaix@gmail.com" }
  ],
  links: [
    { label: "FFF – Fiche club", url: "https://www.fff.fr/competition/club/553186-s-c-morlaix/equipes.html" },
    { label: "Site officiel", url: "https://www.scmorlaix.com/" }
  ]
};

const fallbackPlayers = [
  { name: "Prénom NOM", position: "Attaquant", team: "Seniors A", number: 9, photo: "./assets/players/placeholder.svg", tags: ["Buteur","Vitesse"] },
  { name: "Prénom NOM", position: "Milieu", team: "Seniors A", number: 6, photo: "./assets/players/placeholder.svg", tags: ["Récup","Relance"] },
  { name: "Prénom NOM", position: "Défenseur", team: "Seniors B", number: 4, photo: "./assets/players/placeholder.svg", tags: ["Duel","Leader"] },
  { name: "Prénom NOM", position: "Gardien", team: "Seniors A", number: 1, photo: "./assets/players/placeholder.svg", tags: ["Réflexes","Relances"] }
];

const fallbackResults = {
  weekLabel: "Week-end (exemple)",
  matches: [
    { team: "Seniors A", competition: "Régional", date: "2025-12-14", status: "FINISHED", home: "Plaintel SP 1", away: "Morlaix SC 1", scoreHome: 1, scoreAway: 0 },
    { team: "Seniors A", competition: "Régional", date: "2026-01-18", status: "SCHEDULED", home: "Morlaix SC 1", away: "Paimpol Stade FC 1", kickoff: "15:00", location: "Morlaix" }
  ]
};

/* =========================
   Load data
========================= */
let clubData = null;
let playersData = null;
let resultsData = null;

async function loadAllData() {
  clubData = await tryFetchJSON("./data/club.json") || fallbackClub;
  playersData = await tryFetchJSON("./data/players.json") || fallbackPlayers;
  resultsData = await tryFetchJSON("./data/results.json") || fallbackResults;

  renderClub(clubData);
  renderResults(resultsData);
  initPlayers(playersData);
  initConvocationFromResults(resultsData);
}

function renderClub(c) {
  // Brand subtitle
  const brandSub = $("#brandSub");
  if (brandSub) brandSub.textContent = "Sporting Club Morlaisien";

  // KPIs
  const kpis = $("#heroKpis");
  if (kpis) {
    kpis.innerHTML = `
      <div class="kpi"><p class="k">Affiliation</p><p class="v">FFF • ${c.identity.affiliationNumber}</p></div>
      <div class="kpi"><p class="k">Ligue / District</p><p class="v">${c.identity.league} • ${c.identity.district}</p></div>
      <div class="kpi"><p class="k">Couleurs</p><p class="v">${c.identity.kitColors}</p></div>
    `;
  }

  // Identity list
  const identity = $("#clubIdentity");
  if (identity) {
    identity.innerHTML = `
      <li><span class="k">Nom</span><span class="v">${c.identity.name}</span></li>
      <li><span class="k">Affiliation</span><span class="v">${c.identity.affiliationNumber}</span></li>
      <li><span class="k">Ligue</span><span class="v">${c.identity.league}</span></li>
      <li><span class="k">District</span><span class="v">${c.identity.district}</span></li>
      <li><span class="k">Couleurs</span><span class="v">${c.identity.kitColors}</span></li>
      <li><span class="k">Nombre d’équipes</span><span class="v">${c.identity.teamsCount}</span></li>
    `;
  }

  // Contacts
  const contacts = $("#clubContacts");
  if (contacts) {
    contacts.innerHTML = `
      <li><span class="k">Adresse</span><span class="v">${c.contacts.address}</span></li>
    `;
  }

  // Installations
  const inst = $("#clubInstallations");
  if (inst) {
    inst.innerHTML = c.installations.map(i => `
      <div class="installation">
        <p class="name">${i.name}</p>
        <p class="addr">${i.address}</p>
      </div>
    `).join("");
  }

  // Staff
  const staff = $("#clubStaff");
  if (staff) {
    staff.innerHTML = c.staff.map(s => `
      <div class="staff-card">
        <p class="role">${s.role}</p>
        <p class="person">${s.name}</p>
        <div class="contact">
          ${s.phone ? `<div>Tél. : ${s.phone}</div>` : ""}
          ${s.email ? `<div>Email : <a href="mailto:${s.email}">${s.email}</a></div>` : ""}
        </div>
      </div>
    `).join("");
  }

  // Links
  const links = $("#officialLinks");
  const quick = $("#quickLinks");
  if (links || quick) {
    const html = (c.links || []).map(l => `
      <a class="btn ${l.label.includes("FFF") ? "primary" : ""}" href="${l.url}" target="_blank" rel="noreferrer">${l.label}</a>
    `).join("");
    if (links) links.innerHTML = html;
    if (quick) quick.innerHTML = html;
  }
}

/* =========================
   Results
========================= */
function renderResults(r) {
  const list = $("#resultsList");
  const teamFilter = $("#teamFilter");
  const statusFilter = $("#statusFilter");

  if (!list || !teamFilter || !statusFilter) return;

  const teams = Array.from(new Set((r.matches || []).map(m => m.team))).sort();
  teamFilter.innerHTML = `<option value="all">Toutes</option>` + teams.map(t => `<option value="${t}">${t}</option>`).join("");

  function draw() {
    const team = teamFilter.value;
    const status = statusFilter.value;

    const filtered = (r.matches || []).filter(m => {
      const okTeam = team === "all" ? true : m.team === team;
      const okStatus = status === "all" ? true : m.status === status;
      return okTeam && okStatus;
    });

    list.innerHTML = filtered.map(m => {
      const isFinished = m.status === "FINISHED";
      const badgeCls = isFinished ? "finished" : "scheduled";
      const badgeTxt = isFinished ? "Terminé" : "À venir";
      const score = isFinished ? `${m.scoreHome} - ${m.scoreAway}` : (m.kickoff ? m.kickoff : "—");

      return `
        <article class="card match">
          <div class="match-top">
            <div>
              <div class="match-line">
                <span class="badge ${badgeCls}">${badgeTxt}</span>
                <span class="sep">•</span>
                <strong>${m.team}</strong>
              </div>
              <div class="match-line">
                <span>${m.competition || "Compétition"}</span>
                <span class="sep">•</span>
                <span>${formatDateFR(m.date)}</span>
              </div>
            </div>
            <div class="score">${score}</div>
          </div>

          <div class="match-line"><strong>${m.home}</strong> <span class="sep">vs</span> <strong>${m.away}</strong></div>
          ${m.location ? `<div class="match-line muted">Lieu : ${m.location}</div>` : ""}
          ${m.notes ? `<div class="match-line muted">${m.notes}</div>` : ""}
        </article>
      `;
    }).join("");

    if (filtered.length === 0) {
      list.innerHTML = `<div class="muted">Aucun match pour ce filtre.</div>`;
    }
  }

  teamFilter.addEventListener("change", draw);
  statusFilter.addEventListener("change", draw);
  draw();
}

/* =========================
   Players
========================= */
function initPlayers(players) {
  const grid = $("#playersGrid");
  const positionFilter = $("#positionFilter");
  const playerSearch = $("#playerSearch");

  if (!grid || !positionFilter || !playerSearch) return;

  function draw() {
    const pos = positionFilter.value;
    const q = playerSearch.value.trim().toLowerCase();

    const filtered = (players || []).filter(p => {
      const okPos = pos === "all" ? true : (p.position === pos);
      const okQ = !q ? true : (String(p.name || "").toLowerCase().includes(q));
      return okPos && okQ;
    });

    grid.innerHTML = filtered.map(p => {
      const tags = (p.tags || []).slice(0, 4).map(t => `<span class="tag ${p.position === "Attaquant" ? "red" : "navy"}">${t}</span>`).join("");
      const number = (p.number || p.number === 0) ? `#${p.number}` : "";
      return `
        <article class="card player-card">
          <img class="player-img" src="${p.photo || "./assets/players/placeholder.svg"}" alt="Photo de ${p.name}">
          <div class="player-body">
            <p class="player-name">${p.name} ${number ? `<span class="muted">• ${number}</span>` : ""}</p>
            <p class="player-meta">${p.position} • ${p.team || "Équipe"}</p>
            <div class="tags">${tags}</div>
          </div>
        </article>
      `;
    }).join("");

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="muted">Aucun joueur ne correspond à la recherche.</div>`;
    }
  }

  positionFilter.addEventListener("change", draw);
  playerSearch.addEventListener("input", draw);
  draw();
}

/* =========================
   Lightbox Galerie
========================= */
const lightbox = $("#lightbox");
const lightboxMedia = $("#lightboxMedia");
const lightboxCaption = $("#lightboxCaption");
$("#lightboxClose")?.addEventListener("click", () => lightbox?.close());

$$(".gallery .media").forEach(card => {
  card.addEventListener("click", () => {
    const title = $(".strong", card)?.textContent?.trim() || "Photo";
    const subtitle = $(".muted", card)?.textContent?.trim() || "";
    if (!lightbox || !lightboxMedia || !lightboxCaption) return;
    lightboxMedia.innerHTML = `<strong>${title}</strong>`;
    lightboxCaption.textContent = subtitle;
    lightbox.showModal();
  });
});
lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });

/* =========================
   Convocation (persistée)
========================= */
const defaultConvoc = {
  match: { title: "SC Morlaix vs Adversaire", datetime: "Dimanche • 15:00", location: "Morlaix • (stade à préciser)", rendezvous: "13:45" },
  players: [
    { name: "Joueur 1", position: "Gardien", status: "Convoqué" },
    { name: "Joueur 2", position: "Défenseur", status: "Convoqué" },
    { name: "Joueur 3", position: "Milieu", status: "Remplaçant" }
  ]
};

function loadConvoc() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeJSONParse(raw, null) : null;
  return parsed && typeof parsed === "object" ? parsed : structuredClone(defaultConvoc);
}
function saveConvoc(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let convoc = loadConvoc();

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("convo")) return `<span class="tag red">${status}</span>`;
  if (s.includes("remp")) return `<span class="tag navy">${status}</span>`;
  if (s.includes("inc")) return `<span class="tag navy">${status}</span>`;
  if (s.includes("bless")) return `<span class="tag red">${status}</span>`;
  return `<span class="tag">${status || "—"}</span>`;
}

function renderConvoc() {
  $("#matchTitle").textContent = convoc.match.title;
  $("#matchDatetime").textContent = convoc.match.datetime;
  $("#matchLocation").textContent = convoc.match.location;
  $("#rendezvous").textContent = convoc.match.rendezvous;

  $("#matchTitleInput").value = convoc.match.title;
  $("#matchDatetimeInput").value = convoc.match.datetime;
  $("#matchLocationInput").value = convoc.match.location;
  $("#rendezvousInput").value = convoc.match.rendezvous;

  const tbody = $("#convocationTable tbody");
  tbody.innerHTML = "";
  convoc.players.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.position}</td>
      <td>${statusBadge(p.status)}</td>
      <td class="right"><button class="btn small ghost" type="button" data-remove="${idx}">Retirer</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-remove"));
      convoc.players.splice(i, 1);
      saveConvoc(convoc);
      renderConvoc();
    });
  });
}

$("#saveMatchBtn")?.addEventListener("click", () => {
  convoc.match.title = $("#matchTitleInput").value.trim() || convoc.match.title;
  convoc.match.datetime = $("#matchDatetimeInput").value.trim() || convoc.match.datetime;
  convoc.match.location = $("#matchLocationInput").value.trim() || convoc.match.location;
  convoc.match.rendezvous = $("#rendezvousInput").value.trim() || convoc.match.rendezvous;
  saveConvoc(convoc);
  renderConvoc();

  // met aussi à jour le bloc "Prochain match"
  $("#nextKickoff").textContent = convoc.match.datetime;
  $("#nextLocation").textContent = convoc.match.location;
  $("#nextMeet").textContent = convoc.match.rendezvous;
});

$("#resetConvocationBtn")?.addEventListener("click", () => {
  convoc = structuredClone(defaultConvoc);
  saveConvoc(convoc);
  renderConvoc();
});

$("#printConvocationBtn")?.addEventListener("click", () => window.print());

/* Modal ajout joueur */
const playerModal = $("#playerModal");
$("#addPlayerBtn")?.addEventListener("click", () => {
  $("#playerForm")?.reset();
  playerModal?.showModal();
});
$("#closePlayerModal")?.addEventListener("click", () => playerModal?.close());
$("#playerForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const name = String(fd.get("playerName") || "").trim();
  const position = String(fd.get("playerPosition") || "").trim();
  const status = String(fd.get("playerStatus") || "").trim();
  if (!name) return;

  convoc.players.push({ name, position, status });
  saveConvoc(convoc);
  renderConvoc();
  playerModal?.close();
});

/* Auto depuis results.json */
function initConvocationFromResults(r) {
  const btn = $("#fillFromResultsBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const next = (r.matches || []).find(m => m.status === "SCHEDULED") || null;
    if (!next) return;

    convoc.match.title = `SC Morlaix (${next.team}) vs ${next.away.includes("Morlaix") ? next.home : next.away}`;
    convoc.match.datetime = `${formatDateFR(next.date)} • ${next.kickoff || "—"}`;
    convoc.match.location = next.location ? `${next.location}` : convoc.match.location;

    saveConvoc(convoc);
    renderConvoc();
  });
}

/* Contact mailto */
$("#contactForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim();
  const subject = String(fd.get("subject") || "").trim();
  const message = String(fd.get("message") || "").trim();

  // tu peux remplacer par un email officiel du club
  const to = "contact@scmorlaix.com";

  const body =
`Nom: ${name}
Email: ${email}

Message:
${message}
`;

  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

/* Init */
renderConvoc();
loadAllData();
