const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'MiniGames/1.0' } }, res => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return; }
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { reject(new Error(`Parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // ─── Pokemon (canonical species, EN + FR names) ───────────────────────────
  process.stdout.write('Fetching Pokémon species list... ');
  const speciesList = (await fetchJson('https://pokeapi.co/api/v2/pokemon-species?limit=10000')).results;
  console.log(`✓ ${speciesList.length} species`);

  process.stdout.write('Fetching EN + FR names (batches of 40)...');
  const BATCH = 40;
  const pokemon = [];
  for (let i = 0; i < speciesList.length; i += BATCH) {
    const batch = speciesList.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async s => {
      try {
        const d = await fetchJson(s.url);
        const en = d.names.find(n => n.language.name === 'en')?.name || s.name;
        const fr = d.names.find(n => n.language.name === 'fr')?.name || en;
        return { en, fr };
      } catch(_) {
        const n = s.name.charAt(0).toUpperCase() + s.name.slice(1);
        return { en: n, fr: n };
      }
    }));
    pokemon.push(...results);
    process.stdout.write(`\r  ${Math.min(i + BATCH, speciesList.length)}/${speciesList.length}   `);
  }
  fs.writeFileSync(path.join(dataDir, 'pokemon.json'), JSON.stringify(pokemon));
  console.log(`\n✓ Saved ${pokemon.length} Pokémon`);

  // ─── LoL ─────────────────────────────────────────────────────────────────────
  process.stdout.write('Fetching LoL versions... ');
  const version = (await fetchJson('https://ddragon.leagueoflegends.com/api/versions.json'))[0];
  console.log(`✓ version ${version}`);

  process.stdout.write(`Fetching LoL champion data (${version})... `);
  const champFull = await fetchJson(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/championFull.json`
  );
  const champions = Object.values(champFull.data)
    .map(c => ({
      id: c.id,
      name: c.name,
      passive: c.passive.name,
      spells: c.spells.slice(0, 4).map(s => s.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(dataDir, 'lol-champions.json'), JSON.stringify(champions));
  console.log(`✓ Saved ${champions.length} champions`);

  console.log('\nAll data saved to games/guess-it/data/');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });


async function main() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // ─── Pokemon ─────────────────────────────────────────────────────────────────
  process.stdout.write('Fetching Pokemon list... ');
  const pokemonData = await fetchJson('https://pokeapi.co/api/v2/pokemon?limit=10000');
  const pokemon = pokemonData.results.map(p => {
    // Capitalize each word, replace hyphens with spaces
    return p.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
  });
  fs.writeFileSync(path.join(dataDir, 'pokemon.json'), JSON.stringify(pokemon));
  console.log(`✓ ${pokemon.length} Pokémon`);

  // ─── LoL ─────────────────────────────────────────────────────────────────────
  process.stdout.write('Fetching LoL versions... ');
  const versions = await fetchJson('https://ddragon.leagueoflegends.com/api/versions.json');
  const version = versions[0];
  console.log(`✓ version ${version}`);

  process.stdout.write(`Fetching LoL champion data (${version})... `);
  const champFull = await fetchJson(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/championFull.json`
  );
  const champions = Object.values(champFull.data)
    .map(c => ({
      id: c.id,
      name: c.name,
      passive: c.passive.name,
      spells: c.spells.slice(0, 4).map(s => s.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(dataDir, 'lol-champions.json'), JSON.stringify(champions));
  console.log(`✓ ${champions.length} champions`);

  console.log('\nAll data saved to games/guess-it/data/');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
