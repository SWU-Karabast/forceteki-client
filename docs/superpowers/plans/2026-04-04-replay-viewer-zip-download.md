# Replay Viewer & Zip Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a zip download for game files (.swupgn + .swureplay) and build a /replay page that plays back .swureplay files using existing board components.

**Architecture:** A shared `useBoardState()` hook bridges a new `ReplayContext` and the existing `GameContext`, letting board components render in both live and replay modes. The replay page parses uploaded .swureplay files into snapshots and feeds them to existing board components via `ReplayProvider`. Zip creation and extraction use `fflate`.

**Tech Stack:** Next.js 14 App Router, React 18, MUI 6, fflate (zip), Socket.IO (existing, not used by replay)

**Note:** This client project has no test framework. Steps focus on implementation and manual verification.

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/app/_hooks/useBoardState.ts` | Unified hook: checks ReplayContext, falls back to GameContext |
| `src/app/_contexts/Replay.context.tsx` | Replay state management, transport controls, perspective toggle |
| `src/app/_utils/replayParser.ts` | Parse .swureplay files; owns shared types (ParsedReplay, ReplayEvent, ReplaySnapshot) |
| `src/app/replay/page.tsx` | Replay viewer page with file upload and board rendering |
| `src/app/_components/Replay/FileUpload.tsx` | Drag-and-drop .swureplay / .zip upload |
| `src/app/_components/Replay/TransportControls.tsx` | Play/pause, speed, step, scrub bar, keyboard shortcuts |

### Modified files
| File | Change |
|------|--------|
| `package.json` | Add `fflate` dependency |
| `src/app/_components/_sharedcomponents/Preferences/_subComponents/DownloadGameLog.tsx` | Replace SWU-PGN button with zip download |
| `src/app/_contexts/Game.context.tsx` | Export `GameContext` object (currently only exports `GameProvider` and `useGame`) |
| `src/app/_components/Gameboard/Board/Board.tsx` | `useGame()` → `useBoardState()` |
| `src/app/_components/Gameboard/PlayerCardTray/PlayerCardTray.tsx` | `useGame()` → `useBoardState()` |
| `src/app/_components/Gameboard/OpponentCardTray/OpponentCardTray.tsx` | `useGame()` → `useBoardState()` |
| `src/app/_components/Gameboard/_subcomponents/UnitsBoard.tsx` | `useGame()` → `useBoardState()` |
| `src/app/_components/Gameboard/_subcomponents/PlayerTray/PlayerHand.tsx` | `useGame()` → `useBoardState()` |
| `src/app/_components/Gameboard/_subcomponents/PlayerTray/Credits.tsx` | `useGame()` → `useBoardState()` |
| `src/app/_components/Gameboard/_subcomponents/PlayerTray/DeckDiscard.tsx` | `useGame()` → `useBoardState()` |
| `src/app/_components/Gameboard/_subcomponents/PlayerTray/Resources.tsx` | `useGame()` → `useBoardState()` |

### NOT modified (stay on `useGame()` — need interactive fields)
| File | Why |
|------|-----|
| `_subcomponents/PlayerTray/CardActionTray.tsx` | Uses `sendGameMessage`, `distributionPromptData`, `getConnectedPlayerPrompt` |
| `_subcomponents/Overlays/ChatDrawer/ChatDrawer.tsx` | Uses `sendGameMessage` |
| `GameBoard/page.tsx` | Uses `lobbyState` for routing, `promptState` for central prompt display — replay page has its own page component |

---

## Execution Order

Tasks 1-3 are independent. Tasks 4-7 form a group (execute in order: **7 → 4 → 5 → 6**, commit together at end of Task 6). Tasks 8-10 are sequential. Task 11 is verification.

**Recommended order:** 1 → 2 → 3 → 7 → 4 → 5 → 6 (commit) → 8 → 9 → 10 → 11

---

### Task 1: Install fflate

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install fflate**

Run:
```bash
npm install fflate
```

- [ ] **Step 2: Verify installation**

Run:
```bash
node -e "require('fflate'); console.log('fflate OK')"
```
Expected: `fflate OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add fflate dependency for zip creation/extraction"
```

---

### Task 2: Update DownloadGameLog.tsx — Zip Download

**Files:**
- Modify: `src/app/_components/_sharedcomponents/Preferences/_subComponents/DownloadGameLog.tsx`

- [ ] **Step 1: Add zip download handler and replace SWU-PGN button**

Replace the full content of `DownloadGameLog.tsx` with:

```tsx
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PreferenceButton from './PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';
import { generateHumanNotation } from '@/app/_utils/gameLogGenerator';

function triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function DownloadGameLog() {
    const { gameMessages, gameState, connectedPlayer } = useGame();
    const [loadingLog, setLoadingLog] = useState(false);
    const [loadingZip, setLoadingZip] = useState(false);

    const getPlayerNames = (): { p1Name: string; p2Name: string } | null => {
        if (!gameState?.players) return null;
        const playerIds = Object.keys(gameState.players);
        if (playerIds.length < 2) return null;
        return {
            p1Name: gameState.players[playerIds[0]].name,
            p2Name: gameState.players[playerIds[1]].name,
        };
    };

    const handleDownloadLog = () => {
        // Prefer server-generated raw game log (includes subtitles)
        if (gameState?.rawGameLog) {
            triggerDownload(gameState.rawGameLog, 'game-log.txt', 'text/plain');
            return;
        }

        // Fall back to client-side generation
        const names = getPlayerNames();
        if (!names || !gameMessages.length) return;

        setLoadingLog(true);
        try {
            const rawLog = generateHumanNotation(gameMessages, names.p1Name, names.p2Name);
            triggerDownload(rawLog, 'game-log.txt', 'text/plain');
        } finally {
            setLoadingLog(false);
        }
    };

    const handleDownloadZip = async () => {
        if (!gameState?.swuPgn || !gameState?.swuReplay) return;

        setLoadingZip(true);
        try {
            const { zipSync, strToU8 } = await import('fflate');
            const zipped = zipSync({
                'game.swupgn': strToU8(gameState.swuPgn),
                'game.swureplay': strToU8(gameState.swuReplay),
            });
            const date = new Date().toISOString().split('T')[0];
            const blob = new Blob([zipped], { type: 'application/zip' });
            triggerBlobDownload(blob, `game-${date}.zip`);
        } finally {
            setLoadingZip(false);
        }
    };

    // Expose console helpers for manual downloads
    useEffect(() => {
        (window as any).__downloadGameLog = () => {
            handleDownloadLog();
            return 'Download triggered';
        };
        (window as any).__downloadGameFiles = () => {
            handleDownloadZip();
            return 'Download triggered';
        };
        return () => {
            delete (window as any).__downloadGameLog;
            delete (window as any).__downloadGameFiles;
        };
    }, [gameMessages, gameState, connectedPlayer]);

    const hasZipData = !!gameState?.swuPgn && !!gameState?.swuReplay;
    const hasLogData = !!gameState?.rawGameLog || gameMessages.length > 0;

    const styles = {
        contentContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            mb: '20px',
        },
        typeographyStyle: {
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
    };

    return (
        <>
            <Box sx={styles.contentContainer}>
                <PreferenceButton
                    variant={'standard'}
                    text={loadingLog ? 'Loading...' : 'Download Game Log'}
                    buttonFnc={handleDownloadLog}
                    disabled={loadingLog || !hasLogData}
                />
                <Typography sx={styles.typeographyStyle}>
                    Download the raw game log as a text file.
                </Typography>
            </Box>
            <Box sx={styles.contentContainer}>
                <PreferenceButton
                    variant={'standard'}
                    text={loadingZip ? 'Loading...' : 'Download Game Files'}
                    buttonFnc={handleDownloadZip}
                    disabled={loadingZip || !hasZipData}
                />
                <Typography sx={styles.typeographyStyle}>
                    Download game notation and replay data as a zip file.
                </Typography>
            </Box>
        </>
    );
}

export default DownloadGameLog;
```

- [ ] **Step 2: Verify the build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors in `DownloadGameLog.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/_sharedcomponents/Preferences/_subComponents/DownloadGameLog.tsx
git commit -m "feat: replace SWU-PGN download with zip bundle (.swupgn + .swureplay)"
```

---

### Task 3: Export GameContext from Game.context.tsx

**Files:**
- Modify: `src/app/_contexts/Game.context.tsx`

The `GameContext` object is currently not exported — only `GameProvider` and `useGame` are. The `useBoardState()` hook needs to call `useContext(GameContext)` directly (without throwing) to check if GameContext is available.

- [ ] **Step 1: Add named export for GameContext**

In `src/app/_contexts/Game.context.tsx`, change line 56 from:

```typescript
const GameContext = createContext<IGameContextType | undefined>(undefined);
```

to:

```typescript
export const GameContext = createContext<IGameContextType | undefined>(undefined);
```

- [ ] **Step 2: Verify the build compiles**

Run:
```bash
npm run build
```
Expected: No errors. Existing imports of `useGame` and `GameProvider` still work.

- [ ] **Step 3: Commit**

```bash
git add src/app/_contexts/Game.context.tsx
git commit -m "refactor: export GameContext for use by useBoardState hook"
```

---

### Task 4: Create useBoardState() Hook

**Files:**
- Create: `src/app/_hooks/useBoardState.ts`

- [ ] **Step 1: Create the hook**

Create `src/app/_hooks/useBoardState.ts`:

```typescript
'use client';
import { useContext } from 'react';
import { GameContext } from '@/app/_contexts/Game.context';
import { ReplayContext } from '@/app/_contexts/Replay.context';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

