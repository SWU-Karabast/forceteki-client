/* eslint-disable @typescript-eslint/no-explicit-any */
// Rendering the board from the game states forceteki sends. `npm run states` downloads the
// backend's snapshots into test/stateSnapshots/ (the test run does it once on its own):
//
// - render/<name>.<participant>.json: one board, for checking it is drawn correctly.
// - controls/<name>.json: a chain of states for one participant, each with the messages that
//   participant sent to reach the next one (`send`), exactly as the client emits them.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import React, { type ReactElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';
import { theme } from '@/app/_theme/theme';
import { PopupProvider } from '@/app/_contexts/Popup.context';
import { CardImageLocaleProvider } from '@/app/_contexts/CardImageLocale.context';
import { OngoingEffectHighlightProvider } from '@/app/_contexts/OngoingEffectHighlight.context';
import { GameStateProvider, type IGameContextType } from '@/app/_contexts/Game.context';

export type Participant = 'player1' | 'player2' | 'spectator';

export interface IControlStep {
    participant: Participant;
    state: any;
    send: unknown[][];
}

const SnapshotDir = 'test/stateSnapshots';

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

/** The units in both arenas. Upgrades are drawn on the unit they are attached to, not as cards of their own. */
export const unitsInPlay = (state: any): any[] => Object.values(state.players).flatMap((player: any) => [
    ...player.cardPiles.groundArena,
    ...player.cardPiles.spaceArena,
]).filter((card) => !card.parentCardId);

/** Which player's seat a participant's state is read from, as GameProvider decides it. */
const seatOf = (state: any, participant: Participant) => {
    const playerIds = Object.keys(state.players);
    // a spectator watches from the first player's seat
    return participant === 'player2' ? playerIds[1] : playerIds[0];
};

/**
 * Renders `ui` as `participant` sees `state`, through the real GameStateProvider. `sent` records
 * every message sent on the `game` socket event, and `receive(nextState)` delivers the next state,
 * as a `gamestate` socket message would.
 */
export const renderGameState = (ui: ReactElement, state: any, participant: Participant) => {
    const sent = vi.fn<IGameContextType['sendGameMessage']>();
    const withState = (current: any) => (
        <ThemeProvider theme={theme}>
            <PopupProvider>
                <CardImageLocaleProvider>
                    <OngoingEffectHighlightProvider>
                        <GameStateProvider
                            gameState={current}
                            connectedPlayer={seatOf(current, participant)}
                            isSpectator={participant === 'spectator'}
                            emitGameMessage={sent}
                        >
                            {ui}
                        </GameStateProvider>
                    </OngoingEffectHighlightProvider>
                </CardImageLocaleProvider>
            </PopupProvider>
        </ThemeProvider>
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
