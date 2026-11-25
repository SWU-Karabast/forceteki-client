import React, { useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { IPlayerSearchResult } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

interface IPlayerSearchProps {

    /** Called with the player clicked in the results, or straight away when the search finds only one. */
    onSelect: (player: IPlayerSearchResult) => void;
}

const PlayerSearch: React.FC<IPlayerSearchProps> = ({ onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<IPlayerSearchResult[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) {
            return;
        }

        setIsSearching(true);
        setErrorMessage(null);
        setSearchResults(null);
        try {
            const { players } = await ServerApiService.findUserAsync(query);
            if (players.length === 1) {
                selectPlayer(players[0]);
            } else {
                setSearchResults(players);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to find the player');
        } finally {
            setIsSearching(false);
        }
    };

    const selectPlayer = (player: IPlayerSearchResult) => {
        setSearchResults(null);
        onSelect(player);
    };

    // ======================== STYLES ========================
    const styles = {
        searchRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            mb: '1rem',
        },
        hint: {
            color: '#9A9A9A',
            fontSize: '0.9rem',
            mb: '1rem',
        },
        searchResult: {
            all: 'unset',
            boxSizing: 'border-box',
            display: 'flex',
            width: '100%',
            gap: '0.75rem',
            alignItems: 'baseline',
            p: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'rgba(47, 125, 182, 0.18)' },
        },
        secondaryText: {
            color: '#9A9A9A',
            fontSize: '0.85rem',
        },
    };

    return (
        <>
            {errorMessage && <Alert severity="error" sx={{ mb: '1rem' }}>{errorMessage}</Alert>}

            <Box sx={styles.searchRow}>
                <StyledTextField
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === 'Enter') {
                            void handleSearch();
                        }
                    }}
                    placeholder="Find a player by username or user ID"
                />
                <PreferenceButton
                    variant={'standard'}
                    text={isSearching ? 'Searching...' : 'Search'}
                    disabled={isSearching || !searchQuery.trim()}
                    buttonFnc={() => void handleSearch()}
                />
            </Box>

            {searchResults && searchResults.length === 0 && (
                <Typography sx={styles.hint}>No player found.</Typography>
            )}
            {searchResults && searchResults.length > 0 && (
                <Box sx={{ mb: '1rem' }}>
                    {searchResults.map((player) => (
                        <Box
                            key={player.id}
                            component="button"
                            sx={styles.searchResult}
                            onClick={() => selectPlayer(player)}
                        >
                            <Typography>{player.username}</Typography>
                            <Typography sx={styles.secondaryText}>{player.id}</Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </>
    );
};

export default PlayerSearch;
