// Default (kannst du im UI überschreiben)
let API_PATH = "http://localhost:3000/api";

let html5QrCode = null;
let isScanning = false;
let currentIdentId = null;

// Optional: nach erfolgreichem Scan automatisch stoppen (verhindert Kamera-"busy" Probleme)
const STOP_AFTER_SUCCESS = false;

const statusBox = document.getElementById("status");
const historyBox = document.getElementById("history");

function init() {
  // Settings aus localStorage
  const savedApi = localStorage.getItem("imperium_api_path");
  if (savedApi) API_PATH = savedApi;

  document.getElementById("api-path").value = API_PATH;

  renderDangerButtons();
  loadHistoryUI();

  log(`Init OK. API_PATH=${API_PATH}`);
}

function log(msg, level = "info") {
  const time = new Date().toLocaleTimeString();
  const prefix = level === "error" ? "ERR" : "OK ";
  statusBox.textContent = `[${time}] ${prefix} ${msg}\n` + statusBox.textContent;
}

function saveSettings() {
  const v = document.getElementById("api-path").value.trim();
  if (!v) return;
  API_PATH = v;
  localStorage.setItem("imperium_api_path", API_PATH);
  log(`Gespeichert. API_PATH=${API_PATH}`);
}

function setIdentCardVisible(on) {
  document.getElementById("ident-card").style.display = on ? "block" : "none";
  document.getElementById("ident-empty").style.display = on ? "none" : "block";
}

/* =========================
   Scanner
========================= */

async function cleanupScanner() {
  // defensiv: falls ein alter Scanner "hängt"
  if (!html5QrCode) return;

  try { await html5QrCode.stop(); } catch (_) {}
  try { await html5QrCode.clear(); } catch (_) {}
  html5QrCode = null;
  isScanning = false;
}

async function startScan() {
  if (isScanning) return;

  const btnStart = document.getElementById("btn-start");
  const btnStop = document.getElementById("btn-stop");

  try {
    // vorher sauber aufräumen (wichtig gegen NotReadableError)
    await cleanupScanner();

    const scannerEl = document.getElementById("scanner");
    scannerEl.innerHTML = ""; // reset

    html5QrCode = new Html5Qrcode("scanner");

    const configs = { fps: 10, qrbox: { width: 240, height: 240 } };

    btnStart.disabled = true;

    // --- Start-Strategie:
    // 1) facingMode: environment (robust auf Mobile)
    // 2) deviceId: best camera
    // 3) deviceId: first camera
    let started = false;
    let lastErr = null;

    // 1) facingMode
    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        configs,
        onScanSuccess,
        onScanFailure
      );
      started = true;
      log("Scan gestartet (facingMode: environment).");
    } catch (e1) {
      lastErr = e1;
    }

    // Kameras erst abfragen wenn nötig
    let cameras = null;
    if (!started) {
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (eCam) {
        lastErr = eCam;
      }
    }

    if (!started) {
      if (!cameras || cameras.length === 0) {
        throw new Error("Keine Kamera gefunden (oder Zugriff blockiert).");
      }

      // 2) best camera
      const bestId = pickBestCamera(cameras);
      try {
        await html5QrCode.start(
          { deviceId: { exact: bestId } },
          configs,
          onScanSuccess,
          onScanFailure
        );
        started = true;
        log(`Scan gestartet (deviceId: best = ${bestId}).`);
      } catch (e2) {
        lastErr = e2;
      }

      // 3) first camera
      if (!started) {
        const firstId = cameras[0].id;
        await html5QrCode.start(
          { deviceId: { exact: firstId } },
          configs,
          onScanSuccess,
          onScanFailure
        );
        started = true;
        log(`Scan gestartet (deviceId: first = ${firstId}).`);
      }
    }

    isScanning = true;
    btnStop.disabled = false;
  } catch (e) {
    // bei Fehler: UI zurücksetzen + sauber aufräumen
    await cleanupScanner();

    document.getElementById("btn-start").disabled = false;
    document.getElementById("btn-stop").disabled = true;

    const name = e?.name ? `${e.name}: ` : "";
    log(`${name}${e?.message ?? String(e)}`, "error");
    console.error(e);
  }
}

async function stopScan() {
  const btnStart = document.getElementById("btn-start");
  const btnStop = document.getElementById("btn-stop");

  if (!html5QrCode || !isScanning) return;

  await cleanupScanner();

  btnStart.disabled = false;
  btnStop.disabled = true;
  log("Scan gestoppt.");
}

function pickBestCamera(cameras) {
  // Heuristik: "back", "rear", "environment" bevorzugen
  const back = cameras.find(c => /back|rear|environment/i.test(c.label));
  return (back ?? cameras[0]).id;
}

let lastScanText = null;
let lastScanAt = 0;

async function onScanSuccess(decodedText) {
  // simples Debounce
  const now = Date.now();
  if (decodedText === lastScanText && (now - lastScanAt) < 1500) return;
  lastScanText = decodedText;
  lastScanAt = now;

  const id = extractId(decodedText);
  if (!id) {
    log(`QR erkannt, aber keine ID extrahiert: ${decodedText}`, "error");
    return;
  }

  log(`Scan: ${decodedText} → ID=${id}`);
  await loadIdent(id);

  // Optional: Kamera nach erfolgreichem Scan freigeben
  if (STOP_AFTER_SUCCESS) {
    await stopScan();
  }
}

function onScanFailure(_err) {
  // bewusst leise
}

