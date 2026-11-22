// Playwright helpers for playing the local site as several players at once: this client (`npm run dev`, port 3000)
// against a local forceteki game node (port 9500). Each player is its own browser context, which has its own cookies
// and storage like a separate incognito window, so two anonymous players, or the dev users Order66 and ThisIsTheWay,
// can play each other from one browser.
//
// smoke.mjs plays the standard flows with these, and the local-browser-testing skill (.claude/skills/) builds on them.
// A script anywhere can use them: import { ... } from '<forceteki-client>/scripts/playwright/localPlayers.mjs';

import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export { expect };

/** The local client. */
export const ClientUrl = process.env.KARABAST_CLIENT_URL ?? 'http://localhost:3000';

/** The local game node. */
export const ServerUrl = process.env.KARABAST_SERVER_URL ?? 'http://localhost:9500';

/** Where screenshots go: test-results/playwright/ in this repo (gitignored), unless KARABAST_PLAYWRIGHT_OUTPUT names a folder. */
export const OutputDir = resolve(process.env.KARABAST_PLAYWRIGHT_OUTPUT ?? fileURLToPath(new URL('../../test-results/playwright/', import.meta.url)));

/** The development test accounts the dev sign-in on /auth offers. */
export const DevUser = Object.freeze({
    Order66: 'Order66',
    ThisIsTheWay: 'ThisIsTheWay',
});

/**
 * Throws with what to start if the client or the game node is not answering. The game node is asked for its test game
 * setups, a development-only route, so this also catches a game node that is not running with ENVIRONMENT=development.
 */
export async function checkServers() {
    const check = async (url, whatToStart) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        } catch (error) {
            throw new Error(`${url} is not answering (${error.message}). ${whatToStart}`);
        }
    };
    await check(ClientUrl, 'Start the client: `npm run dev` in forceteki-client.');
    await check(`${ServerUrl}/api/test-game-setups`, 'Start the game node: `npm run dev` in forceteki, with ENVIRONMENT="development" in its .env.');
}

/**
 * Starts a browser: Playwright's own Chromium when it is installed (`npx playwright install chromium`), otherwise the
 * Google Chrome installed on this machine. `headed` opens visible windows, to watch a run.
 */
export async function launchBrowser({ headed = false } = {}) {
    try {
        return await chromium.launch({ headless: !headed });
    } catch (error) {
        if (!String(error.message).includes('Executable doesn\'t exist')) {
            throw error;
        }
        return chromium.launch({ channel: 'chrome', headless: !headed });
    }
}

/**
 * A new player: its own browser context with one page. The page's errors and console errors are printed with the
 * player's name, since they are often the first sign of a broken flow.
 */
