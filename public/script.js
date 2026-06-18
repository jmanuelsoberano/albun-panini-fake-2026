import {
  canUseGuestSignIn,
  isFirebaseConfigured,
  shouldUseCloudFunctions,
  listenToSession,
  signInGuest,
  signInWithGoogle,
  listenToInventory,
  listenToUserProfile,
  claimStarterPack,
  claimStarterPackInFirestore,
  openPack as openPackFromFirebase,
  openPackInFirestore
} from "./firebase-client.js";
import {
  fullSquads,
  squadHighlights,
  tournamentStadiums,
  tournamentTeams
} from "./content/worldcup-facts.js";

const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];

const STORE_KEY = "fan-global-2026-state-v1";
const PRIVATE_CONTENT_URL = "content/private-content.json";
let albumContent = {
  title: "Álbum Mundial 2026",
  subtitle: "Datos reales del torneo",
  heroLabel: "Edicion Mundial 2026",
  heroTitle: "Álbum digital del Mundial 2026.",
  heroText: "Colecciona cromos con nombres, selecciones, plantillas y sedes reales en una experiencia interactiva."
};
const roles = ["Referente", "Portero", "Defensa", "Mediocampo", "Delantero"];

const teams = tournamentTeams.map(team => ({
  id: team.id,
  name: team.name,
  code: team.code,
  shortName: team.code,
  confederation: team.confederation,
  group: team.confederation,
  colors: team.colors,
  motto: "Datos reales del torneo 2026. La tarjeta no usa escudo, logo, mascota ni uniforme protegido."
}));
const confederations = [...new Set(teams.map(team => team.confederation))];
const EXPECTED_SQUAD_SIZE = 26;
const SQUAD_SOURCE_URL = "https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf";
const SQUAD_ARTICLE_URL = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/fifa-world-cup-2026-squads-confirmed";

const stickers = teams.flatMap((team, teamIndex) => roles.map((role, roleIndex) => {
  const n = teamIndex * roles.length + roleIndex + 1;
  const rarity = roleIndex === 0 ? "holografico" : roleIndex === 4 ? "brillante" : "base";
  const player = squadHighlights[team.id]?.[roleIndex] || {};
  return {
    id: `FG-${String(n).padStart(3, "0")}`,
    number: n,
    teamId: team.id,
    team: team.name,
    confederation: team.confederation,
    colors: team.colors,
    role: player.role || role,
    rarity,
    name: player.name || `Jugador ${team.code}-${roleIndex + 1}`,
    position: player.position || "",
    shirt: player.shirt || "",
    birthplace: team.name,
    height: player.height || "",
    portrait: "",
    privateSlot: `private-assets/players/fg-${String(n).padStart(3, "0")}.webp`,
    caption: `Ficha ${String(n).padStart(3, "0")} lista para retrato privado local.`,
    note: `Cromo ${rarity} de ${team.name}. Nombre real de plantilla publica; sin foto, escudo, logo ni arte protegido.`
  };
}));

const stadiums = tournamentStadiums;

async function loadPrivateContent() {
  const host = window.location.hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) return;

  try {
    const head = await fetch(PRIVATE_CONTENT_URL, { method: "HEAD" });
    if (!head.ok) return;
    const response = await fetch(PRIVATE_CONTENT_URL);
    if (!response.ok) return;
    const content = await response.json();
    mergePrivateContent(content);
  } catch {
    // Private content is optional and intentionally local-only.
  }
}

function mergePrivateContent(content) {
  albumContent = { ...albumContent, ...(content.album || {}) };

  Object.entries(content.teams || {}).forEach(([teamId, patch]) => {
    const team = teams.find(item => item.id === teamId);
    if (!team) return;
    Object.assign(team, patch);
  });

  Object.entries(content.stickers || {}).forEach(([stickerId, patch]) => {
    const sticker = stickers.find(item => item.id === stickerId);
    if (!sticker) return;
    Object.assign(sticker, patch);
  });
}

