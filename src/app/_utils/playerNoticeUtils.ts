import { PlayerNoticeKind } from '@/app/_contexts/UserTypes';

/** The longest notice the server accepts, after trimming */
export const MAX_PLAYER_NOTICE_LENGTH = 1000;

interface IPlayerNoticeKindInfo {

    /** The heading the player sees */
    heading: string;

    /** The name of the kind in the mod tools */
    modLabel: string;

    /** The colour of the heading the player sees */
    accentColor: string;

    /** The text a moderator starts from when sending this kind directly; Warnings are sent with a Warning mod action */
    defaultMessage?: string;
}

export const PLAYER_NOTICE_KINDS: Record<PlayerNoticeKind, IPlayerNoticeKindInfo> = {
    [PlayerNoticeKind.BugReportFixed]: {
        heading: 'Your bug report: fixed',
        modLabel: 'Bug Report: Fixed',
        accentColor: '#4CAF50',
        defaultMessage: 'Thanks for your bug report! This has been fixed and will be live in the next update.',
    },
    [PlayerNoticeKind.BugReportNotABug]: {
        heading: 'Your bug report: not a bug',
        modLabel: 'Bug Report: Not a Bug',
        accentColor: '#2F7DB6',
        defaultMessage: 'Thanks for your bug report! We looked into it and this is working as intended: ',
    },
    [PlayerNoticeKind.BugReportNeedsInfo]: {
        heading: 'We need more information',
        modLabel: 'Bug Report: Needs More Information',
        accentColor: '#FFD54F',
        defaultMessage: 'Thanks for your bug report! We could not work out what went wrong from the report alone. '
            + 'If it happens again, please send another report describing what you expected to happen and what happened instead.',
    },
    [PlayerNoticeKind.Warning]: {
        heading: 'Warning from the moderators',
        modLabel: 'Warning',
        accentColor: '#DC3545',
    },
    [PlayerNoticeKind.General]: {
        heading: 'Message from the Karabast team',
        modLabel: 'General',
        accentColor: '#2F7DB6',
        defaultMessage: '',
    },
};

/** The kinds a moderator can send directly, in the order they are offered */
export const SENDABLE_PLAYER_NOTICE_KINDS: PlayerNoticeKind[] = [
    PlayerNoticeKind.BugReportFixed,
    PlayerNoticeKind.BugReportNotABug,
    PlayerNoticeKind.BugReportNeedsInfo,
    PlayerNoticeKind.General,
];

/** Whether a draft is still untouched, i.e. empty or one of the default texts, so picking another kind may replace it */
export const isDefaultNoticeMessage = (message: string): boolean =>
    !message.trim() || SENDABLE_PLAYER_NOTICE_KINDS.some((kind) => PLAYER_NOTICE_KINDS[kind].defaultMessage === message);

/** The heading of a notice of a kind this client may not know yet */
export const getPlayerNoticeKindInfo = (kind: PlayerNoticeKind | string): IPlayerNoticeKindInfo =>
    PLAYER_NOTICE_KINDS[kind as PlayerNoticeKind] ?? PLAYER_NOTICE_KINDS[PlayerNoticeKind.General];