export interface IBoardState {
    gameState: any;
    connectedPlayer: string;
    getOpponent: (player: string) => string;
    isSpectator: boolean;
    gameMessages: IChatEntry[];
}

export function useBoardState(): IBoardState {
    const replayContext = useContext(ReplayContext);
    const gameContext = useContext(GameContext);

    if (replayContext) {
        return {
            gameState: replayContext.gameState,
            connectedPlayer: replayContext.connectedPlayer,
            getOpponent: replayContext.getOpponent,
            isSpectator: replayContext.isSpectator,
            gameMessages: replayContext.gameMessages,
        };
    }

    if (gameContext) {
        return {
            gameState: gameContext.gameState,
            connectedPlayer: gameContext.connectedPlayer,
            getOpponent: gameContext.getOpponent,
            isSpectator: gameContext.isSpectator,
            gameMessages: gameContext.gameMessages,
        };
    }

    throw new Error('useBoardState must be used within a ReplayProvider or GameProvider');
}
```

Note: This file imports `ReplayContext` which doesn't exist yet. We create it in Task 6, and the parser (which defines the shared types) was created in Task 7. The build will not compile until Task 6 is done. That's OK — Tasks 4, 5, 6, and 7 form one logical unit and should be committed together after Task 6.

- [ ] **Step 2: No commit yet — continue to Task 5**

---

### Task 5: Migrate Board Components to useBoardState()

**Files:**
- Modify: `src/app/_components/Gameboard/Board/Board.tsx`
- Modify: `src/app/_components/Gameboard/PlayerCardTray/PlayerCardTray.tsx`
- Modify: `src/app/_components/Gameboard/OpponentCardTray/OpponentCardTray.tsx`
- Modify: `src/app/_components/Gameboard/_subcomponents/UnitsBoard.tsx`
- Modify: `src/app/_components/Gameboard/_subcomponents/PlayerTray/PlayerHand.tsx`
- Modify: `src/app/_components/Gameboard/_subcomponents/PlayerTray/Credits.tsx`
- Modify: `src/app/_components/Gameboard/_subcomponents/PlayerTray/DeckDiscard.tsx`
- Modify: `src/app/_components/Gameboard/_subcomponents/PlayerTray/Resources.tsx`

Each file gets the same two changes: (a) replace the `useGame` import with `useBoardState`, (b) replace the `useGame()` call with `useBoardState()`. Only the board-state fields change — if a component also uses other `useGame()` fields, those stay on a separate `useGame()` call.

- [ ] **Step 1: Update Board.tsx**

In `src/app/_components/Gameboard/Board/Board.tsx`:

Change line 6:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 14:
```typescript
const { gameState, connectedPlayer, isSpectator } = useGame();
```
to:
```typescript
const { gameState, connectedPlayer, isSpectator } = useBoardState();
```

- [ ] **Step 2: Update PlayerCardTray.tsx**

In `src/app/_components/Gameboard/PlayerCardTray/PlayerCardTray.tsx`:

Change line 11:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 16:
```typescript
const { gameState, connectedPlayer, isSpectator } = useGame();
```
to:
```typescript
const { gameState, connectedPlayer, isSpectator } = useBoardState();
```

- [ ] **Step 3: Update OpponentCardTray.tsx**

In `src/app/_components/Gameboard/OpponentCardTray/OpponentCardTray.tsx`:

Change line 9:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 20:
```typescript
const { gameState, connectedPlayer, getOpponent, isSpectator } = useGame();
```
to:
```typescript
const { gameState, connectedPlayer, getOpponent, isSpectator } = useBoardState();
```

- [ ] **Step 4: Update UnitsBoard.tsx**

In `src/app/_components/Gameboard/_subcomponents/UnitsBoard.tsx`:

Change line 8:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 80:
```typescript
const { gameState, connectedPlayer, getOpponent } = useGame();
```
to:
```typescript
const { gameState, connectedPlayer, getOpponent } = useBoardState();
```

- [ ] **Step 5: Update PlayerHand.tsx**

In `src/app/_components/Gameboard/_subcomponents/PlayerTray/PlayerHand.tsx`:

Change line 3:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 12:
```typescript
const { connectedPlayer } = useGame();
```
to:
```typescript
const { connectedPlayer } = useBoardState();
```

- [ ] **Step 6: Update Credits.tsx**

In `src/app/_components/Gameboard/_subcomponents/PlayerTray/Credits.tsx`:

Change line 6:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 14:
```typescript
const { gameState, connectedPlayer } = useGame();
```
to:
```typescript
const { gameState, connectedPlayer } = useBoardState();
```

- [ ] **Step 7: Update DeckDiscard.tsx**

In `src/app/_components/Gameboard/_subcomponents/PlayerTray/DeckDiscard.tsx`:

Change line 4:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 13:
```typescript
const { gameState, connectedPlayer } = useGame();
```
to:
```typescript
const { gameState, connectedPlayer } = useBoardState();
```

- [ ] **Step 8: Update Resources.tsx**

In `src/app/_components/Gameboard/_subcomponents/PlayerTray/Resources.tsx`:

Change line 7:
```typescript
import { useGame } from '@/app/_contexts/Game.context';
```
to:
```typescript
import { useBoardState } from '@/app/_hooks/useBoardState';
```

Change line 15:
```typescript
const { gameState, connectedPlayer } = useGame();
```
to:
```typescript
const { gameState, connectedPlayer } = useBoardState();
```

- [ ] **Step 9: No commit yet — continue to Task 7 (parser), then Task 6 (context)**

---

### Task 6: Create ReplayContext (depends on Task 7)

**Files:**
- Create: `src/app/_contexts/Replay.context.tsx`

- [ ] **Step 1: Create the Replay context and provider**

Create `src/app/_contexts/Replay.context.tsx`:

```tsx
'use client';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';
import { IBoardState } from '@/app/_hooks/useBoardState';
import { ParsedReplay, ReplayEvent, ReplaySnapshot } from '@/app/_utils/replayParser';

