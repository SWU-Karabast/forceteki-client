import { describe, expect, it } from 'vitest';
import { findCard, loadRenderSnapshot, unitsInPlay } from '../helpers/gameState';
import { renderMockApp } from '../helpers/mockApp';
import { mockRouter } from '../helpers/mockRouter';
import { mockServer, type MockSocket } from '../helpers/mockServer';
import { mockSession } from '../helpers/mockSession';

/** The game starts: the queue moves to the board, which draws every unit, on the connection the queue opened. */
const expectGameToStart = (socket: MockSocket, state: ReturnType<typeof loadRenderSnapshot>) => {
    socket.receive('gamestate', state);

    expect(mockRouter.path).toBe('/GameBoard');
    for (const unit of unitsInPlay(state)) {
        expect(findCard(unit.uuid), `${unit.name} (${unit.uuid})`).not.toBeNull();
    }
    expect(mockServer.sockets).toEqual([socket]);
    expect(socket.connected).toBe(true);
};

describe('A player in the quick game queue', () => {
    const state = loadRenderSnapshot('board', 'player1');
    const playerId = Object.keys(state.players)[0];
    const noLobby = { lobby: JSON.stringify({ lobbyId: null }), spectator: 'false' };

    it('connects anonymously, and is taken to the board when the game starts', async () => {
        renderMockApp({ url: '/quickGame', anonymousUserId: playerId });

        const socket = await mockServer.waitForConnection();
        expect(socket.url).toBe(process.env.NEXT_PUBLIC_ROOT_URL);
        expect(socket.options).toEqual({
            path: '/ws',
            query: {
                user: JSON.stringify({ username: `anonymous ${playerId.substring(0, 6)}`, id: playerId }),
                ...noLobby,
            },
            auth: undefined,
        });

        expectGameToStart(socket, state);
    });

    it('connects with their session token once signed in, and is taken to the board when the game starts', async () => {
        mockSession.set({
            status: 'authenticated',
            data: { user: { id: 'google-123', email: 'player1@example.com', provider: 'google' }, jwtToken: 'session-token' },
        });
        mockServer.respond('/api/get-user', { user: { id: playerId, username: 'player1', preferences: {} } });
        mockServer.respond('/api/user-is-moderator', { success: false });
        renderMockApp({ url: '/quickGame' });

        const socket = await mockServer.waitForConnection();
        // the server finds the account from the token, so no identity is sent alongside it
        expect(socket.options).toEqual({ path: '/ws', query: noLobby, auth: { token: 'session-token' } });
        expect(mockServer.requests).toContain('POST /api/get-user');

        expectGameToStart(socket, state);
    });
});
