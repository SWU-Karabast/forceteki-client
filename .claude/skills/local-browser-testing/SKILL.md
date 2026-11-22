---
name: local-browser-testing
description: >
  Run the Karabast site locally (this client plus a local forceteki game node) and drive it in a browser with
  Playwright as several players at once: anonymous quick matches and lobbies, the Decks page, test games for the
  dev users Order66 and ThisIsTheWay, and action timers. TRIGGER when: the user asks to test, try, check or
  reproduce something on the local site or in a local game, to play two local players against each other, or to
  verify a client or server change end to end in a browser. Not for the vitest board tests or forceteki's specs.
---

Playwright (`@playwright/test`, a dev dependency) drives the browser. Each player is its own **browser context**,
with its own cookies and storage like a separate incognito window, so two anonymous players, or both dev users,
play each other on plain `http://localhost:3000`. The helpers are in `scripts/playwright/localPlayers.mjs`, and
`scripts/playwright/smoke.mjs` plays the standard flows with them.

**When to run it.** Run a browser test yourself, without asking, when it fits the work: a change players would see or
feel in a game, lobby or queue, once it works and its specs pass. A run takes from about a minute to several (both
servers, then the flows), so skip it for changes no player could see. forceteki's pointer skill lists the kinds of
server change it suits.

**Keep this skill current.** If you change, or notice a change in, anything these steps rely on, update this skill
and the helpers in the same change. That covers the game node's dev routes (`/api/test-deck`,
`/api/test-game-setups`, `/api/start-test-game`), its `.env` switches, the dev users, the client's flows and the
button or tab names the helpers look for. forceteki has a pointer skill of the same name that sends Claude here, and
it lists the server-side facts this skill depends on.

**Improve it from experience, with the user's go-ahead.** If any part of testing with Playwright gave you trouble,
note it and check with the user before changing anything. That includes a step that took several tries, a selector
that didn't match, a wait that timed out, a flow you had to work out, or a server that misbehaved. Then propose a
specific addition to this skill, or a new or fixed helper in `scripts/playwright/`, so the next session doesn't hit
the same problem. Say what went wrong and what you would add, and make the change only once they agree.

**Not covered yet:**
- **Accounts in local DynamoDB.** Always run with `USE_LOCAL_DYNAMODB="false"`. Testing against the DynamoDB container
  in forceteki's `docker-compose.yml` would be a later addition to this skill, or a skill of its own.
- **Local S3 for cosmetics.** This repo's `docker-compose.yml` runs Adobe S3Mock on port 9090 (`docker compose up`, then
  `USE_LOCAL_S3=true` in `.env.local`). It is mainly for customization work, and whether it still works is
  unverified, so exploring it is future work.
- **Real Google or Discord sign-in.** The dev users stand in for it; never type real credentials.

## 1. Set up (once per machine)

1. Check out `forceteki-client` and `forceteki` side by side in one folder, with the Node version each repo's
   `engines` asks for.
2. Run `npm install` here. The helpers use Playwright's own Chromium when it is installed, and otherwise the Google
   Chrome on the machine, so where Chrome exists nothing else is needed. Installing Chromium with
   `npx playwright install chromium` downloads about 150 MB, so ask the user first.
3. In forceteki, run `npm install`, then `npm run check-card-data`. If it exits 1, run `npm run get-cards`.
4. forceteki's `.env` (created by `npm run dev` if missing; never commit it, never print it, since it holds
   secrets) needs these lines:
   - `ENVIRONMENT="development"`, which enables the dev users and the test routes;
   - `USE_LOCAL_DYNAMODB="false"`, always, for this skill;
   - `USE_LOCAL_ACTION_TIMER="false"`, unless the task is about timers (section 4).

   Edit only the lines you need, and tell the user about every change you make. Leave the other dev switches
   alone unless the task needs them: `FORCE_BLOCK_BO3_ANON_LOCAL` and `FORCE_ENABLE_ANON_CHAT`, plus this repo's
   `NEXT_PUBLIC_FORCE_ENABLE_ANON_CHAT`.

## 2. Start and stop the servers

- **First, check ports 3000 and 9500.** If something already listens there, find out whether the user started it,
  and ask before stopping it.
- **Game node.** In forceteki run `npm run dev`. It builds the server and tests (about 20 s incrementally) and then
  logs `GameServer: listening on port 9500`. After an `.env`-only change, restart without the build:
  `NODE_ENV=development node ./build/server/gamenode` (about 1 s). After a code change or a branch switch, use
  `npm run dev`.
- **Client.** Here, run `npm run dev` and wait for `Ready in`. The first page load then compiles for a few seconds.
- Start both in the background with their output in log files, and wait for those lines. `smoke.mjs` checks both
  answer before it starts, and asks the game node through a development-only route.
- **To stop a server,** kill the process listening on its port, with its children: `netstat -ano | grep :9500` then
  `taskkill //PID <pid> //T //F` from Git Bash on Windows, or `kill $(lsof -ti :9500)` elsewhere. Killing the game
  node also ends its `npm run dev`.
- **A game-node restart forgets every lobby, game and in-memory account.** The dev users come back on startup.
- **After a branch switch in either repo,** run `npm install` there (and `check-card-data` in forceteki), then
  restart that repo's server. A `next dev` left running while packages changed under it serves broken pages.

## 3. Drive the browser

- **Standard flows.** Run `node scripts/playwright/smoke.mjs <quick-match|lobby|deck-page|dev-users|timer|all>
  [--headed]`. It saves screenshots in `test-results/playwright/` (gitignored), and a failure also screenshots
  every player. Run `all` first to confirm the setup works: four scenarios, about 25 s.