// Re-export for convenience
export type { ParsedReplay, ReplayEvent, ReplaySnapshot };

export interface IReplayContextType extends IBoardState {
    snapshots: ReplaySnapshot[];
    events: ReplayEvent[];
    currentIndex: number;
    totalSnapshots: number;
    header: Record<string, string>;

    play: () => void;
    pause: () => void;
    isPlaying: boolean;
    speed: number;
    setSpeed: (s: number) => void;
    stepForward: () => void;
    stepBack: () => void;
    seekTo: (index: number) => void;

    togglePerspective: () => void;
    currentPerspective: string;
}

export const ReplayContext = createContext<IReplayContextType | null>(null);

export function useReplay(): IReplayContextType {
    const context = useContext(ReplayContext);
    if (!context) {
        throw new Error('useReplay must be used within a ReplayProvider');
    }
    return context;
}

const SPEED_INTERVALS: Record<number, number> = {
    0.5: 4000,
    1: 2000,
    2: 1000,
    4: 500,
};

interface ReplayProviderProps {
    replay: ParsedReplay;
    children: ReactNode;
}

export const ReplayProvider: React.FC<ReplayProviderProps> = ({ replay, children }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [perspective, setPerspective] = useState('Player 1');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { snapshots, events, header } = replay;
    const totalSnapshots = snapshots.length;

    // Resolve lazy snapshots — parse rawJson on demand and cache
    const getSnapshot = useCallback((index: number): any => {
        const snap = snapshots[index];
        if (!snap) return null;
        if (snap.snapshot) return snap.snapshot;
        if (snap.rawJson) {
            const parsed = JSON.parse(snap.rawJson);
            snap.snapshot = parsed.snapshot ?? parsed;
            delete snap.rawJson;
            return snap.snapshot;
        }
        return null;
    }, [snapshots]);

    const gameState = getSnapshot(currentIndex);

    const getOpponent = useCallback((player: string): string => {
        if (!gameState?.players) return '';
        const playerIds = Object.keys(gameState.players);
        return playerIds.find((id) => id !== player) || '';
    }, [gameState]);

    // Build gameMessages from granular events between previous and current snapshot
    const gameMessages: IChatEntry[] = React.useMemo(() => {
        if (currentIndex === 0 || events.length === 0) return [];

        const prevSeq = snapshots[currentIndex - 1]?.seq ?? '';
        const currSeq = snapshots[currentIndex]?.seq ?? '';

        const relevantEvents = events.filter((e) => e.seq > prevSeq && e.seq <= currSeq);

        return relevantEvents.map((e) => ({
            date: new Date().toISOString(),
            message: [`${e.type}: ${e.player ?? ''} ${e.card ?? ''} ${e.target ?? ''}`.trim()],
        }));
    }, [currentIndex, events, snapshots]);

    const togglePerspective = useCallback(() => {
        setPerspective((prev) => (prev === 'Player 1' ? 'Player 2' : 'Player 1'));
    }, []);

    const stepForward = useCallback(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, totalSnapshots - 1));
    }, [totalSnapshots]);

    const stepBack = useCallback(() => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const seekTo = useCallback((index: number) => {
        setCurrentIndex(Math.max(0, Math.min(index, totalSnapshots - 1)));
    }, [totalSnapshots]);

    const play = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const pause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    // Playback interval
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev >= totalSnapshots - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, SPEED_INTERVALS[speed] ?? 2000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, speed, totalSnapshots]);

    const value: IReplayContextType = {
        gameState,
        connectedPlayer: perspective,
        getOpponent,
        isSpectator: true,
        gameMessages,

        snapshots,
        events,
        currentIndex,
        totalSnapshots,
        header,

        play,
        pause,
        isPlaying,
        speed,
        setSpeed,
        stepForward,
        stepBack,
        seekTo,

        togglePerspective,
        currentPerspective: perspective,
    };

    return (
        <ReplayContext.Provider value={value}>
            {children}
        </ReplayContext.Provider>
    );
};
```

- [ ] **Step 2: Verify the build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds. All board components now use `useBoardState()` which can resolve from either context. The existing GameBoard page still works because `GameContext` is provided by `GameProvider` in `ClientLayout.tsx`.

- [ ] **Step 3: Commit Tasks 4 + 5 + 6 + 7 together**

```bash
git add src/app/_hooks/useBoardState.ts \
  src/app/_contexts/Replay.context.tsx \
  src/app/_contexts/Game.context.tsx \
  src/app/_utils/replayParser.ts \
  src/app/_components/Gameboard/Board/Board.tsx \
  src/app/_components/Gameboard/PlayerCardTray/PlayerCardTray.tsx \
  src/app/_components/Gameboard/OpponentCardTray/OpponentCardTray.tsx \
  src/app/_components/Gameboard/_subcomponents/UnitsBoard.tsx \
  src/app/_components/Gameboard/_subcomponents/PlayerTray/PlayerHand.tsx \
  src/app/_components/Gameboard/_subcomponents/PlayerTray/Credits.tsx \
  src/app/_components/Gameboard/_subcomponents/PlayerTray/DeckDiscard.tsx \
  src/app/_components/Gameboard/_subcomponents/PlayerTray/Resources.tsx
