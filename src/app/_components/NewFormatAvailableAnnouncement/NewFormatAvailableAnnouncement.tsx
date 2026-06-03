import { CardPool, FormatLabels, GameAnnouncement, LobbyFormatConfigs, QueueFormatConfigs } from '@/app/_constants/constants'
import { Typography } from '@mui/material';

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

    return <Typography variant="body1" sx={{ color: '#00f0ff', textAlign: 'center', mb: '1rem' }}>
        {text}
    </Typography>
}

export default GameAnnouncementBanner;