import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, Divider, TextField, Typography } from '@mui/material';
import PublicMatch from '../PublicMatch/PublicMatch';
import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

interface GameCardData {
    id: string;
    isPrivate: boolean;
    player1Leader: ICardData;
    player1Base: ICardData;
    player2Leader: ICardData;
    player2Base: ICardData;
}

interface OngoingGamesData {
    numberOfOngoingGames: number;
    ongoingGames: GameCardData[];
}

interface LeaderNameData {
    name: string;
    subtitle?: string;
    id: string;
    ongoingGamesCount?: number;
}

const fetchOngoingGames = async (setGamesData: (games: OngoingGamesData | null) => void) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/ongoing-games`);

        if (!response.ok) {
            throw new Error(`Failed to fetch ongoing games: ${response.status} ${response.statusText}`);
        }

        const fetchedData: OngoingGamesData = await response.json();
        setGamesData(fetchedData);
    } catch (err) {
        console.error('Error fetching ongoing games:', err);
        setGamesData(null); // Handle error case
    }
};

const fetchLeaderData = async (setLeaderData: (leaders: LeaderNameData[] | null) => void) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-leaders`);

        if (!response.ok) {
            throw new Error(`Failed to fetch leader data: ${response.status} ${response.statusText}`);
        }

        const fetchedData: LeaderNameData[] = await response.json();
        setLeaderData(fetchedData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
        console.error('Error fetching ongoing games:', err);
        setLeaderData(null); // Handle error case
    }
}

const updateLeaderData = (
    games: OngoingGamesData | null,
    leaderData: LeaderNameData[] | null,
    setLeaderData: (leaders: LeaderNameData[] | null) => void
) => {
    const leaderCount = new Map<string, number>();
    const addLeaderCount = (leaderId: string) => {
        const currentCount = leaderCount.get(leaderId);
        if (currentCount) {
            leaderCount.set(leaderId, currentCount + 1);
        } else {
            leaderCount.set(leaderId, 1);
        }
    }

    if (!leaderData) return;

    if (games) {
        for (const game of games.ongoingGames) {
            if (game.player1Leader.id) {
                addLeaderCount(game.player1Leader.id);
            }

            if (game.player2Leader.id && game.player2Leader.id !== game.player1Leader.id) {
                addLeaderCount(game.player2Leader.id);
            }
        }
    }

    const newLeaderData: LeaderNameData[] = []
    for (const leader of leaderData) {
        const leaderGameCount = leaderCount.get(leader.id) || 0;
        leader.ongoingGamesCount = leaderGameCount;
        newLeaderData.push(leader);
    }
    setLeaderData(newLeaderData);
}

const getOptionLabel = (option: LeaderNameData): string => {
    const count = option.ongoingGamesCount ?? 0;
    const subtitle = option.subtitle ? ` - ${option.subtitle}` : '';
    return `${option.name}${subtitle} (${count})`;
}

const GamesInProgress: React.FC = () => {
    const [gamesData, setGamesData] = useState<OngoingGamesData | null>(null);
    const [sortByLeader, setSortByLeader] = useState<string | null>(null);
    const [leaderData, setLeaderData] = useState<LeaderNameData[] | null>(null);

    useEffect(() => {
        let count = 0;
        let intervalId: NodeJS.Timeout;

        const fetchData = () => {
            fetchOngoingGames(setGamesData);
            count++;

            if (count === 6) {
                clearInterval(intervalId);
                intervalId = setInterval(() => {
                    fetchOngoingGames(setGamesData);
                    count++;
                    if (count === 15) {
                        clearInterval(intervalId);
                    }
                }, 60000); // Fetch once per minute
            }
        };

        fetchLeaderData(setLeaderData);
        fetchData();
        intervalId = setInterval(fetchData, 10000); // Fetch every 10 seconds

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        updateLeaderData(gamesData, leaderData, setLeaderData);
    }, [gamesData]);

    const filterByLeader = (match: GameCardData): boolean => {
        if (!leaderData || !sortByLeader) return true;
        const leaderIds = [match.player1Leader.id, match.player2Leader.id];
        return leaderIds.some(id => leaderData.some(leader => leader.id === id && leader.id === sortByLeader));
    };

    const styles = {
        headerBox: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            alignContent: 'center',
            mt: 1,
        },
        divider: {
            mt: '.5vh',
            mb: '1vh',
        },
        activeGamesNumber: {
            fontWeight: 400,
        },
        sortFilterRow: {
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'space-between',
            paddingTop: '2px',
            marginTop: '1vh',
        },
        filterByLeaderAutoComplete: { 
            my: '.5vh',
            '& .MuiInputBase-input': {
                textAlign: 'left'
            },
        },
        filterByLeaderSlotProps: {
            inputLabel: {
                sx: {
                    color: '#fff',
                    '&.Mui-focused': {
                        color: '#fff',
                    },
                    '&.MuiInputLabel-shrink': {
                        color: '#fff',
                    },

                }
            }
        },
        autocompleteSlotProps: {
            clearIndicator: {
                sx: {
                    color: '#fff'
                }
            },
            popupIndicator: {
                sx: {
                    color: '#fff'
                }
            },
            popper: {
                sx: {
                    '& .MuiAutocomplete-noOptions': {
                        color: '#fff',
                        backgroundColor: '#394452',
                    }
                }
            } 
        },
        leaderName: {
            flexGrow: 1,
            '& span': {
                color: '#bbbbbb',
            },
        },
        leaderActiveGamesCount: {
            color: '#fff',
            fontWeight: 600,
        }
    };

    return (
        <>
            <Box sx={styles.headerBox}>
                <Typography variant="h3">Games in Progress</Typography>
                <Typography variant="h3" sx={styles.activeGamesNumber}>{gamesData?.numberOfOngoingGames || 0}</Typography>
            </Box>
            <Box sx={styles.sortFilterRow}>
                <Autocomplete
                    fullWidth
                    options={leaderData || []}
                    getOptionLabel={(option) => getOptionLabel(option)}
                    renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps}>
                                <Box sx={styles.leaderName}>
                                    {option.name}
                                    <br />
                                    <span>{option.subtitle}</span>
                                </Box>
                                <Box sx={styles.leaderActiveGamesCount}>
                                    {option.ongoingGamesCount}
                                </Box>
                            </li>
                        );
                    }}
                    value={leaderData?.find(l => l.id === sortByLeader) || null}
                    onChange={(_, newValue) => setSortByLeader(newValue ? newValue.id : null)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    sx={styles.filterByLeaderAutoComplete}
                    noOptionsText='No Leaders Found...'
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Filter by Leader"
                            variant="outlined"
                            slotProps={styles.filterByLeaderSlotProps}
                        />
                    )}
                    slotProps={styles.autocompleteSlotProps}
                />
            </Box>
            <Divider sx={styles.divider} />
            <Box>
                {gamesData?.ongoingGames
                    .filter((match) => filterByLeader(match))
                    .map((match, index) => (
                        <PublicMatch key={index} match={match} />
                    ))}
            </Box>
        </>
    );
};

export default GamesInProgress;