git commit -m "feat: add ReplayContext, useBoardState hook, replay parser, migrate board components"
```

---

### Task 7: Create Replay Parser (do BEFORE Task 6)

**Files:**
- Create: `src/app/_utils/replayParser.ts`

- [ ] **Step 1: Create the parser (defines shared types used by ReplayContext)**

Create `src/app/_utils/replayParser.ts`:

```typescript
export interface ReplayEvent {
    seq: string;
    type: string;
    [key: string]: any;
}

export interface ReplaySnapshot {
    seq: string;
    rawJson?: string;
    snapshot: any;
}

export interface ParsedReplay {
    header: Record<string, string>;
    cardIndex: string;
    events: ReplayEvent[];
    snapshots: ReplaySnapshot[];
}

const CARD_INDEX_SEPARATOR = '═══ CARD INDEX ═══';
const REPLAY_SEPARATOR = '=== REPLAY ===';
const HEADER_TAG_REGEX = /^\[(\w+)\s+"(.*)"\]$/;

export function parseReplayFile(content: string): ParsedReplay {
    const lines = content.split('\n');
    const header: Record<string, string> = {};
    const cardIndexLines: string[] = [];
    const events: ReplayEvent[] = [];
    const snapshots: ReplaySnapshot[] = [];

    let section: 'header' | 'cardIndex' | 'replay' = 'header';

    for (const line of lines) {
        const trimmed = line.trim();

        // Section transitions
        if (trimmed.includes(CARD_INDEX_SEPARATOR)) {
            section = 'cardIndex';
            continue;
        }
        if (trimmed === REPLAY_SEPARATOR) {
            section = 'replay';
            continue;
        }

        if (section === 'header') {
            const match = trimmed.match(HEADER_TAG_REGEX);
            if (match) {
                header[match[1]] = match[2];
            }
            continue;
        }

        if (section === 'cardIndex') {
            if (trimmed) {
                cardIndexLines.push(line);
            }
            continue;
        }

        if (section === 'replay') {
            if (!trimmed) continue;

            // Check if this is a snapshot line (seq ends with -snapshot)
            // Lazy parse: store raw JSON string, parse on demand
            if (trimmed.includes('-snapshot')) {
                // Extract seq without full parse for classification
                const seqMatch = trimmed.match(/"seq"\s*:\s*"([^"]+)"/);
                if (seqMatch) {
                    snapshots.push({
                        seq: seqMatch[1],
                        rawJson: trimmed,
                        snapshot: null as any,
                    });
                    continue;
                }
            }

            // Granular event — these are small, parse immediately
            try {
                const parsed = JSON.parse(trimmed);
                events.push(parsed as ReplayEvent);
            } catch {
                // Skip malformed lines
            }
            continue;
        }
    }

    return {
        header,
        cardIndex: cardIndexLines.join('\n'),
        events,
        snapshots,
    };
}