let localState = loadState();
let state = { ...localState, copies: { ...localState.copies } };
let activeView = "grid";
let firebaseConfigured = false;
let guestSignInAllowed = false;
let cloudFunctionsEnabled = false;
let onlineMode = false;
let currentUser = null;
let onlineProfile = null;
let sessionBusy = false;
let sessionUnsubscribe = null;
let profileUnsubscribe = null;
let inventoryUnsubscribe = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return {
      copies: saved?.copies || {},
      packsOpened: saved?.packsOpened || 0,
      theme: saved?.theme || "dark"
    };
  } catch {
    return { copies: {}, packsOpened: 0, theme: "dark" };
  }
}
function saveState() {
  if (onlineMode) {
    localState = { ...localState, theme: state.theme || localState.theme || "dark" };
  } else {
    localState = {
      copies: { ...state.copies },
      packsOpened: state.packsOpened || 0,
      theme: state.theme || "dark"
    };
  }

  localStorage.setItem(STORE_KEY, JSON.stringify(localState));
}
function restoreLocalState() {
  state = {
    copies: { ...localState.copies },
    packsOpened: localState.packsOpened || 0,
    theme: state.theme || localState.theme || "dark"
  };
}
function copies(id) { return state.copies[id] || 0; }
function owned(id) { return copies(id) > 0; }
function duplicate(id) { return copies(id) > 1; }
function uniqueOwned() { return stickers.filter(s => owned(s.id)).length; }
function duplicateCount() { return Object.values(state.copies).reduce((sum, count) => sum + Math.max(0, count - 1), 0); }
function rarityLabel(r) { return r === "holografico" ? "Holo" : r === "brillante" ? "Brillante" : "Base"; }
function initials(name) {
  return String(name || "FG").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}
function renderPortrait(sticker) {
  if (sticker.portrait) {
    return `<img class="player-photo" src="${sticker.portrait}" alt="Retrato de ${sticker.name}" loading="lazy" />`;
  }

  return `
    <div class="player-photo placeholder-photo" aria-label="Espacio para foto privada">
      <strong>${initials(sticker.name)}</strong>
      <span>${sticker.privateSlot}</span>
    </div>`;
}

function renderSticker(sticker, mini = false, countOverride = null) {
  const count = countOverride ?? copies(sticker.id);
  const missing = count === 0;
  const dup = count > 1;
  const number = sticker.number % 100 || 100;
  return `
    <article class="sticker-card ${sticker.rarity} ${missing ? "missing" : ""} ${dup ? "duplicate" : ""}" data-sticker-id="${sticker.id}" style="--team-a:${sticker.colors[0]};--team-b:${sticker.colors[1]}">
      <div class="sticker-art">
        <span class="sticker-code">${sticker.id}</span>
        <span class="rarity-badge">${rarityLabel(sticker.rarity)}</span>
        ${renderPortrait(sticker)}
        <div class="sticker-number">${number}</div>
      </div>
      <div class="sticker-body">
        <div class="sticker-name">${sticker.name}</div>
        <div class="sticker-meta">${sticker.team} · ${sticker.role}${sticker.shirt ? ` #${sticker.shirt}` : ""}</div>
        <div class="sticker-footer">
          <span class="pill ${missing ? "" : dup ? "green" : "gold"}">${missing ? "Falta" : dup ? `x${count}` : "Pegado"}</span>
          ${mini ? "" : "<button class='card-action' type='button' aria-label='Ver detalle'>↗</button>"}
        </div>
      </div>
    </article>`;
}

function stickerMatches(sticker) {
  const query = $("#searchInput").value.trim().toLowerCase();
  const confederation = $("#regionFilter").value;
  const status = $("#statusFilter").value;
  const rarity = $("#rarityFilter").value;
  const text = `${sticker.id} ${sticker.name} ${sticker.team} ${sticker.role} ${sticker.position} ${sticker.shirt} ${sticker.confederation} ${sticker.rarity}`.toLowerCase();
  if (query && !text.includes(query)) return false;
  if (confederation !== "all" && sticker.confederation !== confederation) return false;
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
          <div class="team-page-title"><span class="mini-emblem">${team.code || team.id}</span><div><strong>${team.name}</strong><small>${team.confederation} · ${got}/${list.length} cromos</small></div></div>
          <strong>${pct}%</strong>
        </header>
        <div class="team-stickers">${list.map(s => renderSticker(s, true)).join("")}</div>
      </article>`;
  }).join("");
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-US");
}

