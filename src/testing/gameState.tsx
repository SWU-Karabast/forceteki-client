/* eslint-disable @typescript-eslint/no-explicit-any */
// Rendering the board from the game states forceteki sends. `npm run states` downloads the
// backend's snapshots into src/__fixtures__/gamestates/ (the test run does it once on its own):
//
// - render/<name>.<participant>.json: one board, for checking it is drawn correctly.
// - controls/<name>.json: a chain of states for one participant, each with the messages that
//   participant sent to reach the next one (`send`), exactly as the client emits them.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import React, { type ReactElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';
import { theme } from '@/app/_theme/theme';
import { PopupProvider } from '@/app/_contexts/Popup.context';
import { CardImageLocaleProvider } from '@/app/_contexts/CardImageLocale.context';
import { OngoingEffectHighlightProvider } from '@/app/_contexts/OngoingEffectHighlight.context';
import { type GameContextValue, TestGameContext } from './testContexts';

export type Participant = 'player1' | 'player2' | 'spectator';

export interface IControlStep {
    participant: Participant;
    state: any;
    send: unknown[][];
}

const SnapshotDir = 'src/__fixtures__/gamestates';

const readSnapshot = (path: string) => {
    const file = join(SnapshotDir, path);
    if (!existsSync(file)) {
        const manifest = join(SnapshotDir, 'manifest.json');
        const from = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')).ref : 'nowhere yet';
        throw new Error(`${path} is not in the game states downloaded from forceteki ${from}. `
            + 'If a backend PR adds it, run `npm run states -- --ref pr/<number>`.');
    }
    return JSON.parse(readFileSync(file, 'utf8'));
};

export const loadRenderSnapshot = (name: string, participant: Participant): any =>
    readSnapshot(`render/${name}.${participant}.json`);

export const loadControlChain = (name: string): IControlStep[] =>
    readSnapshot(`controls/${name}.json`).steps;

/** The game context a client holds for this participant, built the way Game.context builds it. */
const gameContextFor = (state: any, participant: Participant, sendGameMessage: GameContextValue['sendGameMessage']): GameContextValue => {
    const playerIds = Object.keys(state.players);
    const isSpectator = participant === 'spectator';
    // a spectator watches from the first player's seat
    const connectedPlayer = participant === 'player2' ? playerIds[1] : playerIds[0];
    const getOpponent = (player: string) => playerIds.find((id) => id !== player) ?? '';

    return {
        gameState: state,
        gameMessages: [],
        lobbyState: null,
        bugReportState: null,
        playerReportState: null,
        statsSubmitNotification: null,
        sendMessage: vi.fn(),
        sendGameMessage,
        getOpponent,
        connectedPlayer,
        sendLobbyMessage: vi.fn(),
        resetStates: vi.fn(),
        getConnectedPlayerPrompt: () => state.players[connectedPlayer]?.promptState,
        updateDistributionPrompt: vi.fn(),
        distributionPromptData: null,
        isSpectator,
        lastQueueHeartbeat: 0,
        queueMatchmakingStatus: null,
        isAnonymousPlayer: () => false,
        hasChatDisabled: () => false,
        createNewSocket: () => undefined,
        gameIsEnded: () => !!state.winners?.length,
        ongoingEffects: state.ongoingEffects ?? [],
        hoveredChatCard: { id: null, hover: () => {}, clear: () => {} },
    };
};

const Providers = ({ game, children }: { game: GameContextValue; children: ReactNode }) => (
    <ThemeProvider theme={theme}>
        <PopupProvider>
            <CardImageLocaleProvider>
                <OngoingEffectHighlightProvider>
                    <TestGameContext.Provider value={game}>
                        {children}
                    </TestGameContext.Provider>
                </OngoingEffectHighlightProvider>
            </CardImageLocaleProvider>
        </PopupProvider>
    </ThemeProvider>
);

/**
 * Renders `ui` as `participant` sees `state`. `sent` records every `sendGameMessage` call, and
 * `receive(nextState)` delivers the next state, as a `gamestate` socket message would.
 */
export const renderGameState = (ui: ReactElement, state: any, participant: Participant) => {
    const sent = vi.fn<GameContextValue['sendGameMessage']>();
    const withState = (current: any) => (
        <Providers game={gameContextFor(current, participant, sent)}>{ui}</Providers>
    );
    const result = render(withState(state));

    return {
        ...result,
        sent,
        receive: (nextState: any) => result.rerender(withState(nextState)),
    };
};

/** The card in play with this uuid, or null when the board does not draw it. */
export const findCard = (uuid: string) => document.querySelector<HTMLElement>(`[data-card-uuid="${uuid}"]`);

export const clickCard = (uuid: string) => {
    const image = findCard(uuid)?.querySelector('img');
    if (!image) {
        throw new Error(`no card ${uuid} on the board to click`);
    }
    fireEvent.click(image);
};
