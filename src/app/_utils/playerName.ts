import { IChatObject, IPlayerChatMessage } from '../_components/_sharedcomponents/Chat/ChatTypes';

export const getSpectatorDisplayName = (
    playerId: string,
    connectedPlayer: string,
    getOpponent: (player: string) => string
): string => {
    if (playerId === connectedPlayer) return 'Player 1';
    if (playerId === getOpponent(connectedPlayer)) return 'Player 2';
    return 'Unknown Player';
};

export const getDisplayName = (
    namedPlayer: IChatObject | IPlayerChatMessage,
    connectedPlayer: string,
    getOpponent: (player: string) => string,
    isSpectator: boolean
): string => {
    return isSpectator && namedPlayer.id
        ? getSpectatorDisplayName(namedPlayer.id, connectedPlayer, getOpponent)
        : namedPlayer.name;
}