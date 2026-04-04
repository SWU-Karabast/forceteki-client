// Shared styles for Bo3 Score Table components

export const scoreTableStyles = {
    tableContainer: {
        // Container defaults - can be overridden
    },
    table: {
        maxWidth: '300px',
    },
    tableFullWidth: {
        width: '100%',
    },
    headerCell: {
        color: 'white',
        borderBottom: '1px solid #444',
        fontWeight: 'normal',
        fontSize: '1rem',
    },
    bodyCell: {
        color: 'white',
        fontWeight: 'bold',
        borderBottom: '1px solid #333',
        fontSize: '1rem',
    },
    bodyCellWins: {
        color: 'white',
        borderBottom: '1px solid #333',
        fontSize: '1rem',
    },
    setCompleteNotice: {
        color: '#ff9800',
        mt: '15px',
    },
    concedeNotice: {
        color: '#ff9800',
        fontWeight: 'bold',
        mb: '15px',
        fontSize: '1.3rem',
    },
};

// Utility to sort players with connected player first
export const sortPlayersConnectedFirst = (connectedPlayer: string) => {
    return (a: string, b: string): number => {
        if (a === connectedPlayer) return -1;
        if (b === connectedPlayer) return 1;
        return 0;
    };
};
