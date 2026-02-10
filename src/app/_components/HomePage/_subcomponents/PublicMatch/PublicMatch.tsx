import React from 'react';
import { Box, Button, Typography, Popover, PopoverOrigin } from '@mui/material';
import GameInProgressPlayer from '../GameInProgressPlayer/GameInProgressPlayer';
import { IPublicGameInProgressProps } from '../../HomePageTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { LeaderBaseCardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { getUserPayload } from '@/app/_utils/ServerAndLocalStorageUtils';

const PublicMatch: React.FC<IPublicGameInProgressProps> = ({ match }) => {
    const router = useRouter();
    const { user, anonymousUserId } = useUser();
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

    const handleSpectate = async () => {
        try {
            // Register as a spectator with the server
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/spectate-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: match.id,
                    user: getUserPayload(user),
                }),
                credentials:'include'
            });

            const data = await response.json();
            if (data.success) {
                // Navigate to the game as a spectator
                router.push('/GameBoard?spectator=true');
            } else {
                console.error('Failed to join as spectator:', data.message);
            }
        } catch (error) {
            console.error('Error joining as spectator:', error);
        }
    };

    const handleLoginRedirect = () =>{
        router.push('/auth');
    }

    const styles = {
        cardPopover: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1.4 / 1',
            width: '24rem',
        },
        box: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '2.5rem',
            pl: '10px',
        },
        matchItems: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        matchType: {
            margin: 0,
            mr: '1rem',
        },
        leaderStyleCard:{
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: 'clamp(3rem, 7vw, 10rem)', // Min 5rem, max 10rem, scales with viewport
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer'
        },
        parentBoxStyling: {
            position:'absolute',
        },
    };

    return (
        <>
            <Box sx={styles.box}>
                <Box sx={styles.matchItems}>
                    <Box sx={{ position:'relative' }}>
                        <Box>
                            <Box 
                                sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player1Base)})` }}
                                onMouseEnter={handlePreviewOpen}
                                onMouseLeave={handlePreviewClose}
                                data-card-url={s3CardImageURL(match.player1Base)}
                            />
                        </Box>
                        <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                            <Box 
                                sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player1Leader, LeaderBaseCardStyle.PlainLeader)})` }}
                                onMouseEnter={handlePreviewOpen}
                                onMouseLeave={handlePreviewClose}
                                data-card-url={s3CardImageURL(match.player1Leader, LeaderBaseCardStyle.PlainLeader)}
                            />
                        </Box>
                    </Box>
                    <Typography variant="body1" sx={styles.matchType}>vs</Typography>
                    <Box sx={{ position:'relative' }}>
                        <Box>
                            <Box 
                                sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player2Base)})` }}
                                onMouseEnter={handlePreviewOpen}
                                onMouseLeave={handlePreviewClose}
                                data-card-url={s3CardImageURL(match.player2Base)}
                            />
                        </Box>
                        <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                            <Box 
                                sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player2Leader, LeaderBaseCardStyle.PlainLeader)})` }}
                                onMouseEnter={handlePreviewOpen}
                                onMouseLeave={handlePreviewClose}
                                data-card-url={s3CardImageURL(match.player2Leader, LeaderBaseCardStyle.PlainLeader)}
                            />
                        </Box>
                    </Box>
                </Box>
                {!match.isPrivate && (
                    user ? (
                        <Button onClick={handleSpectate}>Spectate</Button>
                    ) : (
                        <Button title="Login to Spectate" onClick={handleLoginRedirect}>Login</Button>
                    )
                )}
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

export default PublicMatch;
