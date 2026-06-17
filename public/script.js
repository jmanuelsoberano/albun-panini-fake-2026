const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];

const STORE_KEY = "fan-global-2026-state-v1";
const regions = ["Norte", "Sur", "Este", "Oeste", "Centro", "Pacífico"];
const roles = ["Capitán", "Arquero", "Defensa", "Creativo", "Goleador"];
const colors = [
  ["#0f62fe", "#7dd3fc"], ["#e11d48", "#f59e0b"], ["#16a34a", "#facc15"], ["#7c3aed", "#22d3ee"],
  ["#dc2626", "#2563eb"], ["#0891b2", "#84cc16"], ["#111827", "#f97316"], ["#be123c", "#fda4af"]
];
const teamNames = [
  "Aurora FC", "Titanes del Valle", "Cóndores Azules", "Nómadas Dorados", "Lobos del Norte", "Centellas Rojas",
  "Atléticos Prisma", "Marineros del Sol", "Tormenta Verde", "Halcones Boreales", "Estrella Cobalto", "Guardianes Arena",
  "Ríos Plateados", "Dragones Lima", "Meteoros Blancos", "Pumas Índigo", "Águilas Coral", "Leones Bruma",
  "Sierra Magna", "Fénix Turquesa", "Corsarios Alba", "Rayos Zafiro", "Muralla Roja", "Truenos Naranja",
  "Quetzales Neo", "Centauros Lila", "Volcanes Jade", "Horizonte Plata", "Búhos Ámbar", "Tigres Boreal",
  "Marea Granate", "Pegasos Aqua", "Robles Titanio", "Satélites Rubí", "Glaciares Oro", "Relámpagos Gris",
  "Caimanes Violeta", "Oasis Marino", "Cósmicos Verde", "Bravos Ónix", "Delfines Solar", "Rinocerontes Azul",
  "Paladines Cobre", "Mapaches Fuego", "Gacelas Nube", "Orcas Neón", "Linces Arena", "Cometas Malva"
];
const namePool = ["Ari", "Leo", "Nico", "Ian", "Dani", "Tao", "Bruno", "Kai", "Max", "Ren", "Milo", "Alex"];
const lastPool = ["Vega", "Sol", "Ríos", "Neri", "Cruz", "Luna", "Rey", "Nova", "Paz", "Iris", "Mar", "Val"];

const teams = teamNames.map((name, i) => ({
  id: `T${String(i + 1).padStart(2, "0")}`,
  name,
  region: regions[i % regions.length],
  colors: colors[i % colors.length],
  motto: `Equipo ficticio de la región ${regions[i % regions.length]} con identidad fanmade.`
}));

const stickers = teams.flatMap((team, teamIndex) => roles.map((role, roleIndex) => {
  const n = teamIndex * roles.length + roleIndex + 1;
  const rarity = roleIndex === 0 ? "holografico" : roleIndex === 4 ? "brillante" : "base";
  return {
    id: `FG-${String(n).padStart(3, "0")}`,
    number: n,
    teamId: team.id,
    team: team.name,
    region: team.region,
    colors: team.colors,
    role,
    rarity,
    name: `${namePool[(teamIndex + roleIndex) % namePool.length]} ${lastPool[(teamIndex * 2 + roleIndex) % lastPool.length]}`,
    note: `Cromo ${rarity} de ${team.name}. Personaje completamente ficticio.`
  };
}));

const stadiums = [
  ["Estadio Aurora", "Norte", "Sede de inauguración fanmade."],
  ["Domo del Sol", "Pacífico", "Cancha luminosa para partidos especiales."],
  ["Arena Cobalto", "Centro", "Casa neutral para retos del coleccionista."],
  ["Parque Prisma", "Sur", "Sede de intercambio entre amigos."],
  ["Coloso Bruma", "Este", "Escenario de finales ficticias."],
  ["Bahía Neón", "Oeste", "Ruta visual del álbum digital."]
];

let state = loadState();
let activeView = "grid";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || { copies: {}, packsOpened: 0, theme: "dark" };
  } catch {
    return { copies: {}, packsOpened: 0, theme: "dark" };
  }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function copies(id) { return state.copies[id] || 0; }
function owned(id) { return copies(id) > 0; }
function duplicate(id) { return copies(id) > 1; }
function uniqueOwned() { return stickers.filter(s => owned(s.id)).length; }
function duplicateCount() { return Object.values(state.copies).reduce((sum, count) => sum + Math.max(0, count - 1), 0); }
function rarityLabel(r) { return r === "holografico" ? "Holo" : r === "brillante" ? "Brillante" : "Base"; }

