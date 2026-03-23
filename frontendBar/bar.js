let currentPlayerId = null;
let lastScanTime = 0;

// 🔍 QR Scanner starten
const scanner = new Html5Qrcode("reader");

scanner.start(
  { facingMode: "environment" },
  {
    fps: 10,
    qrbox: 250
  },
  (decodedText) => {
    const now = Date.now();

    // Debounce (verhindert mehrfaches Scannen)
    if (now - lastScanTime < 2000) return;

    lastScanTime = now;
    currentPlayerId = decodedText;

    document.getElementById("player").innerText =
      `👤 ${currentPlayerId}`;
  },
  () => {}
);

// 🍺 Drinks laden
fetch("drinks.json")
  .then(res => res.json())
  .then(data => renderMenu(data));

function renderMenu(data) {
  const menu = document.getElementById("menu");

  data.categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "category";

    const title = document.createElement("h2");
    title.innerText = cat.name;

    const grid = document.createElement("div");
    grid.className = "grid";

    cat.items.forEach(item => {
      const btn = document.createElement("div");
      btn.className = "btn";

      btn.innerHTML = `
        <div>${item.name}</div>
        <div class="price">${item.price} Cr</div>
      `;

      btn.onclick = () => order(item);

      grid.appendChild(btn);
    });

    div.appendChild(title);
    div.appendChild(grid);
    menu.appendChild(div);
  });
}

// 💳 Bestellung
function order(item) {
  if (!currentPlayerId) {
    showStatus("❌ Kein Spieler gescannt", "error");
    return;
  }

  fetch("/api/pay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      playerId: currentPlayerId,
      amount: item.price,
      reason: item.name
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showStatus(`✅ ${item.name} gebucht`, "success");
        beep();
      } else {
        showStatus(`❌ ${data.error}`, "error");
      }
    })
    .catch(() => {
      showStatus("❌ Server nicht erreichbar", "error");
    });
}

// 📢 Status
function showStatus(text, type) {
  const el = document.getElementById("status");
  el.innerText = text;
  el.className = type;
}

// 🔊 Sound
function beep() {
  const audio = new AudioContext();
  const osc = audio.createOscillator();
  osc.connect(audio.destination);
  osc.frequency.value = 800;
  osc.start();
  osc.stop(audio.currentTime + 0.1);
}