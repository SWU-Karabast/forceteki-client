import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { testUser, useTestGame } from './testContexts';

// The board reads the game through these hooks; the real providers open a socket and a session.
// Tests set what they return with `renderGameState` (see ./gameState.tsx).
vi.mock('@/app/_contexts/Game.context', async (importOriginal) => ({
    ...await importOriginal<typeof import('@/app/_contexts/Game.context')>(),
    useGame: useTestGame,
    useGameOptional: useTestGame,
}));
vi.mock('@/app/_contexts/User.context', async (importOriginal) => ({
    ...await importOriginal<typeof import('@/app/_contexts/User.context')>(),
    useUser: () => testUser,
}));

// jsdom has no layout, so media queries never match and nothing is ever resized
globalThis.ResizeObserver ??= class {
    public observe() {}
    public unobserve() {}
    public disconnect() {}
};
window.matchMedia ??= (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
});

afterEach(cleanup);
