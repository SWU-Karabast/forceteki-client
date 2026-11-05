// The "Game states in sync" CI check. Compares the committed copy in src/__fixtures__/gamestates/
// with the backend snapshots it should match: the merge of the backend PR the description links
// (`Backend: forceteki#123`) into current main, or backend main when there is none.
//
// It fails only for something the PR itself did (it changed the copy, and the copy is wrong).
// A copy that is merely behind passes with a warning: either this branch is behind client main,
// or client main is behind backend main and a sync PR is needed.
//
// Locally: `node scripts/checkStates.mjs [--backend-pr <number>]`.

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import {
    BackendRepo, FixtureDir, ManifestFile, diffSnapshots, github, readFixtures, readSnapshotsAt, resolveRef,
} from './gameStates/snapshots.mjs';

const inActions = process.env.GITHUB_ACTIONS === 'true';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const summary = [];
const annotate = (level, title, message) => {
    if (inActions) {
        console.log(`::${level} title=${title}::${message.replace(/\n/g, '%0A')}`);
    } else {
        console.log(`${level.toUpperCase()}: ${title}\n${message}`);
    }
    summary.push(`**${level === 'error' ? 'Failed' : level === 'warning' ? 'Warning' : 'Passed'}: ${title}**\n\n${message}`);
};
const finish = (code) => {
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Game states in sync\n\n${summary.join('\n\n')}\n`);
    }
    process.exit(code);
};
const fileList = (differences) => differences.slice(0, 20).map((d) => `- ${d}`).join('\n')
    + (differences.length > 20 ? `\n- …and ${differences.length - 20} more` : '');

/** The backend PR this client PR is paired with, from `Backend: forceteki#123` in its description. */
const linkedBackendPr = () => {
    const argIndex = process.argv.indexOf('--backend-pr');
    if (argIndex !== -1) {
        return process.argv[argIndex + 1];
    }
    if (process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) {
        const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        const match = /Backend:\s*forceteki#(\d+)/i.exec(event.pull_request?.body ?? '');
        return match?.[1];
    }
    return undefined;
};

/**
 * The commit this change is measured against. In Actions the checkout is a merge commit (a pull
 * request's test merge, or the merge queue's) whose first parent is the base; locally, the fork
 * point from origin/main.
 */
const baseCommit = () => (inActions ? git('rev-parse', 'HEAD^1') : git('merge-base', 'origin/main', 'HEAD'));

const fixturesAt = (commit) => {
    const files = new Map();
    const listing = git('ls-tree', '-r', '--name-only', commit, '--', FixtureDir);
    for (const path of listing.split('\n').filter((p) => p.endsWith('.json'))) {
        const relativePath = path.slice(FixtureDir.length + 1);
        if (relativePath !== ManifestFile) {
            files.set(relativePath, git('show', `${commit}:${path}`));
        }
    }
    return files;
};

const backendPr = linkedBackendPr();
const copy = readFixtures();
const base = baseCommit();
const prChangedCopy = git('diff', '--name-only', base, 'HEAD', '--', FixtureDir) !== '';
const manifest = existsSync(`${FixtureDir}/${ManifestFile}`) ? JSON.parse(readFileSync(`${FixtureDir}/${ManifestFile}`, 'utf8')) : {};

let target;
try {
    target = await resolveRef(backendPr ? `pr/${backendPr}` : 'main');
} catch (error) {
    annotate('error', 'Game states: backend not available', `${error.message}`);
    finish(1);
}
const targetName = target.pr ? `forceteki#${backendPr} merged into main` : `${BackendRepo} main`;
const command = `npm run states -- --ref ${target.pr ? `pr/${backendPr}` : 'main'}`;
if (target.note) {
    summary.push(target.note);
}

const differences = diffSnapshots(await readSnapshotsAt(target.commit), copy);

if (prChangedCopy && String(manifest.ref ?? '').startsWith('local:')) {
    annotate('error', 'Game states copied from a local checkout',
        `The copy in ${FixtureDir} was made with \`--local\`. Push the backend change, link its PR as \`Backend: forceteki#<number>\` in this description, and run \`npm run states -- --ref pr/<number>\`.`);
    finish(1);
}

if (differences.length === 0) {
    annotate('notice', 'Game states in sync', `The copy matches ${targetName} (${target.commit.slice(0, 9)}).`);
    if (target.pr) {
        // backend CI reruns the capture; until it passes, the backend PR's snapshots may still change
        const runs = await github(`/repos/${BackendRepo}/commits/${target.pr.head.sha}/check-runs?per_page=100`);
        const unfinished = runs.check_runs.filter((run) => run.status !== 'completed'
            || !['success', 'skipped', 'neutral'].includes(run.conclusion));
        if (unfinished.length > 0) {
            annotate('warning', 'Game states: backend PR checks not passed',
                `forceteki#${backendPr} has not passed its checks on its latest commit (${unfinished.map((run) => run.name).join(', ')}). If its snapshots change, re-run \`${command}\`.`);
        }
    }
    finish(0);
}

const detail = `Compared against ${targetName} (${target.commit.slice(0, 9)}):\n${fileList(differences)}`;

if (prChangedCopy) {
    annotate('error', 'Game states out of date',
        `This PR changes ${FixtureDir}, but the copy does not match the backend. Run \`${command}\` and commit the result; never edit the copy by hand.\n\n${detail}`);
    finish(1);
}

// The PR did not touch the copy, so the copy is merely behind. Say whose job the update is.
const mainMatches = diffSnapshots(await readSnapshotsAt(target.commit), fixturesAt(base)).length === 0;
if (mainMatches) {
    annotate('warning', 'Game states out of date',
        `Client main already has the current copy; this branch is behind it. Update from main.\n\n${detail}`);
} else {
    annotate('warning', 'Game states out of date',
        `Client main is behind ${targetName}: a PR that runs \`${command}\` is needed. This PR does not need to do it.\n\n${detail}`);
}
finish(0);
