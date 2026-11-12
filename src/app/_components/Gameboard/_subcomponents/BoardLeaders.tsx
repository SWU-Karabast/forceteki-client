import React from 'react';
import { Box, Typography } from '@mui/material';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';
import { ICardData, LeaderBaseCardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

interface IBoardLeadersProps {
    leaders: ICardData[];
    // player name shown with the leader(s)
    title: string;
    // which end of the board's middle column this player's leaders sit at
    position: 'top' | 'bottom';
    isPortrait: boolean;
}

const styles = {
    leaderWrapper: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
    },
    pairContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
    },
    pairRow: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        // wide enough that a card's epic action / blank icon (which sticks out 4px on the right) never touches its neighbor
        gap: 'clamp(6px, 0.8vh, 8px)',
    },
    pairCard: {
        flex: 1,
        minWidth: 0,
    },
    pairNameplate: {
        maxWidth: '100%',
        borderRadius: '0.5rem',
        p: { xs: '0 6px', md: '2px 10px' },
        backgroundColor: 'black',
    },
    pairNameplateText: {
        color: 'white',
        fontWeight: '600',
        fontSize: { xs: '0.75rem', md: '1em' },
        lineHeight: 1.3,
        textOverflow: 'ellipsis',
        textWrap: 'nowrap',
        overflow: 'hidden',
    },
};

/**
 * One player's leader(s) in the board's middle column.
 *
 * A single leader renders as it always has, with the player's name on the card. Two leaders (Faux Suns) stack in
 * portrait, the first leader at the outer edge with the name on it, and sit side by side in landscape (the board widens
 * the middle column for this), with the name centered below the pair rather than across the gap between them.
 */
const BoardLeaders: React.FC<IBoardLeadersProps> = ({ leaders, title, position, isPortrait }) => {
    const leaderCard = (card: ICardData, cardTitle?: string) => (
        <LeaderBaseCard
            card={card}
            cardStyle={LeaderBaseCardStyle.Leader}
            title={cardTitle}
            isLeader={true}
        />
    );

    const [firstLeader, secondLeader] = leaders;
    if (!firstLeader) {
        return null;
    }

    if (!secondLeader) {
        return <Box sx={styles.leaderWrapper}>{leaderCard(firstLeader, title)}</Box>;
    }

    if (isPortrait) {
        const outerToInner = [firstLeader, secondLeader];
        const topToBottom = position === 'top' ? outerToInner : [...outerToInner].reverse();
        return (
            <>
                {topToBottom.map((card) => (
                    <Box key={card.uuid} sx={styles.leaderWrapper}>
                        {leaderCard(card, card === firstLeader ? title : undefined)}
                    </Box>
                ))}
            </>
        );
    }

    return (
        <Box sx={styles.pairContainer}>
            <Box sx={styles.pairRow}>
                <Box sx={styles.pairCard}>{leaderCard(firstLeader)}</Box>
                <Box sx={styles.pairCard}>{leaderCard(secondLeader)}</Box>
            </Box>
            <Box sx={styles.pairNameplate}>
                <Typography variant="body2" sx={styles.pairNameplateText}>{title}</Typography>
            </Box>
        </Box>
    );
};

export default BoardLeaders;
