// `npm run states -- --ref main|<branch>|pr/<number>` downloads the game state snapshots forceteki
// commits (test/stateSnapshots/) into test/stateSnapshots/ (gitignored), and records where
// they came from in manifest.json. The gameboard tests run against whatever is there.
//
// `--local [path]` copies from a forceteki checkout's working tree instead (default ../forceteki),
// for trying out backend changes before they are pushed.
// `--if-missing` keeps snapshots that are already downloaded and only says which ones they are (the
// test run uses this, so a local run never quietly tests against an old backend).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
    BackendRepo, FixtureDir, ManifestFile, SnapshotDir, readDirectory, readSnapshotsAt, resolveRef,
} from './gameStates/snapshots.mjs';

const args = process.argv.slice(2);
const option = (name) => {
    const index = args.indexOf(name);
    return index === -1 ? undefined : (args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : true);
};

if (option('--if-missing') && existsSync(join(FixtureDir, ManifestFile))) {
    const existing = JSON.parse(readFileSync(join(FixtureDir, ManifestFile), 'utf8'));
    const verb = existing.ref.startsWith('local:') ? 'copied' : 'downloaded';
    let downloaded = `${verb} date unknown`;
    if (existing.downloadedAt) {
        const days = Math.floor((Date.now() - Date.parse(existing.downloadedAt)) / 86_400_000);
        downloaded = `${verb} ${existing.downloadedAt.slice(0, 10)} (${days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`})`;
    }
    const uncommitted = existing.uncommittedChanges ? ', with uncommitted changes' : '';
    console.log(`Game states: ${existing.backend} ${existing.ref} @ ${existing.commit.slice(0, 9)}${uncommitted}, ${downloaded}.`);
    console.log('Run `npm run states` to refresh, or `npm run states -- --ref pr/<number>` for a backend PR.');
    process.exit(0);
}

const local = option('--local');
const ref = option('--ref') ?? 'main';

let snapshots;
let manifest;
if (local) {
    const checkout = resolve(local === true ? '../forceteki' : local);
    const git = (...gitArgs) => execFileSync('git', ['-C', checkout, ...gitArgs], { encoding: 'utf8' }).trim();
    snapshots = readDirectory(join(checkout, SnapshotDir));
    manifest = {
        backend: BackendRepo,
        ref: `local:${git('rev-parse', '--abbrev-ref', 'HEAD')}`,
        commit: git('rev-parse', 'HEAD'),
        uncommittedChanges: git('status', '--porcelain', '--', SnapshotDir) !== '',
    };
} else {
    const resolved = await resolveRef(ref);
    if (resolved.note) {
        console.log(resolved.note);
    }
    snapshots = await readSnapshotsAt(resolved.commit);
    manifest = { backend: BackendRepo, ref, commit: resolved.commit };
}

if (snapshots.size === 0) {
    console.error(`No snapshots found in ${SnapshotDir} at ${manifest.ref}; nothing downloaded.`);
    process.exit(1);
}

rmSync(FixtureDir, { recursive: true, force: true });
for (const [path, contents] of snapshots) {
    const target = join(FixtureDir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
}
writeFileSync(join(FixtureDir, ManifestFile), JSON.stringify({ ...manifest, files: snapshots.size, downloadedAt: new Date().toISOString() }, null, 4) + '\n');

console.log(`Downloaded ${snapshots.size} game states from ${BackendRepo} ${manifest.ref} (${manifest.commit.slice(0, 9)}) into ${FixtureDir}.`);