export async function newPlayer(browser, name, { viewport = { width: 1536, height: 864 } } = {}) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on('pageerror', (error) => console.log(`[${name}] page error: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') {
            console.log(`[${name}] console error: ${message.text().split('\n')[0]}`);
        }
    });
    return { name, context, page };
}

/** Saves a screenshot of the player's page as <label>-<player>.png in {@link OutputDir}, and returns its path. */
export async function screenshot(player, label) {
    mkdirSync(OutputDir, { recursive: true });
    const file = join(OutputDir, `${label}-${player.name}.png`);
    await player.page.screenshot({ path: file });
    return file;
}

/** Waits until every image on the page has loaded: card art arrives after the board, so check this before judging a screenshot. */
export async function waitForImages(page, { timeout = 30_000 } = {}) {
    await page.waitForFunction(() => [...document.images].every((image) => image.complete), null, { timeout });
}

/**
 * Opens a page of the site that holds no game connection (home, /auth, /DeckPage, …) and waits until its network
 * settles. A page `next dev` is compiling for the first time can show its buttons before React has wired them up,
 * and a click then does nothing; waiting for the network to settle gives it time to hydrate.
 */
export async function openPage(player, path) {
    await player.page.goto(`${ClientUrl}${path}`);
    await player.page.waitForLoadState('networkidle');
}

/** The home page's visible tab panel (Quick Match, Create Lobby or, for dev users, Test). */
export const visibleTabPanel = (page) => page.locator('[role=tabpanel]:not([hidden])');

// The development-only test deck buttons below fetch a legal deck for the form's format and card pool from the local
// game node (GET /api/test-deck) and use it straight away, whatever deck the form has.

/** Joins the quick-match queue from the home page with a test deck ("Queue With Test Deck"), in the form's current queue. */
export async function joinQueue(player) {
    await openPage(player, '/');
    await visibleTabPanel(player.page).getByRole('button', { name: 'Queue With Test Deck', exact: true }).click();
    await player.page.waitForURL('**/quickGame');
}

/** Opens a lobby from the home page's Create Lobby tab with a test deck ("Create Game With Test Deck"), and returns its invite link. */
export async function createLobby(player, { isPrivate = true } = {}) {
    await openPage(player, '/');
    await player.page.getByRole('tab', { name: 'Create Lobby' }).click();
    const panel = visibleTabPanel(player.page);
    await panel.getByText(isPrivate ? 'Private' : 'Public', { exact: true }).click();
    await panel.getByRole('button', { name: 'Create Game With Test Deck', exact: true }).click();
    await player.page.waitForURL('**/lobby**');
    return player.page.locator('input[value*="lobbyId="]').inputValue();
}

/** Joins a lobby by its invite link and loads a test deck into it ("Load Test Deck"). */
export async function joinLobby(player, inviteLink) {
    await player.page.goto(inviteLink);
    await player.page.getByRole('button', { name: 'Load Test Deck', exact: true }).click();
    // the ready button appears once the lobby has the player's deck
    await player.page.getByRole('button', { name: 'Mark as ready' }).waitFor();
}

/** Marks both players ready, then has the lobby's owner start the game. */
export async function startLobbyGame(owner, guest) {
    for (const player of [owner, guest]) {
        await player.page.getByRole('button', { name: 'Mark as ready' }).click();
    }
    await owner.page.getByRole('button', { name: 'Start Game', exact: true }).click();
}

/** Waits until every player is on the game board. */
export async function waitForGameBoard(players, { timeout = 30_000 } = {}) {
    await Promise.all(players.map((player) => player.page.waitForURL('**/GameBoard', { timeout })));
}

/** The first of the players whose page shows `text`. */
export function firstShowing(players, text, { timeout = 30_000 } = {}) {
    return Promise.any(players.map((player) => player.page.getByText(text).first().waitFor({ timeout }).then(() => player)));
}

/** The cards in the player's own hand: the [data-card-id] cards along the bottom of the board. */
export async function handCards(page) {
    const handTop = page.viewportSize().height * 0.75;
    const cards = [];
    for (const card of await page.locator('[data-card-id]').all()) {
        const box = await card.boundingBox();
        if (box && box.y > handTop) {
            cards.push(card);
        }
    }
    return cards;
}

/**
 * Plays a new game from the initiative choice to the first action: the flip winner takes the initiative, and both
 * players keep their hands and resource the first two cards in hand. Returns the player who acts first.
 */
export async function playToFirstAction(players) {
    const firstPlayer = await firstShowing(players, 'Choose the player to start with initiative');
    await firstPlayer.page.getByRole('button', { name: 'Yourself', exact: true }).click();
    for (const player of players) {
        await player.page.getByRole('button', { name: 'Keep', exact: true }).click();
    }
    for (const player of players) {
        await player.page.getByText('Select 2 cards to resource').waitFor();
        for (const card of (await handCards(player.page)).slice(0, 2)) {
            await card.click();
        }
        await player.page.getByRole('button', { name: 'Confirm Resources', exact: true }).click();
    }
    await firstPlayer.page.getByText('Choose an action').waitFor();
    return firstPlayer;
}

/**
 * Leaves the game through the in-game Leave game control, which concedes, and sends the opponent home from the
 * game-over screen. Leaving this way frees both players for their next game; closing a page instead leaves its
 * player in the game for a while.
 */
export async function leaveGame(leaver, opponent) {
    const leaveButtons = leaver.page.getByRole('button', { name: 'Leave game', exact: true });
    await leaveButtons.first().click();
    await leaveButtons.last().click();
    await leaver.page.waitForURL(`${ClientUrl}/`);
    await opponent.page.getByRole('button', { name: 'Return Home', exact: true }).click();
    await opponent.page.waitForURL(`${ClientUrl}/`);
}

/** Signs a player in as one of the {@link DevUser} test accounts, and returns the session's user name as a check. */
export async function signInAsDevUser(player, devUser) {
    await openPage(player, '/auth');
    await player.page.getByRole('button', { name: `Login as ${devUser}`, exact: true }).click();
    await player.page.waitForURL(`${ClientUrl}/`);
    const session = await player.page.evaluate(() => fetch('/api/auth/session').then((response) => response.json()));
    return session.user?.name;
}

/** Starts a test game from a file in forceteki's test/gameSetups/, from the home page's Test tab (dev users only). */
export async function startTestGame(player, setupFile = 'testGameTemplate.json') {
    await player.page.getByRole('tab', { name: 'Test' }).click();
    await visibleTabPanel(player.page).getByRole('button', { name: setupFile, exact: true }).click();
    await player.page.waitForURL('**/GameBoard');
}

/** Joins the test game the other dev user started (Test tab, Join Test Game). */
export async function joinTestGame(player) {
    await player.page.getByRole('tab', { name: 'Test' }).click();
    await visibleTabPanel(player.page).getByRole('button', { name: 'Join Test Game', exact: true }).click();
    await player.page.waitForURL('**/GameBoard');
}

/**
 * The main times the game clock shows, as m:ss: the opponent's (top) and the player's own (bottom). The clock is drawn
 * in every public lobby and quick match, timers or not; without timers it stays at 2:00.
 */
export async function readClock(page) {
    const readings = await page.evaluate(() => [...document.querySelectorAll('p, span, div')]
        .filter((element) => element.children.length === 0 && /^\d+:\d\d$/.test(element.textContent.trim()))
        .map((element) => element.textContent.trim()));
    if (readings.length !== 2) {
        throw new Error(`Expected the clock's two main times, found: ${JSON.stringify(readings)}`);
    }
    return { opponent: readings[0], player: readings[1] };
}
