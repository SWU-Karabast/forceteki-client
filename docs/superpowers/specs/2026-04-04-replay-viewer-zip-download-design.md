# Replay Viewer & Zip Download — Design Spec

## Overview

Two client-side features:
1. **Zip download** — Bundle `.swupgn` + `.swureplay` into a single `.zip` from the end-game screen
2. **Replay viewer** — Upload a `.swureplay` file to `/replay` and watch the game play out using the existing board components

The server already sends `gameState.swuPgn` and `gameState.swuReplay` to the client. No server changes needed.

---

## Part 1: Zip Download

### Changes to `DownloadGameLog.tsx`

Replace the "Download SWU-PGN" button with a "Download Game Files" button.

**New helper:**
```typescript
async function triggerZipDownload(swuPgn: string, swuReplay: string) {
  const { zipSync, strToU8 } = await import('fflate');
  const zipped = zipSync({
    'game.swupgn': strToU8(swuPgn),
    'game.swureplay': strToU8(swuReplay),
  });
  const date = new Date().toISOString().split('T')[0];
  const blob = new Blob([zipped], { type: 'application/zip' });
  // trigger download as game-YYYY-MM-DD.zip
}
```

- Button disabled if either `gameState.swuPgn` or `gameState.swuReplay` is missing
- Existing "Download Game Log" (txt) button unchanged
- Console helper `__downloadGameFiles()` replaces `__downloadSwuPgn()`

**Dependency:** `fflate` (~8KB gzipped, synchronous API, no dependencies)

---

## Part 2: Replay Viewer

### Architecture

```
/replay page (no GameProvider, no socket)
  ReplayProvider (provides IBoardState + transport controls)
    Header (game metadata from file)
    OpponentCardTray (existing, uses useBoardState())
    Board (existing, uses useBoardState())
    PlayerCardTray (existing, uses useBoardState())
    TransportControls (play/pause, speed, step, scrub bar)
```

### Shared Board Interface — `useBoardState()` Hook

**New file:** `src/app/_hooks/useBoardState.ts`

```typescript
interface IBoardState {
  gameState: any;
  connectedPlayer: string;
  getOpponent: (player: string) => string;
  isSpectator: boolean;
  gameMessages: IChatEntry[];
}
```

The hook checks for `ReplayContext` first, falls back to `GameContext`. Neither is required — it checks which is available. This lets existing board components work in both live game and replay contexts with a single import change.

**Components to update** (`useGame()` -> `useBoardState()` for board-state fields):
- `Board.tsx`
- `PlayerCardTray.tsx` (and sub-components reading gameState/connectedPlayer)
- `OpponentCardTray.tsx`
- `GameBoard/page.tsx` (rendering parts only — keeps `useGame()` for interactive actions)

Components needing `sendGameMessage`, `sendLobbyMessage`, popup handling, etc. continue using `useGame()` directly.

### ReplayContext

**New file:** `src/app/_contexts/Replay.context.tsx`

```typescript
interface IReplayContextType extends IBoardState {
  // Replay data
  snapshots: ReplaySnapshot[];
  events: ReplayEvent[];
  currentIndex: number;
  totalSnapshots: number;
  header: Record<string, string>;

  // Transport
  play: () => void;
  pause: () => void;
  isPlaying: boolean;
  speed: number;              // 0.5, 1, 2, 4
  setSpeed: (s: number) => void;
  stepForward: () => void;
  stepBack: () => void;
  seekTo: (index: number) => void;

  // Perspective
  togglePerspective: () => void;
}
```

**Behavior:**
- Receives parsed replay data as props
- `gameState` = `snapshots[currentIndex].snapshot`
- `play()` starts `setInterval` advancing `currentIndex` (1x = 2000ms, 2x = 1000ms, 4x = 500ms, 0.5x = 4000ms)
- `connectedPlayer` defaults to `"Player 1"`, toggled by `togglePerspective()`
- `getOpponent()` returns the other player key from the snapshot's `players` object
- `isSpectator` always `true`
- `gameMessages` populated from granular events between previous and current snapshot, converted to `IChatEntry[]`

### Replay Parser

**New file:** `src/app/_utils/replayParser.ts`

```typescript
interface ParsedReplay {
  header: Record<string, string>;
  cardIndex: string;
  events: ReplayEvent[];
  snapshots: ReplaySnapshot[];  // lazy-parsed
}

interface ReplayEvent {
  seq: string;
  type: string;
  [key: string]: any;
}

interface ReplaySnapshot {
  seq: string;
  snapshot: any;
}
```