- **Task-specific checks.** Write an ESM script outside the repo (your scratchpad) that imports the helpers by
  absolute path, run it with `node`, and read the PNGs it saves. For example:

  ```js
  import { checkServers, launchBrowser, newPlayer, joinQueue, waitForGameBoard, playToFirstAction, waitForImages,
      screenshot } from 'file:///C:/path/to/forceteki-client/scripts/playwright/localPlayers.mjs';

  await checkServers();
  const browser = await launchBrowser();          // { headed: true } opens windows the user can watch
  try {
      const players = [await newPlayer(browser, 'p1'), await newPlayer(browser, 'p2')];
      await Promise.all(players.map(joinQueue));
      await waitForGameBoard(players);
      const firstPlayer = await playToFirstAction(players);
      // ... the steps under test, then:
      await waitForImages(firstPlayer.page);
      console.log(await screenshot(firstPlayer, 'my-check'));
  } finally {
      await browser.close();
  }
  ```

Rules of thumb:
- **One context per player** (`newPlayer`). Two players in one context share cookies and the anonymous id
  (`localStorage.anonymousUserId`), so they are the same user.
- **Find elements as a user would,** by role and visible name (`getByRole('button', { name: 'Join Queue', exact:
  true })`), the way the helpers do. Cards are the exception: hand cards are the `[data-card-id]` elements along the
  bottom of the board (`handCards`), and cards in play carry `data-card-uuid`.
- **Wait for what the user would see** (a text, a URL) rather than sleeping; locators wait on their own. Card art
  arrives after the board, so call `waitForImages` before judging a screenshot.
- **Open pages without a game on them with `openPage(player, path)`**, not `page.goto`. On a page `next dev` is
  compiling for the first time, the buttons can show before React has wired them up, so a click does nothing.
  `openPage` waits for the network to settle first. The helpers already use it.
- **Look at the page errors `newPlayer` prints.** A new one is often the first sign of a broken flow. React's
  `In HTML, <div> cannot be a descendant of <p>` warning is existing noise.
- **Leave games through the UI** (`leaveGame`). A player whose page just closes stays in the game for a while, and the
  server can refuse their next game ("You must wait at least 20s before creating a new game").

## 4. The scenarios

**Two anonymous players, quick match** is the fastest way to get a game: `joinQueue` for both (Quick Match tab,
Queue With Test Deck), then `waitForGameBoard`, then `playToFirstAction`. Both join the form's default queue
(Premier, current card pool, best of one) and are matched within seconds. Use a lobby or a test game only when
that is what is under test, or when a particular board is needed.

**Lobby.** `createLobby(owner, { isPrivate })` returns the invite link (`http://localhost:3000/lobby?lobbyId=…`);
`joinLobby(guest, link)` opens it and loads a test deck; `startLobbyGame` readies both and starts. A public
lobby also shows under Available Lobbies on the home page. Private games have chat and no clock; public ones have
the clock.

**Decks page** (`/DeckPage`). An anonymous player's decks live in localStorage, and a signed-in user's on the
server (in memory locally). Add New Deck takes only a deckbuilder link, never JSON, and resolving one calls a
third-party site, so ask before doing it. The development-only test deck buttons need no outside site: **Queue With Test
Deck**, **Create Game With Test Deck** and, in a lobby, **Load Test Deck** each get a legal deck the game node builds
for the selected format and card pool (`GET /api/test-deck`) and use it straight away, whatever deck the form holds.
Each has an info tooltip saying so.

**Dev users and test games.** `signInAsDevUser(player, DevUser.Order66)` uses the dev sign-in on `/auth`. These
accounts exist only in development and skip OAuth and the email checks. Dev users get a Test tab listing the
files in forceteki's `test/gameSetups/`. `startTestGame(player, file)` starts that board as Order66 against
ThisIsTheWay, and `joinTestGame(other)` brings the other dev user in. The files use the same schema as
`setupTestAsync` in forceteki's specs. Only `testGameTemplate.json` is committed; write task-specific setups there
(they are gitignored) and leave the user's own, such as `local.json`, alone. ThisIsTheWay also sees mock SWU Stats
decks in the deck forms.

**Action timers** run only in public lobbies and quick matches, and locally only when the game node starts with
`USE_LOCAL_ACTION_TIMER="true"`. Restart it after the change, and set it back to `"false"` when done. The clock at
the top right is drawn in those games even with timers off, frozen at 2:00, so "the timer works" means it counts
down:
- Each prompt first runs 20 s of turn time, shown by the ring.
- Then the 2:00 of main time runs, shown as text, with warnings at 0:30 and 0:10.
- A player whose main time runs out loses.

`readClock(page)` returns `{ opponent, player }`, and `smoke.mjs timer` checks the countdown.

## 5. Where local differs from production

Mention these when reporting, because a local pass cannot rule them out:
- **The game node's development config** (forceteki's `server/gamenode/GameNodeConfig.ts`):
  - anonymous players may spectate and play best-of-three, which production blocks;
  - there is no rematch cooldown;
  - timers are off;
  - anonymous chat is off unless forced on.
- **No DynamoDB.** Accounts live in memory, and there are no roles, server settings (maintenance mode), cosmetics or
  moderation.
- **Dev users** skip OAuth, email verification and account creation.
- **Everything is on one machine.** There is no latency, so races between players rarely show. `next dev` is not the
  production build, and the card data is the game node's local copy.
- **Cookies.** Production sessions are Secure cookies on `.karabast.net`; local ones are host-only on `localhost`.

## 6. Finish

Close the browser (in a `finally`), stop the servers you started, and leave any the user was already running. Set
`USE_LOCAL_ACTION_TIMER` back to `"false"` if you turned it on, and report every `.env` change you made.
