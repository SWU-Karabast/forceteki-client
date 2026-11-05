// Reading the game state snapshots forceteki commits in test/stateSnapshots/, from GitHub or from
// a local forceteki checkout. Shared by `npm run states` and the CI sync check.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const BackendRepo = 'SWU-Karabast/forceteki';
export const SnapshotDir = 'test/stateSnapshots';
export const FixtureDir = 'src/__fixtures__/gamestates';
export const ManifestFile = 'manifest.json';

const githubToken = (() => {
    if (process.env.GITHUB_TOKEN) {
        return process.env.GITHUB_TOKEN;
    }
    try {
        return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        // unauthenticated: 60 API requests an hour, enough for occasional local use
        return null;
    }
})();

export const github = async (path) => {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: {
            Accept: 'application/vnd.github+json',
            ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
        },
    });
    if (!response.ok) {
        throw new Error(`GitHub ${path} answered ${response.status}: ${await response.text()}`);
    }
    return response.json();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves `main`, a branch name or `pr/<number>` to the backend commit to copy from.
 *
 * An open PR resolves to GitHub's merge of it into current main (`merge_commit_sha`), which is
 * what main will hold once it merges. Asking for the PR is also what makes GitHub recompute that
 * merge; it reports `mergeable: null` until it has. A merged or closed PR resolves to main.
 */
export const resolveRef = async (ref) => {
    const prMatch = /^pr\/(\d+)$/.exec(ref);
    if (!prMatch) {
        const commit = await github(`/repos/${BackendRepo}/commits/${encodeURIComponent(ref)}`);
        return { ref, commit: commit.sha };
    }

    const number = prMatch[1];
    for (let attempt = 0; attempt < 6; attempt++) {
        const pr = await github(`/repos/${BackendRepo}/pulls/${number}`);
        if (pr.state !== 'open') {
            const main = await resolveRef('main');
            return { ...main, note: `forceteki#${number} is ${pr.merged_at ? 'merged' : 'closed'}, so this is main` };
        }
        if (pr.mergeable === false) {
            throw new Error(`forceteki#${number} conflicts with main; resolve that first`);
        }
        if (pr.mergeable === true && pr.merge_commit_sha) {
            return { ref, commit: pr.merge_commit_sha, pr };
        }
        await sleep(2000);
    }
    throw new Error(`GitHub has not computed a merge for forceteki#${number} yet; try again in a minute`);
};

/** Every snapshot at a backend commit, as a map of path (relative to the snapshot dir) to contents. */
export const readSnapshotsAt = async (commit) => {
    const tree = await github(`/repos/${BackendRepo}/git/trees/${commit}?recursive=1`);
    if (tree.truncated) {
        throw new Error(`the forceteki tree at ${commit} is too large to list in one request`);
    }
    const entries = tree.tree.filter((entry) => entry.type === 'blob'
        && entry.path.startsWith(SnapshotDir + '/')
        && entry.path.endsWith('.json'));

    const snapshots = new Map();
    await Promise.all(entries.map(async (entry) => {
        const blob = await github(`/repos/${BackendRepo}/git/blobs/${entry.sha}`);
        snapshots.set(entry.path.slice(SnapshotDir.length + 1), Buffer.from(blob.content, 'base64').toString('utf8'));
    }));
    return snapshots;
};

/** Every `.json` file under a directory, as a map of relative path to contents. */
export const readDirectory = (root, { exclude = [] } = {}) => {
    const files = new Map();
    if (!existsSync(root)) {
        return files;
    }
    const walk = (dir) => {
        for (const entry of readdirSync(dir)) {
            const path = join(dir, entry);
            if (statSync(path).isDirectory()) {
                walk(path);
            } else if (entry.endsWith('.json')) {
                const relativePath = relative(root, path).split('\\').join('/');
                if (!exclude.includes(relativePath)) {
                    files.set(relativePath, readFileSync(path, 'utf8'));
                }
            }
        }
    };
    walk(root);
    return files;
};

/** The committed client copy, without its manifest. */
export const readFixtures = () => readDirectory(FixtureDir, { exclude: [ManifestFile] });

/** Paths that are missing, extra or different between two snapshot maps. Empty when they match. */
export const diffSnapshots = (expected, actual) => {
    const differences = [];
    for (const [path, contents] of expected) {
        if (!actual.has(path)) {
            differences.push(`${path}: missing from the copy`);
        } else if (actual.get(path) !== contents) {
            differences.push(`${path}: differs`);
        }
    }
    for (const path of actual.keys()) {
        if (!expected.has(path)) {
            differences.push(`${path}: not in the backend`);
        }
    }
    return differences.sort();
};
