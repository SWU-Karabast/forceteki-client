import React from 'react';
import { Box, Button, Typography, Popover, PopoverOrigin } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { IJoinableGameProps } from '../../HomePageTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle, ISetCode } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { ILobbyCardData } from '../../HomePageTypes';
import { getUserPayload } from '@/app/_utils/ServerAndLocalStorageUtils';
import { FormatLabels, FormatTagLabels, SwuGameFormat } from '@/app/_constants/constants';
import PremierIcon from '/public/premier.svg';
import OpenIcon from '/public/open.svg';
import NextSetIcon from '/public/next_set.svg';

const JoinableGame: React.FC<IJoinableGameProps> = ({ lobby }) => {
    const router = useRouter();
    const { user } = useUser();
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');

        if (!imageUrl) return;

        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        }, 300);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setPreviewImage(null);
    };

    const popoverConfig = (): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
        return {
            anchorOrigin: {
                vertical: 'center',
                horizontal: 'right',
            },
            transformOrigin: {
                vertical: 'center',
                horizontal: 'left',
            }
        };
    };
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
        },
        cardsContainer: {
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '10px',
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
                marginTop: '8px',
                marginBottom: '12px',
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
                nextSet: {
                    borderColor: '#ada2fd',
                    color: '#ada2fd',
                    boxShadow: '0 0 5px #ada2fd',
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
            // case SwuGameFormat.NextSetPreview:
            //     return styles.tags.format.nextSet;
            default:
                return {};
        }
    };

    const getFormatIcon = (format: SwuGameFormat) => {
        const iconStyle = { height: '0.75rem', width: 'auto' };
        switch (format) {
            case SwuGameFormat.Premier:
                return <PremierIcon style={iconStyle} />;
            case SwuGameFormat.Open:
                return <OpenIcon style={iconStyle} />;
            // case SwuGameFormat.NextSetPreview:
            //     return <NextSetIcon style={iconStyle} />;
            default:
                return null;
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
        <>
            <Box sx={styles.box} key={lobby.id}>
                <Box sx={styles.lobbyInfo}>
                    {lobby.host && (
                        <Box sx={styles.cardsContainer}>
                            <Box sx={{ position: 'relative' }}>
                                <Box>
                                    <Box 
                                        sx={{
                                            ...styles.cardPreview,
                                            backgroundImage: `url(${s3CardImageURL(createCardObject(lobby.host.base), CardStyle.Plain)})`
                                        }}
                                        title={`Base: ${lobby.host.base.id}`}
                                        onMouseEnter={handlePreviewOpen}
                                        onMouseLeave={handlePreviewClose}
                                        data-card-url={s3CardImageURL(createCardObject(lobby.host.base), CardStyle.Plain)}
                                    >
                                    </Box>
                                </Box>
                                <Box sx={styles.parentBoxStyling}>
                                    <Box 
                                        sx={{
                                            ...styles.cardPreview,
                                            backgroundImage: `url(${s3CardImageURL(createCardObject(lobby.host.leader), CardStyle.PlainLeader)})`
                                        }}
                                        title={`Leader: ${lobby.host.leader.id}`}
                                        onMouseEnter={handlePreviewOpen}
                                        onMouseLeave={handlePreviewClose}
                                        data-card-url={s3CardImageURL(createCardObject(lobby.host.leader), CardStyle.PlainLeader)}
                                    >
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    <Box>
                        <Typography variant="body1" sx={styles.matchType}>{lobby.name}</Typography>
                        <Box
                            sx={{
                                ...styles.tags.lobbySetting,
                                ...getGameFormatTagStyle(lobby.format),
                            }}
                        >
                            {getFormatIcon(lobby.format)}
                            { FormatTagLabels[lobby.format] || lobby.format.toUpperCase() }
                        </Box>
                    </Box>
                </Box>
                <Button onClick={() => joinLobby(lobby.id)}>Join</Button>
            </Box>
            <Popover
                id="mouse-over-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                slotProps={{ paper: { sx: { backgroundColor: 'transparent' } } }}
                {...popoverConfig()}
            >
                <Box sx={{ ...styles.cardPopover, backgroundImage: previewImage }} />
            </Popover>
        </>
    );
};

export default JoinableGame;