function renderSticker(sticker, mini = false) {
  const count = copies(sticker.id);
  const missing = count === 0;
  const dup = count > 1;
  const number = sticker.number % 100 || 100;
  return `
    <article class="sticker-card ${sticker.rarity} ${missing ? "missing" : ""} ${dup ? "duplicate" : ""}" data-sticker-id="${sticker.id}" style="--team-a:${sticker.colors[0]};--team-b:${sticker.colors[1]}">
      <div class="sticker-art">
        <span class="sticker-code">${sticker.id}</span>
        <span class="rarity-badge">${rarityLabel(sticker.rarity)}</span>
        <div class="jersey">${number}</div>
      </div>
      <div class="sticker-body">
        <div class="sticker-name">${missing ? "Cromo faltante" : sticker.name}</div>
        <div class="sticker-meta">${sticker.team} · ${sticker.role}</div>
        <div class="sticker-footer">
          <span class="pill ${missing ? "" : dup ? "green" : "gold"}">${missing ? "Falta" : dup ? `x${count}` : "Pegado"}</span>
          ${mini ? "" : "<button class='card-action' type='button' aria-label='Ver detalle'>↗</button>"}
        </div>
      </div>
    </article>`;
}

function stickerMatches(sticker) {
  const query = $("#searchInput").value.trim().toLowerCase();
  const region = $("#regionFilter").value;
  const status = $("#statusFilter").value;
  const rarity = $("#rarityFilter").value;
  const text = `${sticker.id} ${sticker.name} ${sticker.team} ${sticker.role} ${sticker.region} ${sticker.rarity}`.toLowerCase();
  if (query && !text.includes(query)) return false;
  if (region !== "all" && sticker.region !== region) return false;
  if (rarity !== "all" && sticker.rarity !== rarity) return false;
  if (status === "owned" && !owned(sticker.id)) return false;
  if (status === "missing" && owned(sticker.id)) return false;
  if (status === "duplicate" && !duplicate(sticker.id)) return false;
  return true;
}

function renderCollection() {
  const filtered = stickers.filter(stickerMatches);
  $("#resultCount").textContent = `Mostrando ${filtered.length} cromos`;
  $("#stickerGrid").innerHTML = filtered.map(s => renderSticker(s)).join("");
  renderTeamPages();
}

function renderTeamPages() {
  $("#teamPages").innerHTML = teams.map(team => {
    const list = stickers.filter(s => s.teamId === team.id);
    const got = list.filter(s => owned(s.id)).length;
    const pct = Math.round((got / list.length) * 100);
    return `
      <article class="team-page" style="--team-a:${team.colors[0]};--team-b:${team.colors[1]}">
        <header class="team-page-header">
          <div class="team-page-title"><span class="mini-emblem">${team.id}</span><div><strong>${team.name}</strong><small>${team.region} · ${got}/${list.length} cromos</small></div></div>
          <strong>${pct}%</strong>
        </header>
        <div class="team-stickers">${list.map(s => renderSticker(s, true)).join("")}</div>
      </article>`;
  }).join("");
}

function renderTeamsBoard() {
  $("#teamsBoard").innerHTML = teams.map(team => {
    const list = stickers.filter(s => s.teamId === team.id);
    const got = list.filter(s => owned(s.id)).length;
    const pct = Math.round((got / list.length) * 100);
    return `
      <article class="team-card" style="--team-a:${team.colors[0]};--team-b:${team.colors[1]}">
        <div class="team-card-top"><h3>${team.name}</h3><span class="mini-emblem">${team.id}</span></div>
        <div class="team-card-body"><strong>${team.region}</strong><p>${team.motto}</p><div class="team-mini-progress"><div class="progress-track"><div style="width:${pct}%"></div></div></div></div>
      </article>`;
  }).join("");
}

function renderStadiums() {
  $("#stadiumRoute").innerHTML = stadiums.map(([name, zone, text]) => `<article class="stadium-card"><strong>${name}</strong><span>${zone}</span><p>${text}</p></article>`).join("");
}

function renderStats() {
  const got = uniqueOwned();
  const pct = Math.round((got / stickers.length) * 100);
  $("#statCollected").textContent = got;
  $("#statTotal").textContent = stickers.length;
  $("#statPercent").textContent = `${pct}%`;
  $("#statDuplicates").textContent = duplicateCount();
  $("#progressLabel").textContent = `${pct}%`;
  $("#progressBar").style.width = `${pct}%`;
  renderChallenges(got, pct);
}

