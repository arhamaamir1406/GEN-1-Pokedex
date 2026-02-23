let port;
let reader;
let writer;

let POKEDEX = [];
let index = 0;

const el = (id) => document.getElementById(id);
const pad3 = (n) => String(n).padStart(3, "0");

const encoder = new TextEncoder();

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

async function sendToArduino(line) {
  if (!writer) return;
  try {
    await writer.write(encoder.encode(line + "\n"));
  } catch (e) {
    console.warn("Arduino write failed:", e);
  }
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

  // UI
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

  // ✅ Send to Arduino LCD (Arduino should parse: SHOW 025 PIKACHU)
  sendToArduino(`SHOW ${pad3(p.id)} ${p.name.toUpperCase()}`);
}

function next() {
  index = (index + 1) % POKEDEX.length;
  show(index, true);
}

function prev() {
  index = (index - 1 + POKEDEX.length) % POKEDEX.length;
  show(index, true);
}

function randomPick() {
  index = Math.floor(Math.random() * POKEDEX.length);
  show(index, true);
}

function playCry() {
  const a = el("cryAudio");
  if (!a.src) return;
  a.currentTime = 0;
  a.play().catch(() => { });
}

function handleArduinoCommand(cmd) {
  if (!cmd) return;

  console.log("ARDUINO:", cmd);

  if (cmd === "PREV") prev();
  else if (cmd === "NEXT") next();
  else if (cmd === "CRY") playCry();
  else if (cmd === "RAND") randomPick();
}

async function connectArduino() {
  try {
    // If already open, don't try again
    if (port && port.readable) {
      console.warn("Port already open.");
      return;
    }

    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    // Reader
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();

    // Writer
    writer = port.writable.getWriter();

    // UI feedback
    const btn = document.querySelector(".connect-btn");
    if (btn) {
      btn.classList.add("connected");
      btn.textContent = "CONNECTED";
      btn.disabled = true;
    }

    // Start reading loop
    readArduino();

    // Immediately push current pokemon to LCD
    if (POKEDEX.length) {
      const p = POKEDEX[index];
      sendToArduino(`SHOW ${pad3(p.id)} ${p.name.toUpperCase()}`);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to connect Arduino. Close Arduino Serial Monitor / VSCode serial monitor and try again.");
  }
}

async function readArduino() {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      // Could contain partial lines; simple split works OK for your short commands
      const lines = value.split("\n");
      lines.forEach((line) => handleArduinoCommand(line.trim()));
    }
  } catch (err) {
    console.error("Arduino read loop error:", err);
  }
}

async function main() {
  const res = await fetch("./data/pokedex_gen1.json");
  POKEDEX = await res.json();

  // Pokédex buttons
  el("nextBtn")?.addEventListener("click", next);
  el("prevBtn")?.addEventListener("click", prev);
  el("cryBtn")?.addEventListener("click", playCry);
  el("randBtn")?.addEventListener("click", randomPick);

  // D-pad extra buttons (up/down)
  el("prevBtnUp")?.addEventListener("click", prev);
  el("nextBtnDown")?.addEventListener("click", next);

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { next(); e.preventDefault(); }
    if (e.key === "ArrowLeft") { prev(); e.preventDefault(); }
    if (e.key === " ") { playCry(); e.preventDefault(); }
    if (e.key.toLowerCase() === "r") { randomPick(); }
  });

  // Show initial
  renderList();
  show(index, true);

  // If you have a connect button in HTML with onclick="connectArduino()"
  // you're good. Otherwise you can wire it here:
  document.querySelector(".connect-btn")?.addEventListener("click", connectArduino);
}

main().catch((err) => {
  console.error(err);
  const d = el("desc");
  if (d) d.textContent = "Failed to load data/pokedex_gen1.json (use Live Server).";
});

// Make connectArduino available for onclick="" usage
window.connectArduino = connectArduino;