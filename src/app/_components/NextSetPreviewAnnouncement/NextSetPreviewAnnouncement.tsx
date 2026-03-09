import { Typography } from '@mui/material';

type INextSetPreviewAnnouncementProps = Record<never, string>;

const NextSetPreviewAnnouncement: React.FC<INextSetPreviewAnnouncementProps> = ({}: INextSetPreviewAnnouncementProps) => {
    return <Typography variant="body1" sx={{ color: 'orange', textAlign: 'center', mb: '1rem' }}>
        Next Set Preview format is now available!
    </Typography>
}

export default NextSetPreviewAnnouncement;