function getSquadTotals() {
  const squadLists = Object.values(fullSquads);
  return {
    teams: teams.length,
    players: squadLists.reduce((sum, roster) => sum + roster.length, 0),
    expectedPerTeam: EXPECTED_SQUAD_SIZE
  };
}

function renderSquadSummary() {
  const totals = getSquadTotals();
  $("#squadTeamTotal").textContent = formatNumber(totals.teams);
  $("#squadPlayerTotal").textContent = formatNumber(totals.players);
  $("#squadPerTeam").textContent = formatNumber(totals.expectedPerTeam);
  $("#squadSourceLink").href = SQUAD_SOURCE_URL;
  $("#squadArticleLink").href = SQUAD_ARTICLE_URL;
}

function renderTeamsBoard() {
  renderSquadSummary();
  $("#teamsBoard").innerHTML = teams.map(team => {
    const list = stickers.filter(s => s.teamId === team.id);
    const fullRoster = fullSquads[team.id] || [];
    const got = list.filter(s => owned(s.id)).length;
    const pct = Math.round((got / list.length) * 100);
    const rosterComplete = fullRoster.length === EXPECTED_SQUAD_SIZE;
    const roster = fullRoster.map(player => `
      <li>
        <span>${player.shirt || "--"}</span>
        <strong>${player.name}</strong>
        <small>${player.position || player.role}${player.club ? ` · ${player.club}` : ""}</small>
      </li>`).join("");
    return `
      <article class="team-card" style="--team-a:${team.colors[0]};--team-b:${team.colors[1]}">
        <div class="team-card-top"><h3>${team.name}</h3><span class="mini-emblem">${team.code || team.id}</span></div>
        <div class="team-card-body">
          <div class="team-roster-summary ${rosterComplete ? "complete" : "incomplete"}">
            <strong>${team.confederation}</strong>
            <span>${fullRoster.length}/${EXPECTED_SQUAD_SIZE} jugadores</span>
          </div>
          <div class="team-player-total" aria-label="Total de jugadores registrados para ${team.name}">
            <span>${formatNumber(fullRoster.length)}</span>
            <div>
              <strong>jugadores totales</strong>
              <small>Plantilla oficial FIFA: ${fullRoster.length}/${EXPECTED_SQUAD_SIZE}</small>
            </div>
          </div>
          <p>${team.motto}</p>
          <ol class="team-roster" aria-label="Jugadores de ${team.name}">${roster}</ol>
          <div class="team-mini-progress"><div class="progress-track"><div style="width:${pct}%"></div></div></div>
        </div>
      </article>`;
  }).join("");
}

function renderStadiums() {
  $("#stadiumRoute").innerHTML = stadiums.map(([name, zone, text]) => `<article class="stadium-card"><strong>${name}</strong><span>${zone}</span><p>${text}</p></article>`).join("");
}

