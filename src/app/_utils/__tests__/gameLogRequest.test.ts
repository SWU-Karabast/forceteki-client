import { describe, it, expect, vi } from 'vitest';
import { requestGameLog, emitLobby, GAME_LOG_TIMEOUT_MS, NOT_CONNECTED, type TimedLobbySend, type LobbySocket } from '../gameLogRequest';

// A lobby that answers the getGameLog ack with whatever `answer` does to it.
const lobby = (answer: (ack: (err: unknown, data?: object) => void) => void): TimedLobbySend =>
    (args) => answer(args[args.length - 1] as (err: unknown, data?: object) => void);

// Value: protects=the Watch Replay / download buttons settle on every answer: the file, a server error, a missing file, a timeout or no connection, each with its own message, asked with the default timeout; fails_when=the request stops passing a timeout, treats the ack's error argument as data, or rewords the not-connected reason as a server failure; why_new=the request lived inside the component with no test; seam=none; no_claim=socket.io's own timer (stubbed: the stub calls the ack the way socket.timeout does)
describe('requestGameLog', () => {
    it('resolves with the file, asking with the default timeout', async () => {
        let timeout: number | undefined;
        const send: TimedLobbySend = (args, ms) => { timeout = ms; (args[1] as (e: unknown, d: object) => void)(null, { swuPgnFile: '%%% HEADER' }); };
        await expect(requestGameLog(send)).resolves.toBe('%%% HEADER');
        expect(timeout).toBe(GAME_LOG_TIMEOUT_MS);
    });

    it('rejects with the server error, or when no file came back', async () => {
        await expect(requestGameLog(lobby((ack) => ack(null, { error: 'Game not found' })))).rejects.toThrow('Game not found');
        await expect(requestGameLog(lobby((ack) => ack(null, {})))).rejects.toThrow('Game files not available');
    });

    it('says the server did not answer on a timeout, and says not connected when there is no socket', async () => {
        await expect(requestGameLog(lobby((ack) => ack(new Error('operation has timed out'))))).rejects.toThrow('did not send the game file');
        await expect(requestGameLog((args, ms) => emitLobby(null, args, ms))).rejects.toThrow(NOT_CONNECTED);
    });
});

// Value: protects=a timed lobby emit uses socket.io's timeout, and with no connected socket answers the ack with an error at once instead of emitting; an untimed emit is the plain one; fails_when=the connected check or .timeout() is dropped; why_new=sendLobbyMessage's timed branch had no test; seam=none (emitLobby is what Game.context calls); no_claim=the real socket.io client
describe('emitLobby', () => {
    const socket = (connected: boolean) => {
        const timedEmit = vi.fn();
        return { s: { connected, emit: vi.fn(), timeout: vi.fn(() => ({ emit: timedEmit })) } as unknown as LobbySocket & { emit: ReturnType<typeof vi.fn>; timeout: ReturnType<typeof vi.fn> }, timedEmit };
    };
    it('emits plainly without a timeout, and through socket.timeout with one', () => {
        const a = socket(true);
        emitLobby(a.s, ['updateDeck', 1]);
        expect(a.s.emit).toHaveBeenCalledWith('lobby', 'updateDeck', 1);
        const ack = vi.fn();
        emitLobby(a.s, ['getGameLog', ack], 500);
        expect(a.s.timeout).toHaveBeenCalledWith(500);
        expect(a.timedEmit).toHaveBeenCalledWith('lobby', 'getGameLog', ack);
        expect(ack).not.toHaveBeenCalled();
    });
    it('answers a timed ack with an error when not connected, and sends nothing', () => {
        const dropped = socket(false);
        for (const s of [null, dropped.s]) {
            const ack = vi.fn();
            emitLobby(s, ['getGameLog', ack], 500);
            expect(ack).toHaveBeenCalledWith(expect.objectContaining({ message: NOT_CONNECTED }));
        }
        expect(dropped.s.emit).not.toHaveBeenCalled();
        expect(dropped.s.timeout).not.toHaveBeenCalled();
        expect(() => emitLobby(null, ['getGameLog', 'not a function'], 500)).not.toThrow();
    });
});
