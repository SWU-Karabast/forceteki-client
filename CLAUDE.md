# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The web client for **Karabast**, a Star Wars: Unlimited game engine. It is a Next.js 14 App Router
frontend that is nearly useless on its own: essentially all game logic, matchmaking, user records and
deck storage live in the separate [forceteki](https://github.com/SWU-Karabast/forceteki) backend, which
this client talks to over a socket.io websocket plus a REST API. `NEXT_PUBLIC_ROOT_URL` (default
`http://localhost:9500`, see `.env.development`) points at that server.

## Commands

```bash
npm run dev          # dev server on :3000
npm run lint         # tsc --noemit && next lint   <- what CI runs; run this before finishing
npm run lint:fix     # same, with --fix
npm run build        # next build (does NOT lint: eslint.ignoreDuringBuilds is true in next.config.mjs)
npm run storybook    # component workbench on :6006
docker compose up    # Adobe S3Mock on :9090, only needed for local cosmetics upload work
```

Node 22.x. There is **no test framework** in this repo — verification is `npm run lint`, `npm run build`,
and manual play against a local backend. CI (`.github/workflows/pullrequest.yml`) runs lint and build only.

## Architecture

### Provider stack and the websocket boundary

`src/app/layout.tsx` → `ClientLayout.tsx` decides the shape of the tree by pathname:

- `/GameBoard`, `/lobby`, `/quickGame` get `ClientProviders` **+ `GameProvider`** and **no navbar**.
- Everything else gets `ClientProviders` + navbar, and therefore has no socket.

`ClientProviders` is `dynamic(..., { ssr: false })`, so effectively the whole app is client-rendered;
nearly every component carries `'use client'`. Nesting order (outermost first): `SessionProvider` →
`ServerSettings` → `User` → `CardImageLocale` → `TimerVisibility` → `Popup` → `OngoingEffectHighlight` →
`Cosmetics` → `Theme`.

### Game.context.tsx is the hub

`src/app/_contexts/Game.context.tsx` owns the single socket.io connection (`path: '/ws'`) and is the only
place server state enters the app. It re-creates the socket whenever user/session identity changes.
Everything on a game page reads `useGame()`.

Three outbound channels:

- `sendGameMessage([command, ...args])` → `socket.emit('game', ...)` — in-game actions. Commands are
  usually not hardcoded; the server sends `promptState.buttons` with `{ command, arg, uuid }` and the UI
  echoes them back.
- `sendLobbyMessage([command, ...args])` → `socket.emit('lobby', ...)` — `setReadyStatus`, `updateDeck`,
  `startGameAsync`, `rematch`, `sendChatMessage`, `submitReport`, `updateSetting`, …
- `sendMessage(event, args)` — raw emit.

Inbound: `gamestate`, `lobbystate`, `queueHeartbeat`, `retransmitResponse`, `bugReportResult`,
`playerReportResult`, `statsSubmitNotification`, `requestScreenResolution`, `connection_error`,
`matchmakingFailed`, `inactiveDisconnect`.

`gameState` / `lobbyState` are intentionally typed `any` (the file disables `no-explicit-any`) — they are
whatever the backend sends. Chat is delta-encoded: `useGameMessages` detects gaps and asks for a
`retransmitGameMessages` range.

### Popups are driven by game state, not by clicks

`Popup.context.tsx` holds a stack of discriminated-union `PopupData`. `Game.context`'s
`handleGameStatePopups` translates the connected player's `promptState` into popups on every gamestate,
and `prunePromptStatePopups(promptUuid)` drops stale server-sourced popups while leaving
`PopupSource.User` ones alone. Add a popup kind by extending the union in `Popup.types.ts` and adding a
variant component under `Popup/PopupVariant/`.

### Deck providers

`src/app/_utils/deckProviders/` imports decklists from ~16 third-party deckbuilder sites. Each is a
`DeckProviderBase` subclass declaring host match, API URL, tag color, and error overrides; the base class
handles fetching and error mapping. **Adding a provider = one subclass + one entry in
`core/registry.ts`** — `determineDeckSource`, `supportedDeckHosts`, the public supported-sites list, and
DeckPage tag styling all derive from that array. Order matters (first `matches` wins). Errors are always
`DeckFetchError` with a `reason` callers switch on.

In dev, `src/app/api/deck-proxy/route.ts` forwards these requests server-side because provider CORS
allowlists only accept `https://karabast.net`. It deliberately re-checks CORS as prod would, so a
genuinely broken provider still fails locally.

### Card images

All card art is on S3 under `cards/{SET}/{locale}/{format}/{size}/`. Build URLs with
`s3CardImageURL()` / `s3ImageURL()` from `_utils/s3Utils.ts` — never hand-assemble one. Bump
`CARD_IMAGE_CACHE_VERSION` in `_constants/constants.ts` to bust browser caches. `images-scripts/process_cards.py`
is the Python pipeline that produces and uploads them (see its README).

### Auth and roles

NextAuth (Google + Discord) with a custom JWT encode/decode in `_utils/auth.ts`, so the same token can be
handed to the backend as `auth: { token }` on the socket. Anonymous play is first-class: `User.context`
mints a uuid into `localStorage.anonymousUserId` when there is no session, and deck storage forks on this
(`ServerAndLocalStorageUtils.ts`: server for logged-in users, localStorage for anonymous). Admin API routes
wrap handlers in `withAdminAuth(role, handler)`, which delegates the role check to the backend and is a
no-op in development.

### Server settings / maintenance

`ServerSettings.context` polls the backend every 20s. `gamesEnabled` defaults to **false**, so an
unreachable backend reads as maintenance; gate maintenance UI on `hasLoaded` too, or every page load
flashes it. The client-side gate is presentation only — the server 503s anyway.

## Conventions

- **Directory naming**: `_`-prefixed dirs under `src/app` (`_components`, `_contexts`, `_hooks`,
  `_utils`, `_services`, `_constants`, `_theme`, `_validators`) are App Router private folders — not routes.
  Shared UI goes in `_components/_sharedcomponents/`, feature UI in `_components/<Feature>/_subcomponents/`.
- **Path alias**: `@/*` → `./src/*`.
- **Styling**: MUI v7 with Emotion. The house pattern is a local `const styles = { ... }` object under a
  `// ----------------Styles----------------//` comment, spread into `sx`. No CSS modules, no Tailwind.
  The theme (`_theme/theme.ts`) is dark-only and adds custom device breakpoints (`iphoneSE`, `ipadMini`,
  `desktopHD`, `xxl`, …) and custom typography variants — extend it rather than hardcoding sizes.
- **Types**: interfaces are `I`-prefixed (`IGameContextType`, `IDeckData`, `IBoardProps`). Component prop
  types live in a sibling `*Types.ts` / `*.types.ts` file.
- **Lint style is enforced, not advisory** (`@stylistic`): 4-space indent, single quotes, no padded blocks,
  `{ spaced: true }` object curlies, blank line before block comments. `npm run lint` gates PRs.
- **SVGs** import as React components via SVGR (`src/assets/**`), with `fill` rewritten to `currentColor`.
- **Debug flags** are env-driven and read through `_utils/debug.ts` (`debugBorder()`, breakpoint overlay,
  hand-scaling info) — see `.env.local.example`.
- **Storybook** stories live in `src/stories/` as `ComponentName.stories.tsx`.