function applyAlbumContent() {
  $(".brand strong").textContent = albumContent.title;
  $(".brand small").textContent = albumContent.subtitle;
  $(".hero-copy .eyebrow").textContent = albumContent.heroLabel;
  $(".hero-copy h1").textContent = albumContent.heroTitle;
  $(".hero-text").textContent = albumContent.heroText;
  $(".cover-title span").textContent = albumContent.title.replace(/^Á?lbum\s+/i, "").split(" ").slice(0, 2).join(" ");
  $(".cover-meta").textContent = albumContent.subtitle;
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

function randomUniquePack(size = 5) {
  const selected = new Map();
  while (selected.size < size) {
    const sticker = randomSticker();
    selected.set(sticker.id, sticker);
  }
  return [...selected.values()];
}

function stickerFromPackItem(item) {
  const id = typeof item === "string" ? item : item?.id;
  const localSticker = stickers.find(s => s.id === id);
  if (!item || typeof item === "string") return localSticker || null;
  return { ...localSticker, ...item };
}

function showPackModal(pack, countOverride = null) {
  $("#packCards").innerHTML = pack.map(s => renderSticker(s, false, countOverride)).join("");
  $("#packModal").classList.add("show");
  $("#packModal").setAttribute("aria-hidden", "false");
}

function firebaseErrorMessage(error) {
  const code = error?.code || "";
  const messages = {
    "auth/admin-restricted-operation": "Este método de inicio de sesión no está habilitado.",
    "auth/cancelled-popup-request": "Ya hay una ventana de inicio de sesión abierta.",
    "auth/network-request-failed": "No se pudo conectar con el servicio. Revisa tu conexion.",
    "auth/operation-not-allowed": "Este proveedor de inicio de sesión no está habilitado.",
    "auth/popup-blocked": "El navegador bloqueo la ventana de Google. Permite popups para esta app.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de completar el inicio de sesión.",
    "auth/unauthorized-domain": "Este dominio no está autorizado para iniciar sesión.",
    "functions/already-exists": "Esta recompensa ya fue reclamada.",
    "functions/failed-precondition": "La accion no se puede completar todavia.",
    "functions/not-found": "No se encontro el recurso solicitado.",
    "functions/permission-denied": "No tienes permiso para realizar esta accion.",
    "functions/unauthenticated": "Inicia sesión para continuar.",
    "functions/unavailable": "El servicio no esta disponible por ahora."
  };

  if (messages[code]) return messages[code];

  const cleanMessage = String(error?.message || "")
    .replace(/^Firebase(Error)?:\s*/i, "")
    .replace(/\s*\([^)]*\)\.?$/i, "")
    .trim();

  return cleanMessage || "No se pudo completar la accion.";
}

function openLocalPack() {
  const pack = Array.from({ length: 5 }, randomSticker);
  pack.forEach(s => state.copies[s.id] = copies(s.id) + 1);
  state.packsOpened += 1;
  saveState();
  showPackModal(pack);
  toast("Sobre abierto. Las repetidas se guardaron para futuros cambios.");
  refresh();
}

async function openPack() {
  if (!onlineMode || !currentUser) {
    toast("Inicia sesión con Google para abrir sobres.");
    return;
  }

  if ((onlineProfile?.packsAvailable || 0) <= 0) {
    toast("No tienes sobres disponibles. Reclama el inicial para jugar.");
    return;
  }

  sessionBusy = true;
  updateSessionPanel();

  try {
    const result = cloudFunctionsEnabled
      ? await openPackFromFirebase("normal")
      : await openPackInFirestore(randomUniquePack(5), "normal");
    const sourcePack = result.data?.stickers || result.stickers || [];
    const pack = sourcePack.map(stickerFromPackItem).filter(Boolean);
    showPackModal(pack, 1);
    toast(cloudFunctionsEnabled
      ? "Sobre abierto desde Cloud Functions."
      : "Sobre abierto en modo Spark controlado.");
  } catch (error) {
    toast(firebaseErrorMessage(error));
  } finally {
    sessionBusy = false;
    updateSessionPanel();
  }
}

