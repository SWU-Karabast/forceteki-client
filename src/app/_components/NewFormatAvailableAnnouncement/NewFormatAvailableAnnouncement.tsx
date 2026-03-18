import { FormatLabels, LobbyFormatConfigs, QueueFormatConfigs, SwuGameFormat } from '@/app/_constants/constants'
import { Typography } from '@mui/material';

interface INewFormatAvailableAnnouncementProps {
    format: SwuGameFormat;
}

const NewFormatAvailableAnnouncement: React.FC<INewFormatAvailableAnnouncementProps> = ({
    format,
}: INewFormatAvailableAnnouncementProps) => {
    const isAvailableInQueue = QueueFormatConfigs.some((config) => config.format === format);
    const isAvailableInLobby = LobbyFormatConfigs.some((config) => config.format === format);
    const isOnlyInLobby = isAvailableInLobby && !isAvailableInQueue;

    return <Typography variant="body1" sx={{ color: 'orchid', textAlign: 'center', mb: '1rem' }}>
        {FormatLabels[format]} format is now available{isOnlyInLobby ? ' in Lobbies' : ''}!
    </Typography>
}

export default NewFormatAvailableAnnouncement;