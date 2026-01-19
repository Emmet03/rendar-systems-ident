/* admin.js */

const API_PATH = "http://localhost:3000";

const output = document.getElementById("output");
const logBox = document.getElementById("log");

const el = {
  // main ident form
  identSelect: document.getElementById("ident-select"),
  id: document.getElementById("id"),
  name: document.getElementById("name"),
  species: document.getElementById("species"),
  age: document.getElementById("age"),
  homeWorld: document.getElementById("homeWorld"),
  occupation: document.getElementById("occupation"),
  dangerLevel: document.getElementById("dangerLevel"),
  description: document.getElementById("description"),
  balance: document.getElementById("balance"),

  // other sections
  allUsers: document.getElementById("all-users"),

  impSelect: document.getElementById("imp-select"),
  impId: document.getElementById("imp-id"),
  impDanger: document.getElementById("imp-danger"),

  buySelect: document.getElementById("buy-select"),
  buyId: document.getElementById("buy-id"),
  buyItem: document.getElementById("buy-item"),
  buyAmount: document.getElementById("buy-amount"),
  buyNote: document.getElementById("buy-note"),

  logSelect: document.getElementById("log-select"),
  logId: document.getElementById("log-id"),
};

let identsCache = [];            // array of idents
let identsById = new Map();      // id -> ident

function init() {
  console.log("API_PATH:", API_PATH);
}

/* =========================
   Kleine Helpers
========================= */

function show(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

function trimOrEmpty(v) {
  return String(v ?? "").trim();
}

// Für Felder, die im Backend als Integer validiert werden:
// - "" => null (damit du nicht aus leerem Feld 0 machst)
// - "12" => 12
function intOrNull(v) {
  const s = trimOrEmpty(v);
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Number.isInteger(n) ? n : null;
}

async function readResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    // non-json response
  }
  return { text, data };
}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  const { text, data } = await readResponse(res);

  if (!res.ok) {
    // sehr hilfreich zum Debuggen:
    const err = {
      ok: false,
      httpStatus: res.status,
      url,
      method: options?.method ?? "GET",
      response: data ?? text,
    };
    return err;
  }
  return data ?? { ok: true };
}

/* =========================
   Laden + Cachen
========================= */

async function loadAllAndCache() {
  const data = await requestJson(`${API_PATH}/api/admin/idents`, {
    method: "GET",
  });

  if (!data.ok) {
    el.allUsers.textContent = JSON.stringify(data, null, 2);
    show(data);
    return;
  }

  // Route liefert: { ok: true, idents }
  identsCache = Array.isArray(data.idents) ? data.idents : [];
  identsById = new Map(identsCache.map((i) => [String(i.id), i]));

  el.allUsers.textContent = JSON.stringify(identsCache, null, 2);

  populateIdentDropdowns();
}

/* =========================
   Dropdowns
========================= */

function populateIdentDropdowns() {
  populateMainIdentDropdown();
  wireIdDropdown(el.impSelect, el.impId);
  wireIdDropdown(el.buySelect, el.buyId);
  wireIdDropdown(el.logSelect, el.logId);
}

function populateMainIdentDropdown() {
  el.identSelect.innerHTML = `<option value="">— bitte wählen —</option>`;

  const sorted = [...identsCache].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
  );

  for (const ident of sorted) {
    const opt = document.createElement("option");
    opt.value = String(ident.id ?? "");
    opt.textContent = `${ident.name ?? "(kein Name)"} – ${ident.id}`;
    el.identSelect.appendChild(opt);
  }

  el.identSelect.onchange = async () => {
    const chosenId = el.identSelect.value;
    if (!chosenId) {
      clearIdentForm();
      el.id.disabled = false;
      return;
    }

    // Optional: frische Daten vom Server ziehen (damit Cache nicht stale ist)
    const data = await requestJson(`${API_PATH}/api/idents/${encodeURIComponent(chosenId)}`, {
      method: "GET",
    });

    if (!data.ok) {
      show(data);
      return;
    }

    const ident = data.ident;
    if (ident) {
      identsById.set(String(ident.id), ident);
      const idx = identsCache.findIndex((i) => String(i.id) === String(ident.id));
      if (idx >= 0) identsCache[idx] = ident;
      else identsCache.push(ident);

      fillIdentForm(ident);
      el.id.disabled = true;
    }
  };
}

function wireIdDropdown(selectEl, targetInputEl) {
  selectEl.innerHTML = `<option value="">— bitte wählen —</option>`;

  for (const ident of identsCache) {
    const opt = document.createElement("option");
    opt.value = String(ident.id ?? "");
    opt.textContent = `${ident.name ?? "(kein Name)"} – ${ident.id}`;
    selectEl.appendChild(opt);
  }

  selectEl.onchange = () => {
    targetInputEl.value = selectEl.value;
  };
}

/* =========================
   Formular (Autofill / Clear)
========================= */

function clearIdentForm() {
  el.id.value = "";
  el.name.value = "";
  el.species.value = "";
  el.age.value = "";
  el.homeWorld.value = "";
  el.occupation.value = "";
  el.dangerLevel.value = "";
  el.description.value = "";
  el.balance.value = "";
}

