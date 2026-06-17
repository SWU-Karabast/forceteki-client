// Generates public/card-names.json: a SET#NUM -> card title map for the replay
// viewer's move list / decklist / captions. The .swupgn carries only SET#NUM ids
// (e.g. "SOR#005"); this map resolves them to display names. Missing ids fall
// back to the raw id in the viewer, so partial coverage is safe.
//
// Source = forceteki's generated card data (two files):
//   _setCodeMap.json : { "SOR_005": "<cardId>", ... }   (SET_NNN -> internal id)
//   _cardMap.json    : [ { id, internalName, title, subtitle, cost }, ... ]
// We join on the card id and rewrite the "_" separator to "#" to match baseId().
//
// Re-run when a new set releases:
//   npm run gen:card-names
// Point at a non-default forceteki checkout with FORCETEKI_JSON_DIR or argv[2]:
//   FORCETEKI_JSON_DIR=/path/to/forceteki/test/json npm run gen:card-names

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

const titleById = new Map(cardMap.map((c) => [c.id, c.title]));

const out = {};
let missing = 0;
for (const [setCode, cardId] of Object.entries(setCodeMap)) {
    const title = titleById.get(cardId);
    if (!title) {
        missing++;
        continue;
    }
    out[setCode.replace('_', '#')] = title;
}

// Sort keys for stable, reviewable diffs.
const sorted = {};
for (const k of Object.keys(out).sort()) sorted[k] = out[k];

const outPath = path.resolve(repoRoot, 'public', 'card-names.json');
fs.writeFileSync(outPath, JSON.stringify(sorted, null, 0) + '\n');

const entries = Object.keys(sorted).length;
const kb = Math.round(fs.statSync(outPath).size / 1024);
console.log(`Wrote ${outPath}`);
console.log(`  ${entries} cards (${kb}KB), ${missing} set codes skipped (no title in card map)`);