**Parsing logic:**
1. Split by lines
2. Header section: lines matching `[TagName "value"]` until `═══ CARD INDEX ═══`
3. Card index: lines until `=== REPLAY ===`
4. Replay lines: JSON.parse each, classify by `seq` ending in `-snapshot`

**Lazy snapshot parsing:** Store snapshot lines as raw strings. Parse JSON on demand when `seekTo()` is called. Cache in `Map<number, any>`.

**Zip handling:** If uploaded file is `.zip`, use `fflate.unzipSync()` to extract the `.swureplay` file.

### File Upload Component

**New file:** `src/app/_components/Replay/FileUpload.tsx`

- Drag-and-drop area with visual feedback on drag-over
- Click to open file browser
- Accepts `.swureplay` and `.zip`
- Reads file, runs parser, passes `ParsedReplay` up via callback
- Error state for invalid files or zips missing `.swureplay`
- MUI dark theme styling, board background

### Transport Controls

**New file:** `src/app/_components/Replay/TransportControls.tsx`

Bottom overlay bar (~60px), semi-transparent dark background:

- **Play/Pause** button
- **Step back / Step forward** buttons
- **Speed selector** — 0.5x, 1x, 2x, 4x
- **Scrub bar** — MUI Slider, 0 to totalSnapshots - 1
- **Position label** — "12 / 87" format
- **Round indicator** — parsed from current seq (e.g., "R3.A" -> "Round 3, Action Phase")

**Keyboard shortcuts:**
- Space: play/pause
- Left/Right arrow: step back/forward
- `[` / `]`: decrease/increase speed

### Replay Page

**New file:** `src/app/replay/page.tsx`

Two states:
1. **No replay loaded:** `FileUpload` centered, game branding
2. **Replay loaded:** Full board layout wrapped in `<ReplayProvider>`:
   - Header bar with game metadata (leaders, bases, result)
   - `OpponentCardTray` (top)
   - `Board` (center)
   - `PlayerCardTray` (bottom)
   - `TransportControls` (bottom overlay)
   - Perspective toggle button

Not in `pagesWithWebsocket` — no `GameProvider`, no socket.

---

## File Inventory

### New files
| File | Purpose |
|------|---------|
| `src/app/_hooks/useBoardState.ts` | Unified hook bridging GameContext and ReplayContext |
| `src/app/_contexts/Replay.context.tsx` | Replay playback state and transport controls |
| `src/app/_utils/replayParser.ts` | Parse `.swureplay` files (lazy snapshots) |
| `src/app/replay/page.tsx` | Replay viewer page |
| `src/app/_components/Replay/FileUpload.tsx` | Drag-and-drop file upload |
| `src/app/_components/Replay/TransportControls.tsx` | Playback controls overlay |

### Modified files
| File | Change |
|------|--------|
| `DownloadGameLog.tsx` | Replace SWU-PGN button with zip download |
| `Board.tsx` | `useGame()` -> `useBoardState()` |
| `PlayerCardTray.tsx` | `useGame()` -> `useBoardState()` |
| `OpponentCardTray.tsx` | `useGame()` -> `useBoardState()` |
| `GameBoard/page.tsx` | `useBoardState()` for rendering, keep `useGame()` for actions |
| Sub-components of trays calling `useGame()` | Same treatment |
| `package.json` | Add `fflate` |

---

## Edge Cases

- **Missing `promptState`**: `isSpectator: true` means board components skip prompt rendering. Snapshots may have `promptState: null` — components already null-check.
- **Player IDs**: Snapshots use `"Player 1"` / `"Player 2"`. ReplayContext `connectedPlayer` and `getOpponent()` use these same keys. No mismatch.
- **Empty chat**: No chat drawer on replay page. `gameMessages` in ReplayContext contains event narration as `IChatEntry[]` for any component that references it.
- **Large files**: Lazy snapshot parsing keeps memory proportional to current view.
- **`lobbyState` references**: Some components check `lobbyState` (Bo3 mode). Not provided by ReplayContext. Existing null-checks (`lobbyState?.winHistory`) degrade gracefully.
- **Card images**: Snapshots include `setId: { set, number }` — `s3CardImageURL()` works without changes.