function fillIdentForm(ident) {
  el.id.value = ident.id ?? "";
  el.name.value = ident.name ?? "";
  el.species.value = ident.species ?? "";
  el.age.value = ident.age ?? "";
  el.homeWorld.value = ident.homeWorld ?? "";
  el.occupation.value = ident.occupation ?? "";
  el.dangerLevel.value = ident.dangerLevel ?? "";
  el.description.value = ident.description ?? "";

  // Achtung: je nach Modell heißt das Feld evtl. anders.
  // Ich unterstütze mehrere Varianten:
  el.balance.value =
    ident.bankAccountBalance ??
    ident.BankAccountBalance ??
    ident.balance ??
    "";
}

/* =========================
   API Calls
========================= */

// Admin-Upsert: PUT /api/admin/ident
// Erwartung: upsertIdentAdmin(req.body)
async function saveIdent() {
  // Wichtig: deine Backend-Validierung (vermutlich) erwartet Integers für age/danger/balance.
  // Wenn Feld leer ist: null senden, nicht 0.
  const body = {
    id: trimOrEmpty(el.id.value),
    name: trimOrEmpty(el.name.value),
    species: trimOrEmpty(el.species.value),
    age: intOrNull(el.age.value),
    homeWorld: trimOrEmpty(el.homeWorld.value),
    occupation: trimOrEmpty(el.occupation.value),
    dangerLevel: intOrNull(el.dangerLevel.value),

    description: trimOrEmpty(el.description.value),

    // Hier musst du ggf. anpassen, wie dein Ident-Modell das Feld wirklich nennt.
    // Da dein Frontend vorher "BankAccountBalance" genutzt hat, lasse ich es drin.
    // Wenn dein Backend "bankAccountBalance" erwartet, einfach umbenennen.
    BankAccountBalance: intOrNull(el.balance.value),
  };

  if (!body.id) {
    show({ ok: false, error: "ID fehlt" });
    return;
  }

  const data = await requestJson(`${API_PATH}/api/admin/ident`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  show(data);

  if (!data.ok) return;

  // upsertIdentAdmin könnte { ok:true, ident } zurückgeben – oder was auch immer du im Controller machst.
  // Wir versuchen es robust:
  const saved = data.ident ?? data.updatedIdent ?? data.createdIdent ?? null;

  // Wenn Backend keinen Ident zurückgibt, holen wir ihn danach frisch:
  const savedId = saved?.id ?? body.id;

  const fresh = await requestJson(`${API_PATH}/api/idents/${encodeURIComponent(savedId)}`, {
    method: "GET",
  });

  if (fresh.ok && fresh.ident) {
    const ident = fresh.ident;
    identsById.set(String(ident.id), ident);

    const idx = identsCache.findIndex((i) => String(i.id) === String(ident.id));
    if (idx >= 0) identsCache[idx] = ident;
    else identsCache.push(ident);

    populateIdentDropdowns();

    // nach Save: im Dropdown auf den Ident setzen
    el.identSelect.value = String(ident.id);
    el.id.disabled = true;
    fillIdentForm(ident);
  } else {
    // wenigstens Cache aktualisieren, falls GET nicht klappt
    const fallback = saved ?? body;
    identsById.set(String(savedId), fallback);
    const idx = identsCache.findIndex((i) => String(i.id) === String(savedId));
    if (idx >= 0) identsCache[idx] = fallback;
    else identsCache.push(fallback);
    populateIdentDropdowns();
  }
}

// Imperium: PATCH /api/imperial/idents/:id/dangerlevel
async function setDanger() {
  const id = trimOrEmpty(el.impId.value);
  const danger = intOrNull(el.impDanger.value);

  if (!id || danger == null) {
    show({ ok: false, error: "ID oder dangerLevel fehlt" });
    return;
  }

  const data = await requestJson(
    `${API_PATH}/api/imperial/idents/${encodeURIComponent(id)}/dangerlevel`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dangerLevel: danger }),
    }
  );

  show(data);
}

// Bar: POST /api/purchase
async function buy() {
  const id = trimOrEmpty(el.buyId.value);
  const item = trimOrEmpty(el.buyItem.value);
  const amount = intOrNull(el.buyAmount.value);
  const note = trimOrEmpty(el.buyNote.value);

  const body = {
    id,
    item,
    amount, // Backend verlangt Integer > 0
    ...(note ? { note } : {}),
  };

  if (!id || !item || amount == null) {
    show({ ok: false, error: "ID, Item oder Betrag fehlt/ungueltig", sentBody: body });
    return;
  }

  const data = await requestJson(`${API_PATH}/api/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  show(data);
}

// Käufe: GET /api/idents/:id/purchases?limit=50
async function loadLog() {
  const id = trimOrEmpty(el.logId.value);
  if (!id) {
    logBox.textContent = JSON.stringify({ ok: false, error: "ID fehlt" }, null, 2);
    return;
  }

  const data = await requestJson(
    `${API_PATH}/api/idents/${encodeURIComponent(id)}/purchases?limit=50`,
    { method: "GET" }
  );

  logBox.textContent = JSON.stringify(data, null, 2);
}

/* =========================
   Optional: "Neu" Button Hook
   (wenn du ihn ins HTML einbaust)
========================= */

function newIdent() {
  el.identSelect.value = "";
  clearIdentForm();
  el.id.disabled = false;
  show({ ok: true, info: "Neuer Ident: Formular geleert" });
}

/* =========================
   Expose functions for inline onclick=""
========================= */

window.init = init;
window.loadAllAndCache = loadAllAndCache;
window.saveIdent = saveIdent;
window.setDanger = setDanger;
window.buy = buy;
window.loadLog = loadLog;
window.newIdent = newIdent;