function renderChallenges(got, pct) {
  const holo = stickers.filter(s => s.rarity === "holografico" && owned(s.id)).length;
  const fullTeam = teams.some(t => stickers.filter(s => s.teamId === t.id).every(s => owned(s.id)));
  updateChallenge("firstPack", state.packsOpened >= 1, `${Math.min(state.packsOpened, 1)}/1`);
  updateChallenge("tenPercent", pct >= 10, `${Math.min(pct, 10)}/10%`);
  updateChallenge("holoHunter", holo >= 5, `${Math.min(holo, 5)}/5`);
  updateChallenge("fullTeam", fullTeam, `${fullTeam ? 1 : 0}/1`);
}
function updateChallenge(key, complete, text) {
  const card = $(`.challenge-card[data-challenge="${key}"]`);
  if (!card) return;
  card.classList.toggle("complete", complete);
  $("strong", card).textContent = text;
}

function randomSticker() {
  const roll = Math.random();
  let pool = stickers.filter(s => s.rarity === (roll < 0.05 ? "holografico" : roll < 0.3 ? "brillante" : "base"));
  if (!pool.length) pool = stickers;
  return pool[Math.floor(Math.random() * pool.length)];
}
function openPack() {
  const pack = Array.from({ length: 5 }, randomSticker);
  pack.forEach(s => state.copies[s.id] = copies(s.id) + 1);
  state.packsOpened += 1;
  saveState();
  $("#packCards").innerHTML = pack.map(s => renderSticker(s)).join("");
  $("#packModal").classList.add("show");
  $("#packModal").setAttribute("aria-hidden", "false");
  toast("Sobre abierto. Las repetidas se guardaron para futuros cambios.");
  refresh();
}
function addRandom(count = 10) {
  Array.from({ length: count }, randomSticker).forEach(s => state.copies[s.id] = copies(s.id) + 1);
  saveState();
  toast(`${count} cromos pegados para prueba local.`);
  refresh();
}
function resetAlbum() {
  if (!confirm("¿Reiniciar tu progreso local?")) return;
  state = { copies: {}, packsOpened: 0, theme: state.theme || "dark" };
  saveState();
  refresh();
  toast("Progreso local reiniciado.");
}

function showDetail(id) {
  const sticker = stickers.find(s => s.id === id);
  if (!sticker) return;
  const count = copies(id);
  $("#detailContent").innerHTML = `
    <div class="detail-hero">
      ${renderSticker(sticker, true)}
      <div class="detail-copy">
        <p class="eyebrow">Detalle del cromo</p>
        <h2 id="detailTitle">${sticker.name}</h2>
        <p>${sticker.note}</p>
        <div class="detail-list">
          <div><small>Código</small><strong>${sticker.id}</strong></div>
          <div><small>Equipo</small><strong>${sticker.team}</strong></div>
          <div><small>Rareza</small><strong>${rarityLabel(sticker.rarity)}</strong></div>
          <div><small>Copias</small><strong>${count}</strong></div>
        </div>
      </div>
    </div>`;
  $("#detailModal").classList.add("show");
  $("#detailModal").setAttribute("aria-hidden", "false");
}
function closeModal(kind) {
  const modal = kind === "detail" ? $("#detailModal") : $("#packModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2400);
}
function switchView(view) {
  activeView = view;
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === view));
  $("#stickerGrid").classList.toggle("hidden", view !== "grid");
  $("#teamPages").classList.toggle("hidden", view !== "teams");
}
function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
  $("#themeToggle").textContent = theme === "light" ? "☀" : "☾";
  saveState();
}
function refresh() {
  renderStats();
  renderCollection();
  renderTeamsBoard();
}
function initFilters() {
  $("#regionFilter").insertAdjacentHTML("beforeend", regions.map(r => `<option value="${r}">${r}</option>`).join(""));
  ["#searchInput", "#regionFilter", "#statusFilter", "#rarityFilter"].forEach(id => $(id).addEventListener("input", renderCollection));
}
function bindEvents() {
  ["#openPackHero", "#openPackTop", "#openAnotherPack"].forEach(id => $(id)?.addEventListener("click", openPack));
  $("#addRandom")?.addEventListener("click", () => addRandom(10));
  $("#resetAlbum")?.addEventListener("click", resetAlbum);
  $("#themeToggle")?.addEventListener("click", () => setTheme(state.theme === "light" ? "dark" : "light"));
  $$("[data-close]").forEach(el => el.addEventListener("click", () => closeModal(el.dataset.close)));
  $$(".tab").forEach(tab => tab.addEventListener("click", () => switchView(tab.dataset.view)));
  document.addEventListener("click", e => {
    const card = e.target.closest(".sticker-card[data-sticker-id]");
    if (card && !e.target.closest(".modal-actions")) showDetail(card.dataset.stickerId);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal("pack"); closeModal("detail"); } });
}

initFilters();
bindEvents();
setTheme(state.theme || "dark");
renderStadiums();
refresh();
switchView(activeView);
