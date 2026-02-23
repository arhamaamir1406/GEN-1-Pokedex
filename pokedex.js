// =====================
// Retro Pokédex + WebSerial
// =====================

let port = null;
let reader = null;
let keepReading = false;
let serialBuffer = "";

let POKEDEX = [];
let index = 0;
let writer = null;
const encoder = new TextEncoder();

async function sendToArduino(line) {
  if (!port || !port.writable) return;      // not connected
  if (!writer) writer = port.writable.getWriter();
  try {
    await writer.write(encoder.encode(line + "\n"));
  } catch (e) {
    console.warn("sendToArduino failed:", e);
  }
}

const el = (id) => document.getElementById(id);
const pad3 = (n) => String(n).padStart(3, "0");

function toFeetInches(m) {
  const inches = (m || 0) * 39.3701;
  const feet = Math.floor(inches / 12);
  const inch = Math.round(inches - feet * 12);
  return `HT ${feet}'${String(inch).padStart(2, "0")}"`;
}

function toLbs(kg) {
  return `WT ${((kg || 0) * 2.20462).toFixed(1)} lbs`;
}

function typeLabel(p) {
  const main = (p.types && p.types.length) ? p.types[0] : "unknown";
  return (main + " POKÉMON").toUpperCase();
}

function renderList() {
  const list = el("list");
  list.innerHTML = "";

  for (let i = 0; i < POKEDEX.length; i++) {
    const p = POKEDEX[i];

    const row = document.createElement("div");
    row.className = "row" + (i === index ? " active" : "");
    row.addEventListener("click", () => {
      index = i;
      show(index, true);
    });

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = "#" + pad3(p.id);

    const nm = document.createElement("div");
    nm.className = "nm";
    nm.textContent = p.name.toUpperCase();

    row.appendChild(num);
    row.appendChild(nm);
    list.appendChild(row);
  }
}

function scrollActiveIntoView() {
  const list = el("list");
  const active = list.querySelector(".row.active");
  if (!active) return;
  active.scrollIntoView({ block: "nearest" });
}

function show(i, alsoUpdateList) {
  const p = POKEDEX[i];
  if (!p) return;

  el("dexNo").textContent = "#" + pad3(p.id);
  el("typeLabel").textContent = typeLabel(p);
  el("nameBar").textContent = p.name.toUpperCase();

  el("sprite").src = p.sprite;
  el("desc").textContent = p.description || "";

  el("height").textContent = toFeetInches(p.height_m);
  el("weight").textContent = toLbs(p.weight_kg);

  el("cryAudio").src = p.cry || "";

  if (alsoUpdateList) {
    renderList();
    scrollActiveIntoView();
  }
  // send current pokemon to Arduino LCD
  sendToArduino(`SHOW ${pad3(p.id)} ${p.name.toUpperCase()}`);
}

function next() {
  if (!POKEDEX.length) return;
  index = (index + 1) % POKEDEX.length;
  show(index, true);
}

function prev() {
  if (!POKEDEX.length) return;
  index = (index - 1 + POKEDEX.length) % POKEDEX.length;
  show(index, true);
}

function randomPick() {
  if (!POKEDEX.length) return;
  index = Math.floor(Math.random() * POKEDEX.length);
  show(index, true);
}

function playCry() {
  const a = el("cryAudio");
  if (!a || !a.src) return;
  a.currentTime = 0;
  a.play().catch(() => { });
}

// ---------------------
// Arduino -> Website commands
// ---------------------
function handleArduinoCommand(cmd) {
  if (!cmd) return;

  console.log("ARDUINO:", cmd);

  if (cmd === "PREV") prev();
  else if (cmd === "NEXT") next();
  else if (cmd === "CRY") playCry();
  else if (cmd === "RAND") randomPick();
}

// ---------------------
// Web Serial
// ---------------------
async function connectArduino() {
  // If already open, don’t reopen (this is the “port already open” fix)
  if (port && port.readable) {
    console.log("Serial already connected.");
    return;
  }

  try {
    // Ask user to pick a port
    port = await navigator.serial.requestPort();

    // Open it
    await port.open({ baudRate: 115200 });

    console.log("✅ Serial port opened");

    // Update button UI (optional)
    const btn = document.querySelector(".connect-btn");
    if (btn) {
      btn.classList.add("connected");
      btn.textContent = "CONNECTED";
    }

    // Create a text decoder and reader
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();

    // Start reading loop
    keepReading = true;
    serialBuffer = "";
    readArduinoLoop();

  } catch (err) {
    console.error("❌ connectArduino failed:", err);

    // If it failed, reset state so you can retry cleanly
    try { if (reader) await reader.cancel(); } catch (_) { }
    reader = null;

    try { if (port) await port.close(); } catch (_) { }
    port = null;

    keepReading = false;
    serialBuffer = "";
  }
}

async function readArduinoLoop() {
  try {
    while (keepReading && reader) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      // Buffer and split on newlines (handles chunked serial data)
      serialBuffer += value;

      let idx;
      while ((idx = serialBuffer.indexOf("\n")) >= 0) {
        const line = serialBuffer.slice(0, idx).trim();
        serialBuffer = serialBuffer.slice(idx + 1);
        if (line) handleArduinoCommand(line);
      }
    }
  } catch (err) {
    console.error("❌ readArduinoLoop error:", err);
  }
}

// Make it available to your inline onclick="connectArduino()"
window.connectArduino = connectArduino;

// ---------------------
// Init
// ---------------------
async function main() {
  const res = await fetch("./data/pokedex_gen1.json");
  POKEDEX = await res.json();

  // D-pad + buttons
  el("nextBtn")?.addEventListener("click", next);
  el("prevBtn")?.addEventListener("click", prev);
  el("prevBtnUp")?.addEventListener("click", prev);
  el("nextBtnDown")?.addEventListener("click", next);

  el("cryBtn")?.addEventListener("click", playCry);
  el("randBtn")?.addEventListener("click", randomPick);

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { next(); e.preventDefault(); }
    if (e.key === "ArrowLeft") { prev(); e.preventDefault(); }
    if (e.key === " ") { playCry(); e.preventDefault(); }
    if (e.key.toLowerCase() === "r") { randomPick(); }
  });

  renderList();
  show(index, true);
}

main().catch((err) => {
  console.error(err);
  const d = el("desc");
  if (d) d.textContent = "Failed to load data/pokedex_gen1.json (use Live Server).";
});