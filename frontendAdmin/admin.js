const API_PATH = "http://localhost:3000";

const output = document.getElementById("output");
const logBox = document.getElementById("log");

let identsCache = [];
let identsById = new Map();

function init() {
  console.log("API_PATH:", API_PATH);
}

function show(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

/* =========================
   Laden + Cachen
========================= */

async function loadAllAndCache() {
  const res = await fetch(API_PATH + "/api/admin/idents");
  const text = await res.text();

  if (!res.ok) {
    document.getElementById("all-users").textContent =
      `HTTP ${res.status}\n\n${text}`;
    return;
  }

  const data = JSON.parse(text);
  identsCache = Array.isArray(data) ? data : (data.idents ?? []);
  identsById = new Map(identsCache.map(i => [String(i.id), i]));

  document.getElementById("all-users").textContent =
    JSON.stringify(identsCache, null, 2);

  populateIdentDropdowns();
}

/* =========================
   Dropdowns
========================= */

function populateIdentDropdowns() {
  populateMainIdentDropdown();
  wireIdDropdown("imp-select", "imp-id");
  wireIdDropdown("buy-select", "buy-id");
  wireIdDropdown("log-select", "log-id");
}

function populateMainIdentDropdown() {
  const select = document.getElementById("ident-select");
  select.innerHTML = `<option value="">— bitte wählen —</option>`;

  const sorted = [...identsCache].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
  );

  for (const ident of sorted) {
    const opt = document.createElement("option");
    opt.value = ident.id;
    opt.textContent = `${ident.name ?? "(kein Name)"} – ${ident.id}`;
    select.appendChild(opt);
  }

  select.onchange = () => {
    const ident = identsById.get(select.value);
    if (ident) fillIdentForm(ident);
  };
}

function wireIdDropdown(selectId, targetInputId) {
  const sel = document.getElementById(selectId);
  const inp = document.getElementById(targetInputId);

  sel.innerHTML = `<option value="">— bitte wählen —</option>`;

  for (const ident of identsCache) {
    const opt = document.createElement("option");
    opt.value = ident.id;
    opt.textContent = `${ident.name ?? "(kein Name)"} – ${ident.id}`;
    sel.appendChild(opt);
  }

  sel.onchange = () => {
    inp.value = sel.value;
  };
}

/* =========================
   Autofill
========================= */

function fillIdentForm(ident) {
  id.value = ident.id ?? "";
  name.value = ident.name ?? "";
  species.value = ident.species ?? "";
  age.value = ident.age ?? "";
  homeWorld.value = ident.homeWorld ?? "";
  occupation.value = ident.occupation ?? "";
  dangerLevel.value = ident.dangerLevel ?? "";
  description.value = ident.description ?? "";
  balance.value = ident.BankAccountBalance ?? "";
}

/* =========================
   API Calls
========================= */

async function saveIdent() {
  const body = {
    id: id.value,
    name: name.value,
    species: species.value,
    age: Number(age.value),
    homeWorld: homeWorld.value,
    occupation: occupation.value,
    dangerLevel: Number(dangerLevel.value),
    description: description.value,
    BankAccountBalance: Number(balance.value)
  };

  const res = await fetch(API_PATH + "/api/admin/ident", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  show(data);

  const saved = data.ident ?? data;
  if (saved?.id != null) {
    identsById.set(String(saved.id), saved);
    const idx = identsCache.findIndex(i => String(i.id) === String(saved.id));
    if (idx >= 0) identsCache[idx] = saved;
    else identsCache.push(saved);
    populateIdentDropdowns();
  }
}

async function setDanger() {
  const res = await fetch(
    `${API_PATH}/api/imperial/idents/${imp-id.value}/dangerlevel`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dangerLevel: Number(imp-danger.value) })
    }
  );
  show(await res.json());
}

async function buy() {
  const res = await fetch(API_PATH + "/api/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: buy-id.value,
      item: buy-item.value,
      amount: Number(buy-amount.value),
      note: buy-note.value
    })
  });
  show(await res.json());
}

async function loadLog() {
  const res = await fetch(
    `${API_PATH}/api/idents/${log-id.value}/purchases?limit=50`
  );
  logBox.textContent = JSON.stringify(await res.json(), null, 2);
}
