import { FormatLabels, SwuGameFormat } from '@/app/_constants/constants'
import { Typography } from '@mui/material';

interface INewFormatAvailableAnnouncementProps {
    format: SwuGameFormat;
}

const NewFormatAvailableAnnouncement: React.FC<INewFormatAvailableAnnouncementProps> = ({
    format,
}: INewFormatAvailableAnnouncementProps) => {
    return <Typography variant="body1" sx={{ color: 'orchid', textAlign: 'center', mb: '1rem' }}>
        {FormatLabels[format]} format is now available!
    </Typography>
}

export default NewFormatAvailableAnnouncement;