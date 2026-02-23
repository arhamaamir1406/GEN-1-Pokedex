const fs = require("fs/promises");

async function fetchJSON(url) {
  if (typeof fetch !== "function") {
    throw new Error(
      "Your Node version doesn't support fetch(). Install Node 18+ (recommended), OR run: npm i node-fetch and I’ll show you the small code change."
    );
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickEnglishFlavor(entries) {
  const english = entries.filter(e => e.language.name === "en");
  if (!english.length) return "";

  const preferred = english.find(e =>
    ["red", "blue", "yellow"].includes(e.version.name)
  );

  const entry = preferred || english[0];
  return entry.flavor_text.replace(/\f|\n/g, " ");
}

async function buildPokemon(id) {
  const pokemon = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const species = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${id}`);

  return {
    id,
    name: cap(pokemon.name),
    types: pokemon.types.map(t => t.type.name),
    height_m: pokemon.height / 10,
    weight_kg: pokemon.weight / 10,
    description: pickEnglishFlavor(species.flavor_text_entries),
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    cry: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
  };
}

async function main() {
  try {
    const all = [];

    for (let id = 1; id <= 151; id++) {
      console.log(`Fetching ${id}...`);
      const p = await buildPokemon(id);
      all.push(p);
    }

    await fs.mkdir("data", { recursive: true });
    await fs.writeFile("data/pokedex_gen1.json", JSON.stringify(all, null, 2));

    console.log("✅ data/pokedex_gen1.json created");
  } catch (err) {
    console.error("❌ Script failed:", err);
    process.exitCode = 1;
  }
}

main();