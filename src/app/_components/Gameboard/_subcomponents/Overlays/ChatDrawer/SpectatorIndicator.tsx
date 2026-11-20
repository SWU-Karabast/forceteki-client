import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useGame } from '@/app/_contexts/Game.context';
import { ISpectatorSummary } from '@/app/_components/Gameboard/GameboardTypes';

// ----------------Look----------------//
// The choices to iterate on. Other icons that fit: VisibilityOutlined (the eye), PeopleOutline,
// GroupsOutlined, Person (filled), all from @mui/icons-material.
const look = {
    Icon: PersonOutlineIcon,
    // the words beside the count; null shows the bare number
    label: 'spectating' as string | null,
};

const peopleWatching = (count: number) => {
    if (count === 0) {
        return 'No one is watching right now.';
    }
    return count === 1 ? '1 person is watching.' : `${count} people are watching.`;
};

/** The tooltip text. A spectator is counted among the people watching. */
export const spectatorIndicatorTooltip = (count: number, isSpectator: boolean) => {
    if (isSpectator) {
        return count <= 1 ? 'You are the only one watching.' : `${count} people are watching, including you.`;
    }
    return `${peopleWatching(count)} Spectators can't see your name or your hand.`;
};

// ----------------Styles----------------//
// Sized in em, so the status bar's font size scales the icon and text together.
const styles = {
    // the coach and judge badges go beside the count, inside this container
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5em',
    },
    count: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.3em',
        borderRadius: '4px',
        cursor: 'default',
        '&:focus-visible': {
            outline: '2px solid rgba(143, 214, 255, 0.85)',
            outlineOffset: '2px',
        },
    },
    icon: {
        fontSize: '1.25em',
    },
    text: {
        fontSize: 'inherit',
        color: 'inherit',
        lineHeight: 1,
    },
    number: {
        fontWeight: 600,
    },
};

/**
 * How many people are watching, for players and spectators. Shown once anyone is watching, and to
 * players at 0 when the lobby allows spectating, so they know people could watch.
 */
const SpectatorIndicator: React.FC = () => {
    const { gameState, lobbyState, isSpectator } = useGame();
    const summary: ISpectatorSummary | undefined = gameState?.spectatorSummary;

    if (!summary) {
        return null;
    }

    const spectatingAllowed = lobbyState?.settings?.allowSpectators === true;
    if (summary.count === 0 && (isSpectator || !spectatingAllowed)) {
        return null;
    }

    const tooltip = spectatorIndicatorTooltip(summary.count, isSpectator);

    return (
        <Box sx={styles.container}>
            <Tooltip arrow title={tooltip}>
                <Box sx={styles.count} tabIndex={0} aria-label={tooltip}>
                    <look.Icon aria-hidden="true" sx={styles.icon} />
                    <Typography component="span" sx={styles.text}>
                        <Box component="span" sx={styles.number} data-spectator-count>{summary.count}</Box>
                        {look.label && ` ${look.label}`}
                    </Typography>
                </Box>
            </Tooltip>
        </Box>
    );
};

export default SpectatorIndicator;