function extractId(decodedText) {
  // Falls QR nur "12345" enthält → ok
  const t = String(decodedText).trim();

  // Falls QR z.B. URL enthält: "...?id=12345"
  const m = t.match(/id=([A-Za-z0-9_-]+)/);
  if (m) return m[1];

  // Nur Ziffern / Token
  const m2 = t.match(/^[A-Za-z0-9_-]{1,64}$/);
  if (m2) return t;

  return null;
}

/* =========================
   Ident anzeigen
========================= */

async function loadIdentFromInput() {
  const id = document.getElementById("manual-id").value.trim();
  if (!id) return;
  await loadIdent(id);
}

async function reloadCurrent() {
  if (!currentIdentId) return;
  await loadIdent(currentIdentId);
}

async function loadIdent(id) {
  try {
    const res = await fetch(`${API_PATH}/idents/${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setIdentCardVisible(false);
      log(`GET ident fehlgeschlagen (${res.status}): ${data?.error ?? "UNKNOWN"}`, "error");
      return;
    }

    const ident = data.ident;
    currentIdentId = String(ident.id ?? id);

    renderIdent(ident);
    addToHistory(ident);

    setIdentCardVisible(true);
    log(`Ident geladen: ${ident.name ?? ident.id}`);
  } catch (e) {
    setIdentCardVisible(false);
    const name = e?.name ? `${e.name}: ` : "";
    log(`${name}${e?.message ?? String(e)}`, "error");
    console.error(e);
  }
}

function renderIdent(ident) {
  document.getElementById("ident-name").textContent = ident.name ?? "(kein Name)";
  document.getElementById("ident-id").textContent = `ID: ${ident.id ?? "—"}`;
  document.getElementById("ident-species").textContent = `Spezies: ${ident.species ?? "—"}`;
  document.getElementById("ident-danger").textContent = `${ident.dangerLevel ?? "—"}`;

  document.getElementById("ident-age").textContent = ident.age ?? "—";
  document.getElementById("ident-home").textContent = ident.homeWorld ?? "—";
  document.getElementById("ident-occ").textContent = ident.occupation ?? "—";
  document.getElementById("ident-desc").textContent = ident.description ?? "—";

  const bal = ident.BankAccountBalance ?? ident.balance;
  document.getElementById("ident-balance").textContent =
    (typeof bal === "number") ? `${bal} CR` : "—";

  highlightDangerButtons(Number(ident.dangerLevel));
}

/* =========================
   Danger Level setzen
========================= */

function renderDangerButtons() {
  const wrap = document.getElementById("dangerbar");
  wrap.innerHTML = "";

  for (let i = 0; i <= 10; i++) {
    const b = document.createElement("button");
    b.textContent = String(i);
    b.onclick = () => setDanger(i);
    b.dataset.level = String(i);
    wrap.appendChild(b);
  }
}

function highlightDangerButtons(level) {
  const buttons = document.querySelectorAll("#dangerbar button");
  buttons.forEach(b => {
    b.classList.toggle("active", Number(b.dataset.level) === level);
  });
}

async function setDanger(level) {
  if (!currentIdentId) {
    log("Kein Ident geladen.", "error");
    return;
  }

  try {
    // UI optimistisch markieren
    highlightDangerButtons(level);

    const res = await fetch(
      `${API_PATH}/imperial/idents/${encodeURIComponent(currentIdentId)}/dangerlevel`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dangerLevel: Number(level) })
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      log(`PATCH dangerLevel fehlgeschlagen (${res.status}): ${data?.error ?? "UNKNOWN"}`, "error");
      // zurück-sync
      await reloadCurrent();
      return;
    }

    log(`Danger Level gesetzt: ID=${currentIdentId} → ${level}`);
    // neu laden um Server-Wahrheit zu haben
    await reloadCurrent();
  } catch (e) {
    const name = e?.name ? `${e.name}: ` : "";
    log(`${name}${e?.message ?? String(e)}`, "error");
    console.error(e);
  }
}

/* =========================
   History (LocalStorage)
========================= */

function getHistory() {
  try {
    const raw = localStorage.getItem("imperium_history");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setHistory(arr) {
  localStorage.setItem("imperium_history", JSON.stringify(arr));
}

function addToHistory(ident) {
  const entry = {
    id: String(ident.id ?? ""),
    name: ident.name ?? "",
    species: ident.species ?? "",
    dangerLevel: ident.dangerLevel ?? null,
    at: Date.now()
  };

  let hist = getHistory();

  // Eintrag mit gleicher ID entfernen
  hist = hist.filter(x => String(x.id) !== entry.id);
  // oben rein
  hist.unshift(entry);
  // limit
  hist = hist.slice(0, 20);

  setHistory(hist);
  loadHistoryUI();
}

function loadHistoryUI() {
  const hist = getHistory();
  historyBox.innerHTML = "";

  if (hist.length === 0) {
    const div = document.createElement("div");
    div.style.color = "#94a3b8";
    div.textContent = "Keine Scans gespeichert.";
    historyBox.appendChild(div);
    return;
  }

  for (const h of hist) {
    const b = document.createElement("button");
    const d = new Date(h.at).toLocaleTimeString();
    b.innerHTML = `<div style="font-weight:bold;">${escapeHtml(h.name || "(kein Name)")}</div>
      <div style="font-size:12px; color:#94a3b8; margin-top:2px;">
        ID: ${escapeHtml(h.id)} • ${escapeHtml(h.species || "—")} • DL: ${escapeHtml(String(h.dangerLevel ?? "—"))} • ${d}
      </div>`;
    b.onclick = () => loadIdent(h.id);
    historyBox.appendChild(b);
  }
}

function clearHistory() {
  localStorage.removeItem("imperium_history");
  loadHistoryUI();
  log("History gelöscht.");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