export async function parseReplayFromZip(zipData: ArrayBuffer): Promise<ParsedReplay> {
    const { unzipSync, strFromU8 } = await import('fflate');
    const unzipped = unzipSync(new Uint8Array(zipData));

    const replayFilename = Object.keys(unzipped).find((name) => name.endsWith('.swureplay'));
    if (!replayFilename) {
        throw new Error('No .swureplay file found in zip');
    }

    const content = strFromU8(unzipped[replayFilename]);
    return parseReplayFile(content);
}
```

- [ ] **Step 2: No commit yet — go back to Task 6 (ReplayContext) which imports from this file. The commit happens at the end of Task 6.**

---

### Task 8: Create FileUpload Component

**Files:**
- Create: `src/app/_components/Replay/FileUpload.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/_components/Replay/FileUpload.tsx`:

```tsx
'use client';
import React, { useState, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { parseReplayFile, parseReplayFromZip } from '@/app/_utils/replayParser';
import { ParsedReplay } from '@/app/_contexts/Replay.context';

interface FileUploadProps {
    onReplayLoaded: (replay: ParsedReplay) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onReplayLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        setError(null);
        setLoading(true);

        try {
            if (file.name.endsWith('.swureplay')) {
                const text = await file.text();
                const replay = parseReplayFile(text);
                if (replay.snapshots.length === 0) {
                    setError('No snapshots found in replay file.');
                    return;
                }
                onReplayLoaded(replay);
            } else if (file.name.endsWith('.zip')) {
                const buffer = await file.arrayBuffer();
                const replay = await parseReplayFromZip(buffer);
                if (replay.snapshots.length === 0) {
                    setError('No snapshots found in replay file.');
                    return;
                }
                onReplayLoaded(replay);
            } else {
                setError('Please upload a .swureplay or .zip file.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file.');
        } finally {
            setLoading(false);
        }
    }, [onReplayLoaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    return (
        <Box
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            sx={{
                width: '100%',
                maxWidth: '500px',
                height: '250px',
                border: '2px dashed',
                borderColor: isDragging ? '#90caf9' : error ? '#f44336' : 'rgba(255,255,255,0.3)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
                backgroundColor: isDragging ? 'rgba(144,202,249,0.08)' : 'rgba(255,255,255,0.03)',
                '&:hover': {
                    borderColor: '#90caf9',
                    backgroundColor: 'rgba(144,202,249,0.05)',
                },
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".swureplay,.zip"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {loading ? (
                <Typography variant="body1" sx={{ color: '#90caf9' }}>
                    Loading replay...
                </Typography>
            ) : (
                <>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                        Drop a .swureplay or .zip file here
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        or click to browse
                    </Typography>
                </>
            )}
            {error && (
                <Typography variant="body2" sx={{ color: '#f44336', mt: 2 }}>
                    {error}
                </Typography>
            )}
        </Box>
    );
};

export default FileUpload;
```

- [ ] **Step 2: Verify the build compiles**

Run:
```bash
npm run build
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/Replay/FileUpload.tsx
git commit -m "feat: add FileUpload component for .swureplay and .zip files"
```

---

### Task 9: Create TransportControls Component

**Files:**
- Create: `src/app/_components/Replay/TransportControls.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/_components/Replay/TransportControls.tsx`:

```tsx
'use client';
import React, { useEffect, useCallback } from 'react';
import { Box, IconButton, Slider, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
    PlayArrow,
    Pause,
    SkipPrevious,
    SkipNext,
    SwapHoriz,
} from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';

const SPEEDS = [0.5, 1, 2, 4];

function parseRoundFromSeq(seq: string): string {
    // seq format: "R1.A.3-snapshot" or "R2.R.1-snapshot"
    const match = seq.match(/^R(\d+)\.([A-Z])/);
    if (!match) return '';
    const round = match[1];
    const phase = match[2] === 'A' ? 'Action' : match[2] === 'R' ? 'Regroup' : match[2];
    return `Round ${round}, ${phase} Phase`;
}

const TransportControls: React.FC = () => {
    const {
        isPlaying,
        play,
        pause,
        stepForward,
        stepBack,
        speed,
        setSpeed,
        currentIndex,
        totalSnapshots,
        seekTo,
        togglePerspective,
        currentPerspective,
        snapshots,
    } = useReplay();

    const currentRound = snapshots[currentIndex]
        ? parseRoundFromSeq(snapshots[currentIndex].seq)
        : '';

    const handlePlayPause = useCallback(() => {
        if (isPlaying) pause();
        else play();
    }, [isPlaying, play, pause]);

    const handleSpeedChange = useCallback((_: React.MouseEvent<HTMLElement>, newSpeed: number | null) => {
        if (newSpeed !== null) setSpeed(newSpeed);
    }, [setSpeed]);

    const handleSliderChange = useCallback((_: Event, value: number | number[]) => {
        seekTo(value as number);
    }, [seekTo]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't capture if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    stepBack();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    stepForward();
                    break;
                case '[': {
                    const currentSpeedIdx = SPEEDS.indexOf(speed);
                    if (currentSpeedIdx > 0) setSpeed(SPEEDS[currentSpeedIdx - 1]);
                    break;
                }
                case ']': {
                    const currentSpeedIdx = SPEEDS.indexOf(speed);
                    if (currentSpeedIdx < SPEEDS.length - 1) setSpeed(SPEEDS[currentSpeedIdx + 1]);
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePlayPause, stepBack, stepForward, speed, setSpeed]);

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                gap: 1.5,
                zIndex: 1000,
                borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            {/* Play/Pause */}
            <IconButton onClick={handlePlayPause} sx={{ color: 'white' }}>
                {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            {/* Step Back */}
            <IconButton onClick={stepBack} disabled={currentIndex === 0} sx={{ color: 'white' }}>
                <SkipPrevious />
            </IconButton>

            {/* Step Forward */}
            <IconButton onClick={stepForward} disabled={currentIndex >= totalSnapshots - 1} sx={{ color: 'white' }}>
                <SkipNext />
            </IconButton>

            {/* Scrub Bar */}
            <Slider
                value={currentIndex}
                min={0}
                max={totalSnapshots - 1}
                onChange={handleSliderChange}
                sx={{
                    flex: 1,
                    mx: 1,
                    color: '#90caf9',
                    '& .MuiSlider-thumb': { width: 14, height: 14 },
                }}
            />

            {/* Position */}
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '70px', textAlign: 'center' }}>
                {currentIndex + 1} / {totalSnapshots}
            </Typography>

            {/* Round Indicator */}
            {currentRound && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: '140px', textAlign: 'center' }}>
                    {currentRound}
                </Typography>
            )}

            {/* Speed Selector */}
            <ToggleButtonGroup
                value={speed}
                exclusive
                onChange={handleSpeedChange}
                size="small"
                sx={{
                    '& .MuiToggleButton-root': {
                        color: 'rgba(255,255,255,0.5)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.75rem',
                        '&.Mui-selected': {
                            color: '#90caf9',
                            backgroundColor: 'rgba(144,202,249,0.15)',
                        },
                    },
                }}
            >
                {SPEEDS.map((s) => (
                    <ToggleButton key={s} value={s}>
                        {s}x
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            {/* Perspective Toggle */}
            <IconButton
                onClick={togglePerspective}
                sx={{ color: 'white' }}
                title={`Viewing as ${currentPerspective}`}
            >
                <SwapHoriz />
            </IconButton>
        </Box>
    );
};

export default TransportControls;
```

- [ ] **Step 2: Verify the build compiles**

Run:
```bash
npm run build
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/Replay/TransportControls.tsx
git commit -m "feat: add TransportControls component with keyboard shortcuts"
```

---

### Task 10: Create /replay Page

**Files:**
- Create: `src/app/replay/page.tsx`

- [ ] **Step 1: Create the replay page**

Create `src/app/replay/page.tsx`:

```tsx
'use client';
import React, { useState } from 'react';
import { Box, Grid2 as Grid, Typography } from '@mui/material';
import { ReplayProvider, ParsedReplay } from '@/app/_contexts/Replay.context';
import FileUpload from '@/app/_components/Replay/FileUpload';
import TransportControls from '@/app/_components/Replay/TransportControls';
import OpponentCardTray from '@/app/_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '@/app/_components/Gameboard/Board/Board';
import PlayerCardTray from '@/app/_components/Gameboard/PlayerCardTray/PlayerCardTray';
import { s3ImageURL } from '@/app/_utils/s3Utils';

function ReplayHeader({ header }: { header: Record<string, string> }) {
    const player1 = header.Player1 || 'Player 1';
    const player2 = header.Player2 || 'Player 2';
    const leader1 = header.Leader1 || '';
    const leader2 = header.Leader2 || '';
    const result = header.Result || '';

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3,
                py: 0.5,
                px: 2,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                zIndex: 10,
            }}
        >
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {player1}
                </Typography>
                {leader1 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {leader1}
                    </Typography>
                )}
            </Box>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                vs
            </Typography>
            <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {player2}
                </Typography>
                {leader2 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {leader2}
                    </Typography>
                )}
            </Box>
            {result && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', ml: 2 }}>
                    {result}
                </Typography>
            )}
        </Box>
    );
}

