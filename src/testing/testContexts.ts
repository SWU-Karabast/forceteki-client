// What the mocked context hooks return (see ./setup.ts). Kept apart from ./gameState.tsx, which
// imports the app's providers, so the mocks never wait on the modules they replace.
import { createContext, useContext } from 'react';
import type { useGame } from '@/app/_contexts/Game.context';
import type { useUser } from '@/app/_contexts/User.context';

export type GameContextValue = ReturnType<typeof useGame>;

/** Stands in for GameProvider's context, so a new state re-renders every card that reads it. */
export const TestGameContext = createContext<GameContextValue | null>(null);

export const useTestGame = (): GameContextValue => {
    const game = useContext(TestGameContext);
    if (!game) {
        throw new Error('render the board with renderGameState() so it has a game to read');
    }
    return game;
};

/** An anonymous visitor: nothing the board draws depends on who is signed in. */
export const testUser = { user: null, anonymousUserId: null } as unknown as ReturnType<typeof useUser>;
