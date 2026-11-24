import { PlayerNoticeKind } from '@/app/_contexts/UserTypes';

/** The longest message to a player the server accepts, after trimming */
export const MAX_PLAYER_NOTICE_LENGTH = 1000;

interface IPlayerNoticeKindInfo {

    /** The heading the player sees */
    heading: string;

    /** The name of the kind in the mod tools */
    modLabel: string;

    /** The colour of the heading the player sees */
    accentColor: string;
}

const PLAYER_NOTICE_KINDS: Record<PlayerNoticeKind, IPlayerNoticeKindInfo> = {
    [PlayerNoticeKind.Warning]: {
        heading: 'Warning from the Moderators',
        modLabel: 'Warning',
        accentColor: '#DC3545',
    },
};

/** Shown for a kind the server may add before this client knows it */
const UNKNOWN_PLAYER_NOTICE_KIND: IPlayerNoticeKindInfo = {
    heading: 'Message from the Moderators',
    modLabel: 'Message',
    accentColor: '#2F7DB6',
};

/** How to show a notice, including one of a kind this client does not know yet */
export const getPlayerNoticeKindInfo = (kind: PlayerNoticeKind | string): IPlayerNoticeKindInfo =>
    PLAYER_NOTICE_KINDS[kind as PlayerNoticeKind] ?? UNKNOWN_PLAYER_NOTICE_KIND;
