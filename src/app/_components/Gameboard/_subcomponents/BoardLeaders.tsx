import React from 'react';
import { Box, Typography } from '@mui/material';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';
import { ICardData, LeaderBaseCardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

interface IBoardLeadersProps {
    leaders: ICardData[];
    // player name shown with the leader(s)
    title: string;
    // a compact board (see useIsCompactBoard) fits two leaders into the space of one card
    isCompact: boolean;
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
    compactPair: {
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
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
    // the same nameplate a single leader card carries, over the bottom of the pair
    compactNameplate: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        // above the cards' image and overlay; clicks and hovers still reach the cards around it
        zIndex: 1,
        pointerEvents: 'none',
        maxWidth: '100%',
        borderRadius: '0.5rem',
        p: { xs: '2px 5px', md: '5px 10px' },
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
 * A single leader renders as it always has, with the player's name on the card. Two leaders (Faux Suns) sit side by
 * side: on a large screen at full size (the board widens the middle column for this), with the name centered below the
 * pair; on a compact board cut down to their art so that both fit in the space of one card, with the name on them as on
 * a single leader. Hovering a leader still previews the whole card.
 */
const BoardLeaders: React.FC<IBoardLeadersProps> = ({ leaders, title, isCompact }) => {
    const leaderCard = (card: ICardData, cardTitle?: string, artOnly = false) => (
        <LeaderBaseCard
            card={card}
            cardStyle={LeaderBaseCardStyle.Leader}
            title={cardTitle}
            isLeader={true}
            artOnly={artOnly}
        />
    );

    const [firstLeader, secondLeader] = leaders;
    if (!firstLeader) {
        return null;
    }

    if (!secondLeader) {
        return <Box sx={styles.leaderWrapper}>{leaderCard(firstLeader, title)}</Box>;
    }

    if (isCompact) {
        return (
            <Box sx={styles.compactPair}>
                <Box sx={styles.pairCard}>{leaderCard(firstLeader, undefined, true)}</Box>
                <Box sx={styles.pairCard}>{leaderCard(secondLeader, undefined, true)}</Box>
                <Box sx={styles.compactNameplate}>
                    <Typography variant="body2" sx={styles.pairNameplateText}>{title}</Typography>
                </Box>
            </Box>
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
