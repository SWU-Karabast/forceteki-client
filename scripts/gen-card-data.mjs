// Generates the replay viewer's static card-data assets from forceteki's card data:
//   public/card-names.json : SET#NUM -> title   (move list / decklist / captions)
//   public/card-costs.json : SET#NUM -> cost     (resourcing report float/spend math)
// Both join the same two source files, so they're produced in one pass.
//
// Source = forceteki's generated card data (two files):
//   _setCodeMap.json : { "SOR_005": "<cardId>", ... }   (SET_NNN -> internal id)
//   _cardMap.json    : [ { id, internalName, title, subtitle, cost }, ... ]
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
