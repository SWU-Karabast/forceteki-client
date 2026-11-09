import { execFileSync } from 'node:child_process';

// Downloads the backend's game state snapshots before the first test run; later runs reuse them.
// To test against a backend branch or PR instead, run `npm run states -- --ref <ref>` first.
export default function downloadGameStates() {
    execFileSync('node', ['scripts/states.mjs', '--if-missing'], { stdio: 'inherit' });
}
