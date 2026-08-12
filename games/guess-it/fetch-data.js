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
