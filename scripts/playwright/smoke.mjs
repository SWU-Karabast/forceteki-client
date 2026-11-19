// `node scripts/playwright/smoke.mjs <scenario>... [--headed]` plays standard flows on the local site in a browser, as
// two players at once, and saves screenshots in test-results/playwright/ (gitignored). It needs this client
// (`npm run dev`) and a local forceteki game node (`npm run dev` there) to be running.
//
// Scenarios:
//   quick-match  two anonymous players queue, are matched and play to the first action, then one leaves
//   lobby        an anonymous player opens a private lobby, a second joins by its link, both ready up and the game starts
//   deck-page    an anonymous player's Decks page
//   dev-users    Order66 starts testGameTemplate.json from the Test tab and ThisIsTheWay joins it
//   timer        a quick match whose clock counts down; needs the game node started with USE_LOCAL_ACTION_TIMER="true"
//   all          every scenario except timer, which needs the game node started differently
// --headed opens the browser windows, to watch a run.

import {
    checkServers, ClientUrl, createLobby, DevUser, firstShowing, joinLobby, joinQueue, joinTestGame, launchBrowser,
    leaveGame, newPlayer, OutputDir, playToFirstAction, readClock, screenshot, signInAsDevUser, startLobbyGame,
    startTestGame, waitForGameBoard, waitForImages,
} from './localPlayers.mjs';

const other = (players, player) => players.find((candidate) => candidate !== player);
const seconds = (clock) => clock.split(':').reduce((minutes, part) => minutes * 60 + Number(part), 0);

/** Screenshots every player once their card art has loaded (or after 10 s, whichever comes first). */
async function snap(players, label) {
    for (const player of players) {
        await waitForImages(player.page, { timeout: 10_000 }).catch(() => console.log(`  (${player.name}: some images still loading)`));
        console.log(`  screenshot ${await screenshot(player, label)}`);
    }
}

const scenarios = {
    'quick-match': async (addPlayer) => {
        const players = [await addPlayer('p1'), await addPlayer('p2')];
        await Promise.all(players.map(joinQueue));
        await waitForGameBoard(players);
        const firstPlayer = await playToFirstAction(players);
        await snap(players, 'quick-match-first-action');
        await leaveGame(firstPlayer, other(players, firstPlayer));
    },

    lobby: async (addPlayer) => {
        const [owner, guest] = [await addPlayer('owner'), await addPlayer('guest')];
        const inviteLink = await createLobby(owner);
        await joinLobby(guest, inviteLink);
        await startLobbyGame(owner, guest);
        await waitForGameBoard([owner, guest]);
        await snap([owner, guest], 'lobby-game-start');
        await leaveGame(owner, guest);
    },

    'deck-page': async (addPlayer) => {
        const player = await addPlayer('p1');
        await player.page.goto(`${ClientUrl}/DeckPage`);
        await player.page.getByText('No decks found').waitFor();
        await snap([player], 'deck-page');
    },

    'dev-users': async (addPlayer) => {
        const order66 = await addPlayer(DevUser.Order66);
        const theWay = await addPlayer(DevUser.ThisIsTheWay);
        for (const player of [order66, theWay]) {
            const signedInAs = await signInAsDevUser(player, player.name);
            if (signedInAs !== player.name) {
                throw new Error(`Signing in as ${player.name} gave a session for ${signedInAs}`);
            }
        }
        await startTestGame(order66);
        await joinTestGame(theWay);
        for (const player of [order66, theWay]) {
            for (const devUser of Object.values(DevUser)) {
                await player.page.getByText(devUser, { exact: true }).first().waitFor();
            }
        }
        await snap([order66, theWay], 'dev-users-test-game');
        await leaveGame(order66, theWay);
    },

    timer: async (addPlayer) => {
        const players = [await addPlayer('p1'), await addPlayer('p2')];
        await Promise.all(players.map(joinQueue));
        await waitForGameBoard(players);
        const onTheClock = await firstShowing(players, 'Choose the player to start with initiative');
        const before = await readClock(onTheClock.page);
        // a prompt's 20 s of turn time runs first (the ring), then main time (the text)
        await onTheClock.page.waitForTimeout(26_000);
        const after = await readClock(onTheClock.page);
        console.log(`  main time of the player to act: ${before.player} -> ${after.player}`);
        if (seconds(after.player) >= seconds(before.player)) {
            throw new Error('The clock did not count down: was the game node started with USE_LOCAL_ACTION_TIMER="true"?');
        }
        await snap(players, 'timer-clock');
        await leaveGame(onTheClock, other(players, onTheClock));
    },
};

const args = process.argv.slice(2);
const headed = args.includes('--headed');
let names = args.filter((arg) => !arg.startsWith('--'));
if (names.includes('all')) {
    names = Object.keys(scenarios).filter((name) => name !== 'timer');
}
if (names.length === 0 || names.some((name) => !scenarios[name])) {
    console.log(`Usage: node scripts/playwright/smoke.mjs <${[...Object.keys(scenarios), 'all'].join('|')}>... [--headed]`);
    process.exit(1);
}

await checkServers();
const browser = await launchBrowser({ headed });
let failures = 0;
try {
    for (const name of names) {
        const started = Date.now();
        const players = [];
        const addPlayer = async (playerName) => {
            const player = await newPlayer(browser, playerName);
            players.push(player);
            return player;
        };
        console.log(`${name}:`);
        try {
            await scenarios[name](addPlayer);
            console.log(`PASS ${name} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
        } catch (error) {
            failures++;
            console.log(`FAIL ${name}: ${error.message.split('\n').slice(0, 3).join(' ')}`);
            for (const player of players) {
                console.log(`  failure screenshot ${await screenshot(player, `${name}-failure`).catch(() => '(none)')}`);
            }
        } finally {
            await Promise.all(players.map((player) => player.context.close()));
        }
    }
} finally {
    await browser.close();
}
console.log(`Screenshots are in ${OutputDir}`);
process.exitCode = failures > 0 ? 1 : 0;
