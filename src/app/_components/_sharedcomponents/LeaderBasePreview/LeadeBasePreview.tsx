import React from 'react';
import { ILeaderBasePreviewProps } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { Box } from '@mui/material';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';

const LeaderBasePreview: React.FC<ILeaderBasePreviewProps> = ({
    leader,
    base,
}) => {
    const styles = {
        CardSetContainerStyle:{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            width: '14.2rem',
            height: '12.1rem',
        },
        parentBoxStyling: {
            position:'absolute',
        },
    }

    return (
        <Box sx={styles.CardSetContainerStyle}>
            <Box>
                <LeaderBaseCard isLobbyView={true} size={'large'} variant={'base'} card={base}/>
            </Box>
            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                <LeaderBaseCard isLobbyView={true} size={'large'} variant={'leader'} card={leader}/>
            </Box>
        </Box>
    );
};

export default LeaderBasePreview;