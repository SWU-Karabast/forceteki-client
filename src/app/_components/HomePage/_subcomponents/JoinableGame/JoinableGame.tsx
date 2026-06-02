import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { IJoinableGameProps } from '../../HomePageTypes';
import { ISetCode } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import OverlappingCards from '../OverlappingCards/OverlappingCards';
import { ILobbyCardData } from '../../HomePageTypes';
import { getUserPayload } from '@/app/_utils/ServerAndLocalStorageUtils';
import { FormatTagLabels, SwuGameFormat, GamesToWinMode, CardPool, CardPoolLabels } from '@/app/_constants/constants';
import PremierIcon from '/public/premier.svg';
import EternalIcon from '/public/eternal.svg';
import OpenIcon from '/public/open.svg';
import NextSetIcon from '/public/next_set.svg';
import Bo1Icon from '/public/bo1.svg';
import Bo3Icon from '/public/bo3.svg';

const JoinableGame: React.FC<IJoinableGameProps> = ({ lobby }) => {
    const router = useRouter();
    const { user } = useUser();

    const joinLobby = async (lobbyId: string) => {
        try {
            const payload = {
                lobbyId: lobbyId,
                user: getUserPayload(user)
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/join-lobby`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials:'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error joining lobby:', errorData.message);
                alert(errorData.message);
                return;
            }
            router.push('/lobby');
        } catch (error) {
            console.error('Error joining lobby:', error);
        }
    };

    // ------------------------STYLES------------------------//

    const styles = {
        box: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignContent: 'center',
            alignItems: 'center',
            mb: '1.25rem',
            padding: '0.5rem 0',
        },
        matchType: {
            margin: 0,
            fontWeight: 'bold',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
        },
        cardsContainer: {
            display: 'flex',
            alignItems: 'center',
        },
        parentBoxStyling: {
            position: 'absolute',
            left: '-15px',
            top: '24px',
        },
        cardPreview: {
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: 'clamp(3rem, 7vw, 10rem)',
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer'
        },
        cardPopover: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1.4 / 1',
            width: '24rem',
        },
        lobbyInfo: {
            display: 'flex',
            flex: 1,
            alignItems: 'flex-start',
            gap: '1rem',
        },
        tags: {
            lobbySetting: {
                padding: '4px 10px',
                borderRadius: '15px',
                fontSize: '0.75rem',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid',
                boxShadow: '0 0 5px',
                width:'fit-content',
            },
            format: {
                premier: {
                    borderColor: '#70fb6e',
                    color: '#70fb6e',
                    boxShadow: '0 0 5px #70fb6e',
                },
                open: {
                    borderColor: '#32e6da',
                    color: '#32e6da',
                    boxShadow: '0 0 5px #32e6da',
                },
                eternal: {
                    borderColor: '#ada2fd',
                    color: '#ada2fd',
                    boxShadow: '0 0 5px #ada2fd',
                },
                limited: {
                    borderColor: '#ffdd57',
                    color: '#ffdd57',
                    boxShadow: '0 0 5px #ffdd57',
                }
            },
            cardPool: {
                current: {
                    borderColor: '#ff5526',
                    color: '#ff5526',
                    boxShadow: '0 0 5px #ff5526',
                },
                nextSet: {
                    borderColor: '#bc63dc',
                    color: '#bc63dc',
                    boxShadow: '0 0 5px #bc63dc',
                }
            },
            gamesToWin: {
                bo1: {
                    borderColor: '#ffa726',
                    color: '#ffa726',
                    boxShadow: '0 0 5px #ffa726',
                },
                bo3: {
                    borderColor: '#ff66b2',
                    color: '#ff66b2',
                    boxShadow: '0 0 5px #ff66b2',
                }
            }
        }
    };

    const getGameFormatTagStyle = (format: SwuGameFormat) => {
        switch (format) {
            case SwuGameFormat.Premier:
                return styles.tags.format.premier;
            case SwuGameFormat.Open:
                return styles.tags.format.open;
            case SwuGameFormat.Eternal:
                return styles.tags.format.eternal;
            case SwuGameFormat.Limited:
                return styles.tags.format.limited;
            default:
                return {};
        }
    };

    const getFormatIcon = (format: SwuGameFormat) => {
        const iconStyle = { height: '0.75rem', width: 'auto' };
        switch (format) {
            case SwuGameFormat.Premier:
                return <PremierIcon style={iconStyle} />;
            case SwuGameFormat.Eternal:
                return <EternalIcon style={iconStyle} />;
            case SwuGameFormat.Open:
                return <OpenIcon style={iconStyle} />;
            default:
                return null;
        }
    };

    const getCardPoolTagStyle = (cardPool: CardPool) => {
        switch (cardPool) {
            case CardPool.Current:
                return styles.tags.cardPool.current;
            case CardPool.NextSet:
                return styles.tags.cardPool.nextSet;
            default:
                return {};
        }
    };

    const getCardPoolIcon = (cardPool: CardPool) => {
        const iconStyle = { height: '0.75rem', width: 'auto' };
        switch (cardPool) {
            case CardPool.NextSet:
                return <NextSetIcon style={iconStyle} />;
            default:
                return null;
        }
    };


    const getGamesToWinTagStyle = (mode: GamesToWinMode) => {
        switch (mode) {
            case GamesToWinMode.BestOfOne:
                return styles.tags.gamesToWin.bo1;
            case GamesToWinMode.BestOfThree:
                return styles.tags.gamesToWin.bo3;
            default:
                return {};
        }
    };

    const getGamesToWinIcon = (mode: GamesToWinMode) => {
        const iconStyle = { height: '0.75rem', width: 'auto' };
        switch (mode) {
            case GamesToWinMode.BestOfOne:
                return <Bo1Icon style={iconStyle} />;
            case GamesToWinMode.BestOfThree:
                return <Bo3Icon style={iconStyle} />;
            default:
                return null;
        }
    };

    const getGamesToWinLabel = (mode: GamesToWinMode) => {
        switch (mode) {
            case GamesToWinMode.BestOfOne:
                return 'Bo1';
            case GamesToWinMode.BestOfThree:
                return 'Bo3';
            default:
                return '';
        }
    };

    const createCardObject = (cardData: ILobbyCardData): ISetCode => {
        const setCode = cardData.id.split('_')[0];
        const cardNumber = parseInt(cardData.id.split('_')[1], 10);
        
        return {
            id: cardData.id,
            setId: {
                set: setCode,
                number: cardNumber
            },
            type: 'unit',
            types: ['unit']
        };
    };

    return (
        <Box sx={styles.box} key={lobby.id}>
            <Box sx={styles.lobbyInfo}>
                {lobby.host && (
                    <OverlappingCards
                        sx={styles.cardsContainer}
                        baseCard={createCardObject(lobby.host.base)}
                        leaderCard={createCardObject(lobby.host.leader)}
                    />
                )}
                <Box sx={{ minWidth: '50%' }}>
                    <Typography variant="body1" sx={styles.matchType}>{lobby.name}</Typography>
                    <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', marginBottom: '12px' }}>
                        <Box
                            sx={{
                                ...styles.tags.lobbySetting,
                                ...getGameFormatTagStyle(lobby.format),
                            }}
                        >
                            {getFormatIcon(lobby.format)}
                            { FormatTagLabels[lobby.format] || lobby.format.toUpperCase() }
                        </Box>
                        {lobby.cardPool !== 'unlimited' && (
                        // Don't show unlimited card pool tag because it's never selectable
                        // It's just the default card pool for Open lobbies
                            <Box
                                sx={{
                                    ...styles.tags.lobbySetting,
                                    ...getCardPoolTagStyle(lobby.cardPool),
                                }}
                            >
                                {getCardPoolIcon(lobby.cardPool)}
                                { CardPoolLabels[lobby.cardPool] || lobby.cardPool.toUpperCase() }
                            </Box>
                        )}
                        <Box
                            sx={{
                                ...styles.tags.lobbySetting,
                                ...getGamesToWinTagStyle(lobby.gamesToWinMode),
                            }}
                        >
                            {getGamesToWinIcon(lobby.gamesToWinMode)}
                            {getGamesToWinLabel(lobby.gamesToWinMode)}
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Button onClick={() => joinLobby(lobby.id)}>Join</Button>
        </Box>
    );
};

export default JoinableGame;