function addRandom(count = 10) {
  if (onlineMode) {
    toast("Herramienta de prueba no disponible con sesión activa.");
    return;
  }

  Array.from({ length: count }, randomSticker).forEach(s => state.copies[s.id] = copies(s.id) + 1);
  saveState();
  toast(`${count} cromos pegados para prueba.`);
  refresh();
}
function resetAlbum() {
  if (onlineMode) {
    toast("El inventario se administra desde tu cuenta.");
    return;
  }

  if (!confirm("¿Reiniciar tu progreso de prueba?")) return;
  state = { copies: {}, packsOpened: 0, theme: state.theme || "dark" };
  saveState();
  refresh();
  toast("Progreso de prueba reiniciado.");
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
          <div><small>Posición</small><strong>${sticker.position || sticker.role}</strong></div>
          <div><small>Número</small><strong>${sticker.shirt || "N/D"}</strong></div>
          <div><small>Rareza</small><strong>${rarityLabel(sticker.rarity)}</strong></div>
          <div><small>Copias</small><strong>${count}</strong></div>
          <div><small>Altura</small><strong>${sticker.height || "N/D"}</strong></div>
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
function cleanupRealtimeListeners() {
  [profileUnsubscribe, inventoryUnsubscribe].forEach((unsubscribe) => {
    if (typeof unsubscribe === "function") unsubscribe();
  });
  profileUnsubscribe = null;
  inventoryUnsubscribe = null;
}
function updateSessionPanel() {
  const mode = $("#sessionMode");
  const message = $("#sessionMessage");
  const nickname = $("#nicknameInput");
  const coins = $("#sessionCoins");
  const packs = $("#sessionPacks");
  const googleLogin = $("#googleLogin");
  const login = $("#guestLogin");
  const starter = $("#claimStarterPack");

  if (!mode || !message || !nickname || !coins || !packs || !googleLogin || !login || !starter) return;

  const availablePacks = onlineProfile?.packsAvailable || 0;
  mode.textContent = onlineMode
    ? "Jugador activo"
    : "Solo lectura";
  mode.classList.toggle("online", onlineMode);
  message.textContent = onlineMode
    ? cloudFunctionsEnabled
      ? "Tu progreso esta guardado en tu cuenta."
      : "Tu progreso esta guardado en tu cuenta."
    : firebaseConfigured
      ? "Entra con Google para guardar tu álbum online."
      : "El inicio de sesión se activará cuando la app esté conectada.";

  if (onlineMode && onlineProfile?.nickname && document.activeElement !== nickname) {
    nickname.value = onlineProfile.nickname;
  }

  nickname.disabled = onlineMode || sessionBusy;
  coins.textContent = onlineMode ? String(onlineProfile?.coins || 0) : "0";
  packs.textContent = onlineMode ? String(availablePacks) : "0";

  googleLogin.disabled = sessionBusy || onlineMode || !firebaseConfigured;
  googleLogin.textContent = onlineMode ? "Sesión iniciada" : "Entrar con Google";

  login.hidden = true;
  login.disabled = sessionBusy || onlineMode || !firebaseConfigured || !guestSignInAllowed;
  login.textContent = "Acceso de prueba";

  starter.disabled = sessionBusy || !onlineMode || !onlineProfile || Boolean(onlineProfile.starterPackClaimed);
  starter.textContent = onlineProfile?.starterPackClaimed ? "Sobre inicial reclamado" : "Reclamar sobre inicial";

  ["#openPackHero", "#openPackTop", "#openAnotherPack"].forEach((id) => {
    const button = $(id);
    if (!button) return;
    button.disabled = sessionBusy || (onlineMode && availablePacks <= 0);
  });

  $("#addRandom")?.classList.toggle("hidden", onlineMode);
  $("#resetAlbum")?.classList.toggle("hidden", onlineMode);
}
async function handleSessionChange(user) {
  cleanupRealtimeListeners();
  currentUser = user;
  onlineProfile = null;

  if (!user) {
    onlineMode = false;
    restoreLocalState();
    refresh();
    return;
  }

  onlineMode = true;
  state = { copies: {}, packsOpened: 0, theme: state.theme || localState.theme || "dark" };
  updateSessionPanel();

  profileUnsubscribe = await listenToUserProfile(user.uid, (profile) => {
    onlineProfile = profile;
    state.packsOpened = profile?.packsOpened || 0;
    refresh();
  }, (error) => toast(firebaseErrorMessage(error)));

  inventoryUnsubscribe = await listenToInventory(user.uid, (copiesMap) => {
    state.copies = copiesMap;
    refresh();
  }, (error) => toast(firebaseErrorMessage(error)));
}
async function startFirebaseSession() {
  firebaseConfigured = await isFirebaseConfigured();
  guestSignInAllowed = await canUseGuestSignIn();
  cloudFunctionsEnabled = await shouldUseCloudFunctions();
  updateSessionPanel();

  if (!firebaseConfigured) return;

  try {
    sessionUnsubscribe = await listenToSession(handleSessionChange);
  } catch (error) {
    firebaseConfigured = false;
    toast(firebaseErrorMessage(error));
    updateSessionPanel();
  }
}
async function handleGoogleLogin() {
  if (!firebaseConfigured) {
    toast("El inicio de sesión todavía no está disponible.");
    return;
  }

  sessionBusy = true;
  updateSessionPanel();

  try {
    await signInWithGoogle($("#nicknameInput").value);
    toast("Sesión iniciada con Google.");
  } catch (error) {
    toast(firebaseErrorMessage(error));
  } finally {
    sessionBusy = false;
    updateSessionPanel();
  }
}
async function handleGuestLogin() {
  if (!firebaseConfigured) {
    toast("El acceso de prueba no esta disponible.");
    return;
  }

  if (!guestSignInAllowed) {
    toast("El acceso de prueba no esta disponible.");
    return;
  }

  sessionBusy = true;
  updateSessionPanel();

  try {
    await signInGuest($("#nicknameInput").value);
    toast("Sesión invitada iniciada.");
  } catch (error) {
    toast(firebaseErrorMessage(error));
  } finally {
    sessionBusy = false;
    updateSessionPanel();
  }
}
async function handleClaimStarterPack() {
  if (!onlineMode || !currentUser) {
    toast("Entra como invitado para reclamar el sobre inicial.");
    return;
  }

  sessionBusy = true;
  updateSessionPanel();

  try {
    if (cloudFunctionsEnabled) {
      await claimStarterPack();
    } else {
      await claimStarterPackInFirestore();
    }
    toast(cloudFunctionsEnabled
      ? "Sobre inicial reclamado desde Cloud Functions."
      : "Sobre inicial reclamado en modo Spark controlado.");
  } catch (error) {
    toast(firebaseErrorMessage(error));
  } finally {
    sessionBusy = false;
    updateSessionPanel();
  }
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
  updateSessionPanel();
}
function initFilters() {
  $("#regionFilter").insertAdjacentHTML("beforeend", confederations.map(name => `<option value="${name}">${name}</option>`).join(""));
  ["#searchInput", "#regionFilter", "#statusFilter", "#rarityFilter"].forEach(id => $(id).addEventListener("input", renderCollection));
}
function bindEvents() {
  ["#openPackHero", "#openPackTop", "#openAnotherPack"].forEach(id => $(id)?.addEventListener("click", openPack));
  $("#googleLogin")?.addEventListener("click", handleGoogleLogin);
  $("#guestLogin")?.addEventListener("click", handleGuestLogin);
  $("#claimStarterPack")?.addEventListener("click", handleClaimStarterPack);
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

async function boot() {
  await loadPrivateContent();
  initFilters();
  bindEvents();
  setTheme(state.theme || "dark");
  applyAlbumContent();
  renderStadiums();
  refresh();
  switchView(activeView);
  startFirebaseSession();
}

boot();
