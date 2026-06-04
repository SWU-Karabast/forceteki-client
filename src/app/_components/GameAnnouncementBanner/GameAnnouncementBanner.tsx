import { CardPool, FormatLabels, LobbyFormatConfigs, QueueFormatConfigs, SwuGameFormat } from '@/app/_constants/constants'
import { Typography } from '@mui/material';

export type GameAnnouncement =
    | { kind: 'newFormat'; format: SwuGameFormat; cardPool?: CardPool }
    | { kind: 'custom'; message: string };

/**
 * Banner shown on the Create Game and Quick Game forms to announce noteworthy changes
 * (new formats, new card pools, new integrations, etc.). Rendered as a single line of
 * neon-colored text.
 *
 * Usage:
 *   - Set to `undefined` to hide the banner entirely.
 *   - For a one-off message (e.g. a new feature):
 *       { kind: 'custom', message: 'Melee.gg deck links are now supported!' }
 *   - For a format rollout (auto-generates "<Format> format[ with Next Set cards] is now
 *     available[ in Lobbies]!" based on current LobbyFormatConfigs / QueueFormatConfigs):
 *       { kind: 'newFormat', format: SwuGameFormat.Premier, cardPool: CardPool.NextSet }
 *
 * Only one announcement is shown at a time — overwrite this value when rolling out the next one.
 */
export const CurrentGameAnnouncement: GameAnnouncement | undefined = {
    kind: 'custom',
    message: 'Melee.gg deck links are now supported!',
};

interface IGameAnnouncementBannerProps {
    announcement: GameAnnouncement;
}

const GameAnnouncementBanner: React.FC<IGameAnnouncementBannerProps> = ({
    announcement,
}: IGameAnnouncementBannerProps) => {
    let text: string;
    if (announcement.kind === 'custom') {
        text = announcement.message;
    } else {
        const { format, cardPool } = announcement;
        const isAvailableInQueue = QueueFormatConfigs.some((config) => config.format === format);
        const isAvailableInLobby = LobbyFormatConfigs.some((config) => config.format === format);
        const isOnlyInLobby = isAvailableInLobby && !isAvailableInQueue;
        text = `${FormatLabels[format]} format${cardPool === CardPool.NextSet ? ' with Next Set cards' : ''} is now available${isOnlyInLobby ? ' in Lobbies' : ''}!`;
    }

    return <Typography variant="body1" sx={{ color: '#fff200', textAlign: 'center', mb: '1rem' }}>
        {text}
    </Typography>
}

export default GameAnnouncementBanner;