function ReplayBoard({ replay }: { replay: ParsedReplay }) {
    return (
        <ReplayProvider replay={replay}>
            <Grid container sx={{ height: '100dvh', overflow: 'hidden' }}>
                <Box
                    component="main"
                    sx={{
                        width: '100%',
                        height: '100dvh',
                        position: 'relative',
                        backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')}?v=2)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <ReplayHeader header={replay.header} />
                    <Box sx={{ height: '15dvh' }}>
                        <OpponentCardTray
                            trayPlayer="opponent"
                            preferenceToggle={() => {}}
                        />
                    </Box>
                    <Box sx={{ height: '62dvh', position: 'relative', zIndex: 2 }}>
                        <Board sidebarOpen={false} />
                    </Box>
                    <Box sx={{ height: '18dvh', pb: '60px' }}>
                        <PlayerCardTray
                            trayPlayer="player"
                            toggleSidebar={() => {}}
                        />
                    </Box>
                </Box>
            </Grid>
            <TransportControls />
        </ReplayProvider>
    );
}

export default function ReplayPage() {
    const [replay, setReplay] = useState<ParsedReplay | null>(null);

    if (replay) {
        return <ReplayBoard replay={replay} />;
    }

    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')}?v=2)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                gap: 3,
            }}
        >
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Replay Viewer
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                Upload a game replay file to watch the game play out
            </Typography>
            <FileUpload onReplayLoaded={setReplay} />
        </Box>
    );
}
```

**Note on `trayPlayer` props:** The existing `OpponentCardTray` and `PlayerCardTray` receive a `trayPlayer` prop but also read `connectedPlayer` and `getOpponent()` from context to determine which player data to render. The `trayPlayer` prop is used for sub-component rendering. In replay mode, `connectedPlayer` comes from `ReplayProvider` (either `"Player 1"` or `"Player 2"`), and `getOpponent()` returns the other key. The tray components use these context values to index into `gameState.players`, so the actual tray rendering is driven by context, not the prop value. The prop values `"player"` and `"opponent"` are passed for interface compatibility but the actual player resolution happens via `useBoardState()`.

- [ ] **Step 2: Verify the build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds. The `/replay` route is accessible.

- [ ] **Step 3: Commit**

```bash
git add src/app/replay/page.tsx
git commit -m "feat: add /replay page with file upload and board rendering"
```

---

### Task 11: Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Verify the full build passes**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify the dev server starts**

Run:
```bash
npm run dev
```
Expected: Dev server starts. Navigate to `http://localhost:3000/replay` and confirm the upload screen appears.

- [ ] **Step 3: Verify existing GameBoard still works**

Navigate to the game board (start a game via lobby). Confirm:
- Board renders correctly (Board, PlayerCardTray, OpponentCardTray all work with `useBoardState()`)
- Interactive controls still function (card selection, passing, etc.)
- End-game screen shows "Download Game Files" button (zip download)

- [ ] **Step 4: Test replay with a real .swureplay file**

1. Play a game on the server
2. At end of game, click "Download Game Files" — confirm it downloads a `.zip`
3. Unzip and confirm it contains `game.swupgn` and `game.swureplay`
4. Navigate to `/replay`, upload the `.swureplay` file
5. Confirm the board renders the initial state
6. Use transport controls: play, pause, step forward/back, scrub bar, speed change, perspective toggle
7. Upload the `.zip` directly — confirm it extracts and loads the replay

- [ ] **Step 5: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: integration fixes for replay viewer"
```
