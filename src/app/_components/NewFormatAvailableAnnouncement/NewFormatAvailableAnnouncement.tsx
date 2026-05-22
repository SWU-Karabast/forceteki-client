import { CardPool, FormatLabels, LobbyFormatConfigs, QueueFormatConfigs, SwuGameFormat } from '@/app/_constants/constants'
import { Typography } from '@mui/material';

interface INewFormatAvailableAnnouncementProps {
    format: SwuGameFormat;
    cardPool?: CardPool;
}

const NewFormatAvailableAnnouncement: React.FC<INewFormatAvailableAnnouncementProps> = ({
    format,
    cardPool
}: INewFormatAvailableAnnouncementProps) => {
    const isAvailableInQueue = QueueFormatConfigs.some((config) => config.format === format);
    const isAvailableInLobby = LobbyFormatConfigs.some((config) => config.format === format);
    const isOnlyInLobby = isAvailableInLobby && !isAvailableInQueue;

    return <Typography variant="body1" sx={{ color: '#70fb6e', textAlign: 'center', mb: '1rem', fontSize: { xs: '1.6rem', md: '1rem' } }}>
        {FormatLabels[format]} format{cardPool === CardPool.NextSet ? ' with Next Set cards' : ''} is now available{isOnlyInLobby ? ' in Lobbies' : ''}!
    </Typography>
}

export default NewFormatAvailableAnnouncement;