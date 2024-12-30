import React from 'react';
import {
    Card,
    CardActionArea,
    CardContent,
    Typography,
    Box,
} from '@mui/material';
import { ILeaderBaseCardProps } from '../CardTypes';
import { ICardData } from '../CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';


const LeaderBaseCard: React.FC<ILeaderBaseCardProps> = ({
    variant,
    isLobbyView = false,
    title,
    card,
    disabled = false,
}) => {
    const cardBorderColor = (card: ICardData) => {
        if (!card) return '';
        if (card.selected) return 'yellow';
        if (card.selectable) return 'limegreen';
        if (card.exhausted) return 'gray';
        return 'black';
    };

    const cardStyle = {
        backgroundColor: 'black',
        backgroundImage: `url(${s3CardImageURL(card)})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        width: '10rem',
        height: '7.18rem',
        textAlign: 'center',
        color: 'white',
        display: 'flex',
        cursor: 'pointer',
        m: '0em',
        position: 'relative', // Needed for positioning the red box
        border: `2px solid ${cardBorderColor(card)}`,
    };
    const cardStyleLobby = card ? {
        backgroundColor: 'transparent',
        backgroundImage: `url(${s3CardImageURL(card)})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        width: '9.5vw',
        height: '13vh',
        backgroundRepeat: 'no-repeat',
        textAlign: 'center' as const,
        color: 'white',
        display: 'flex',
        cursor: 'pointer',
        position: 'relative' as const,
        mb: '10px',
    } : {
        backgroundColor: '#00000040',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        width: '9.5vw',
        height: '13vh',
        backgroundRepeat: 'no-repeat',
        textAlign: 'center' as const,
        color: 'white',
        display: 'flex',
        cursor: 'pointer',
        position: 'relative' as const,
        mb: '10px',
    };

    const damageStyle = {
        fontWeight: '600',
        fontSize: '2em',
        color: 'hotpink',
    };

    // the title of the deck i believe
    const redBoxStyle = {
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'red',
        borderRadius: '4px',
        p: '4px 8px',
    };

    const redBoxTypographyStyle = {
        color: 'white',
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '600',
        fontSize: '1em',
    };

    const { sendGameMessage } = useGame();

    return (
        <Box>
            <Card
                sx={isLobbyView ? cardStyleLobby : cardStyle}
                onClick={() => {
                    // Only allow clicking if not lobby view and the card is selectable
                    if (!disabled && card.selectable) {
                        sendGameMessage(['cardClicked', card.uuid]);
                    }
                }}
            >
                {/* Only show card content if not in lobby view */}
                {!isLobbyView && card && (
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                            <Typography variant="body1" sx={damageStyle}>
                                {card.damage}
                            </Typography>
                        </Box>
                    </CardContent>
                )}

                {/* Show title inside a red box only if variant is leader and not lobby view */}
                {variant === 'leader' && !isLobbyView && title && (
                    <Box sx={redBoxStyle}>
                        <Typography variant="body2" sx={redBoxTypographyStyle}>
                            {title}
                        </Typography>
                    </Box>
                )}
            </Card>
        </Box>
    );
};

export default LeaderBaseCard;