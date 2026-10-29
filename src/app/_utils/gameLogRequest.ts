// How long to wait for the lobby's getGameLog ack before giving up.
export const GAME_LOG_TIMEOUT_MS = 10_000;

/** The lobby emitter, with socket.io's ack timeout: the ack's first argument is then an error. */
export type TimedLobbySend = (args: unknown[], timeoutMs: number) => void;

// The error a timed lobby ack gets when there is no connected socket to send on.
export const NOT_CONNECTED = 'Not connected to the game server. Reconnect, then try again.';

/** The parts of a socket.io client socket a timed lobby emit uses. */
export interface LobbySocket {
    connected: boolean;
    emit(event: 'lobby', ...args: unknown[]): unknown;
    timeout(ms: number): { emit(event: 'lobby', ...args: unknown[]): unknown };
}

/**
 * Emit a lobby message. With `timeoutMs`, the trailing ack always answers: socket.io's timeout
 * makes its first argument an error when the server does not reply in time, and with no
 * connected socket it is called with an error at once (nothing is emitted).
 */
export function emitLobby(socket: LobbySocket | null | undefined, args: unknown[], timeoutMs?: number): void {
    if (timeoutMs == null) {
        socket?.emit('lobby', ...args);
        return;
    }
    const ack = args[args.length - 1];
    if (!socket?.connected) {
        if (typeof ack === 'function') ack(new Error(NOT_CONNECTED));
        return;
    }
    socket.timeout(timeoutMs).emit('lobby', ...args);
}

/**
 * Ask the lobby for this game's .swupgn: the file, or an error for a server error, a missing
 * file, no connection, or no answer within `timeoutMs`. socket.io calls a timed ack once.
 */
export function requestGameLog(send: TimedLobbySend, timeoutMs = GAME_LOG_TIMEOUT_MS): Promise<string> {
    return new Promise((resolve, reject) => {
        send(['getGameLog', (err: unknown, data?: { swuPgnFile?: string; error?: string }) => {
            if (err) {
                // socket.io's timeout error says only "operation has timed out"; any other error
                // (no connection) says what went wrong itself.
                const own = err instanceof Error && err.message === NOT_CONNECTED;
                reject(new Error(own ? NOT_CONNECTED : 'The server did not send the game file. Try again in a moment.'));
            } else if (data?.error || !data?.swuPgnFile) {
                reject(new Error(data?.error || 'Game files not available'));
            } else {
                resolve(data.swuPgnFile);
            }
        }], timeoutMs);
    });
}
