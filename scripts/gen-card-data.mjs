// Generates the replay viewer's static card-data assets from forceteki's card data:
//   public/card-names.json : SET#NUM -> title              (move list / decklist / captions)
//   public/card-costs.json : SET#NUM -> cost               (resourcing report float/spend math)
//   public/card-stats.json : SET#NUM -> {power,hp,arena,type} (board: unit/leader stat badges)
//
// Names/costs join the two summary files below. Stats come from the per-card files in
// the Card/ directory (the only source that carries power/hp/arena/type).
//
// Source = forceteki's generated card data:
//   _setCodeMap.json : { "SOR_005": "<cardId>", ... }   (SET_NNN -> internal id)
//   _cardMap.json    : [ { id, internalName, title, subtitle, cost }, ... ]
//   Card/<name>.json : { title, cost, power, hp, arena, types, setCodes, ... } per card
// We join on the card id and rewrite the "_" separator to "#" to match baseId().
//
// Re-run when a new set releases:
//   npm run gen:card-data
// Point at a non-default forceteki checkout with FORCETEKI_JSON_DIR or argv[2]:
//   FORCETEKI_JSON_DIR=/path/to/forceteki/test/json npm run gen:card-data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const srcDir =
    process.argv[2] ||
    process.env.FORCETEKI_JSON_DIR ||
    path.resolve(repoRoot, '..', 'forceteki', 'test', 'json');

const setCodeMapPath = path.join(srcDir, '_setCodeMap.json');
const cardMapPath = path.join(srcDir, '_cardMap.json');

for (const p of [setCodeMapPath, cardMapPath]) {
    if (!fs.existsSync(p)) {
        console.error(`ERROR: source file not found: ${p}`);
        console.error('Pass the forceteki test/json dir as argv[2] or FORCETEKI_JSON_DIR.');
        process.exit(1);
    }
}

const setCodeMap = JSON.parse(fs.readFileSync(setCodeMapPath, 'utf8'));
const cardMap = JSON.parse(fs.readFileSync(cardMapPath, 'utf8'));

const byId = new Map(cardMap.map((c) => [c.id, c]));

const names = {};
const costs = {};
let missing = 0;
let noCost = 0;
for (const [setCode, cardId] of Object.entries(setCodeMap)) {
    const card = byId.get(cardId);
    if (!card) {
        missing++;
        continue;
    }
    const key = setCode.replace('_', '#');
    if (card.title) names[key] = card.title;
    // Bases/leaders have no cost (null); omit them so costOf() falls back to undefined.
    if (typeof card.cost === 'number') costs[key] = card.cost;
    else noCost++;
}

function writeSorted(file, obj) {
    const sorted = {};
    for (const k of Object.keys(obj).sort()) sorted[k] = obj[k];
    const out = path.resolve(repoRoot, 'public', file);
    fs.writeFileSync(out, JSON.stringify(sorted, null, 0) + '\n');
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`Wrote ${out} — ${Object.keys(sorted).length} entries (${kb}KB)`);
}

writeSorted('card-names.json', names);
writeSorted('card-costs.json', costs);
console.log(`${missing} set codes had no card entry; ${noCost} had no cost (bases/leaders).`);

// ----- card-stats.json: power/hp/arena/type from the per-card Card/ files -----
// SET#NUM keys are zero-padded to 3 digits to match the replay's card ids (e.g. "SOR#010").
const pad3 = (n) => String(n).padStart(3, '0');
const cardDir = path.join(srcDir, 'Card');
const stats = {};
let statFiles = 0;
if (fs.existsSync(cardDir)) {
    for (const f of fs.readdirSync(cardDir)) {
        if (!f.endsWith('.json')) continue;
        let card;
        try {
            card = JSON.parse(fs.readFileSync(path.join(cardDir, f), 'utf8'));
        } catch {
            continue;
        }
        statFiles++;
        const entry = {};
        if (card.types && card.types[0]) entry.type = card.types[0];
        if (typeof card.power === 'number') entry.power = card.power;
        if (typeof card.hp === 'number') entry.hp = card.hp;
        if (card.arena) entry.arena = card.arena;
        // A card can be printed in multiple sets; index every printing.
        const codes = (card.setCodes && card.setCodes.length ? card.setCodes : [card.setId]).filter(Boolean);
        for (const sc of codes) {
            if (!sc.set || typeof sc.number !== 'number') continue;
            stats[`${sc.set}#${pad3(sc.number)}`] = entry;
        }
    }
    writeSorted('card-stats.json', stats);
    console.log(`Scanned ${statFiles} Card/ files for stats.`);
} else {
    console.warn(`WARN: ${cardDir} not found — skipped card-stats.json (board stat badges need it).`);
}
