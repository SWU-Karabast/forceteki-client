'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Popover, Tooltip, Typography, useMediaQuery } from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeckComponent from '@/app/_components/DeckPage/DeckComponent/DeckComponent';
import { useParams, useRouter } from 'next/navigation';
import { fetchDeckData, IDeckData } from '@/app/_utils/fetchDeckData';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import PercentageCircle from '@/app/_components/DeckPage/DeckComponent/PercentageCircle';
import AnimatedStatsTable from '@/app/_components/DeckPage/DeckComponent/AnimatedStatsTable';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import {
    convertStoredToDeckDetailedData,
    deleteDecks,
    getDeckFromServer,
    removeDeckFromLocalStorage,
} from '@/app/_utils/ServerAndLocalStorageUtils';
import {
    CardStyle,
    IDeckDetailedData,
    StoredDeck
} from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { useUser } from '@/app/_contexts/User.context';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';

const DeckDetails: React.FC = () => {
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [deckData, setDeckData] = useState<IDeckData | undefined>(undefined);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const params = useParams();
    const deckId = params?.DeckId;

    // error handling
    const [errorModalOpen, setErrorModalOpen] = useState(false);

    // For the raw/technical error details
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | string | undefined>(undefined);

    // preview states
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);
    const [displayDeck, setDisplayDeck ] = useState<IDeckDetailedData | null>(null);

    // State for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');
        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`)
        }, 500);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setPreviewImage(null);
        setAnchorElement(null);
    };

    const deckStats = useMemo(() => {
        const stats = displayDeck?.stats;
        if (!stats) {
            return {
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                winPercentage: 0
            };
        }

        const totalGames = stats.wins + stats.losses + stats.draws;
        const winPercentage = totalGames > 0
            ? Math.round((stats.wins / totalGames) * 100)
            : 0;

        return {
            wins: stats.wins,
            losses: stats.losses,
            draws: stats.draws,
            totalGames,
            winPercentage
        };
    }, [displayDeck?.stats]);


    const opponentStats = useMemo(() => {
        const stats = displayDeck?.stats?.statsByMatchup;
        if (!stats?.length) return [];

        return stats.map(stat => {
            const wins = stat.wins || 0;
            const losses = stat.losses || 0;
            const draws = stat.draws || 0;
            const total = wins + losses + draws;

            return {
                leaderId: stat.leaderId,
                leaderMelee: stat.leaderMelee,
                baseId: stat.baseId,
                baseMelee: stat.baseMelee,
                wins,
                losses,
                draws,
                total,
                winPercentage: total > 0 ? Math.round((wins / total) * 100) : 0
            };
        });
    }, [displayDeck?.stats?.statsByMatchup]);

    useEffect(() => {
        fetchDeckFromServer(deckId)
    }, [deckId]);

    const {
        aspectRatio,
        width,
    } = useLeaderCardFlipPreview({
        anchorElement,
        cardId: deckData?.leader.id,
        setPreviewImage,
        frontCardStyle: CardStyle.PlainLeader,
        backCardStyle: CardStyle.Plain,
        isDeployed: false,
        isLeader: anchorElement?.getAttribute('data-card-type') === 'leader',
        card: deckData?.leader ? {
            onStartingSide: undefined,
            id: deckData.leader.id
        } : undefined,
    });

    const fetchDeckFromServer = async (rawDeckId: string | string[]) => {
        if (rawDeckId) {
            // we need to check if the deck is still available
            const deckId = Array.isArray(rawDeckId) ? rawDeckId[0] : rawDeckId;
            setLoading(true);
            try {
                // we get the deck from localStorage and set the link
                let deckDataServer;
                if(user) {
                    deckDataServer = await getDeckFromServer(deckId, user);
                }else{
                    const deckDataJSON = localStorage.getItem('swu_deck_'+deckId);
                    if (deckDataJSON) {
                        deckDataServer = convertStoredToDeckDetailedData(JSON.parse(deckDataJSON) as StoredDeck);
                    }else{
                        throw new Error('Unknown deck data');
                    }
                }
                const data = await fetchDeckData(deckDataServer.deck.deckLink, false);
                setDeckData(data);
                setDisplayDeck(deckDataServer);
            } catch (error) {
                if (error instanceof Error) {
                    setErrorModalOpen(true);
                    if (error.message.includes('403')) {
                        setDeckErrorDetails({
                            [DeckValidationFailureReason.DeckSetToPrivate]: true,
                        });
                    } else {
                        setDeckErrorDetails('Couldn\'t import. Deck is invalid.');
                    }

                    return;
                }else{
                    setErrorModalOpen(true);
                    setDeckErrorDetails('Server error when attempting to retrieve deck: '+error);
                }
            } finally {
                setLoading(false);
            }
        }
    }

    const handleBackButton = () => {
        router.push('/DeckPage');
    };

    // Open delete confirmation dialog
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    // handle confirm delete
    const handleConfirmDelete = async () => {
        try {
            if (deckId) {
                if (typeof deckId === 'string') {
                    if(user){
                        const removedDecks = await deleteDecks([deckId], user)
                        removeDeckFromLocalStorage(removedDecks);
                    }else{
                        removeDeckFromLocalStorage([deckId])
                    }
                } else {
                    if(user){
                        const removedDecks = await deleteDecks(deckId, user)
                        removeDeckFromLocalStorage(removedDecks)
                    }else{
                        removeDeckFromLocalStorage(deckId)
                    }
                }
            }
            setDeleteDialogOpen(false);
            router.push('/DeckPage');
        }catch(err){
            setErrorModalOpen(true);
            setDeckErrorDetails('Error deleting deck/decks: '+err);
        }
    };

    // Cancel delete operation
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
    };

    const onCloseError = () => {
        setErrorModalOpen(false);
        router.push('/DeckPage');
    }

    const isSmallScreen = useMediaQuery('(max-width: 1280px)');

    // add near your other handlers
    const exportOpponentStatsCSV = () => {
        if (!opponentStats || opponentStats.length === 0) return;

        const header = [
            'OpponentLeader',
            'OpponentBase',
            'Wins',
            'Losses',
            'WinPercentage',
        ];
        const rows = opponentStats.map(s => [
            `"${s.leaderMelee}"`,
            `"${s.baseMelee}"`,
            s.wins,
            s.losses,
            `${s.winPercentage}`,
        ]);

        const csv = [header, ...rows].map(r => r.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const safeName = (deckData?.metadata.name || 'deck').replace(/[\\/:*?"<>|]/g, '_');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName}_opponent-stats.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const styles = {
        bodyRow:{
            height:'100%',
            width: '100%',
            gridTemplateColumns: isSmallScreen ? '99%' : '30rem calc(100% - 31rem)',
            display: 'grid',
            overflowY: 'auto',
        },
        deckMeta:{
            width: '30rem',
            height:'auto',
        },
        leaderBaseContainer:{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            pt: '8px',
        },
        boxGeneralStylingLeader: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundImage: deckData ? `url(${s3CardImageURL(deckData.leader, CardStyle.PlainLeader)})` : 'none',
            width: '14rem',
            height: '10.18rem',
            backgroundRepeat: 'no-repeat',
        },
        boxGeneralStylingBase: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundImage: deckData ? `url(${s3CardImageURL(deckData.base)})` : 'none',
            width: '14rem',
            height: '10.18rem',
            backgroundRepeat: 'no-repeat',
        },
        titleContainer:{
            width:'40rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: '7%',
            minHeight:'3rem',
        },
        titleText:{
            mb: '0px',
            fontSize: '1.4rem',
        },
        editBox:{
            width: '16px',
            height: '16px',
            backgroundImage:'url(/edit.svg)',
            ml:'10px',
            cursor: 'pointer',
        },
        deckButtons:{
            width: '100%',
            height:'7%',
            minHeight:'3rem',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'end',
        },
        sortBy:{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        sortText:{
            mb:'0px',
            minWidth:'65px'
        },
        deckContainer:{
            width: '100%',
            minWidth: '37rem',
        },
        deckGridStyle:{
            width: '100%',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            overflow:'auto',
        },

        // Example style blocks for stats
        statsContainer:{
            marginTop: '1rem',
            height:'69%',
            overflowY: 'auto',
        },
        overallStatsBox:{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem',
            ml:'5px',
        },
        gamesCircle:{
            width:'25px',
            height: '25px',
            mr:'15px',
            borderRadius: '50%',
        },
        gamesRow:{
            ml:'30px',
            display:'flex',
            flexDirection:'row',
            alignItems:'center',
            mb:'5px',
        },
        editButtons:{
            display:'flex',
            alignItems: 'center',
            justifyContent: 'end',
        },
        titleTextContainer:{
            ml:'10px',
            display:'flex',
            flexDirection: 'column',
            alignItems:'start',
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio,
            width,
            position: 'relative',
        },
        viewDeck:{
            width: !displayDeck || displayDeck.deck.source === 'SWUDB' ? '394px' : '429px',
            ml:'40px'
        },
        ctrlText: {
            bottom: '0px',
            display: 'flex',
            justifySelf: 'center',
            width: 'fit-content',
            height: '2rem',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            textShadow: `
                -1px -1px 0 #000,  
                 1px -1px 0 #000,
                -1px  1px 0 #000,
                 1px  1px 0 #000
            `
        },
        iconButton:{
            width:'fit-content',
            height:'30px',
            mt:'10px',
            ml:'-1px',
            color:'white',
            background: `linear-gradient(rgb(29, 29, 29), #0a3b4d) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
            '&:hover': {
                background: `linear-gradient(rgb(29, 29, 29),rgb(20, 65, 81)) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
            },
            '&:not(:disabled)': {
                borderColor: 'rgba(0, 140, 255, 0.4)',
                boxShadow: '0 0 6px rgba(0, 140, 255, 0.5)',
                border: '1px solid rgba(0, 140, 255, 0.5)',
            },
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Grid container sx={styles.bodyRow}>
                <Box sx={styles.deckMeta}>
                    {/* Title Row */}
                    <Box sx={styles.titleContainer}>
                        <PreferenceButton variant={'standard'} buttonFnc={handleBackButton}/>
                    </Box>

                    {/* Leader + Base */}
                    <Box sx={styles.leaderBaseContainer}>
                        <Box sx={styles.boxGeneralStylingLeader}
                            aria-owns={open ? 'mouse-over-popover' : undefined}
                            aria-haspopup="true"
                            onMouseEnter={handlePreviewOpen}
                            onMouseLeave={handlePreviewClose}
                            data-card-type="leader"
                            data-card-url={deckData ? s3CardImageURL(deckData.leader, CardStyle.PlainLeader) : ''}
                        />
                        <Box sx={styles.boxGeneralStylingBase}
                            aria-owns={open ? 'mouse-over-popover' : undefined}
                            aria-haspopup="true"
                            onMouseEnter={handlePreviewOpen}
                            onMouseLeave={handlePreviewClose}
                            data-card-type="base"
                            data-card-url={deckData ? s3CardImageURL(deckData.base) : ''}
                        />
                    </Box>
                    <Popover
                        id="mouse-over-popover"
                        sx={{ pointerEvents: 'none' }}
                        open={open}
                        anchorEl={anchorElement}
                        anchorOrigin={{
                            vertical: 'center',
                            horizontal: -5,
                        }}
                        transformOrigin={{
                            vertical: 'center',
                            horizontal: 'right',
                        }}
                        onClose={handlePreviewClose}
                        disableRestoreFocus
                        slotProps={{ paper: { sx: { backgroundColor: 'transparent' } } }}
                    >
                        <Box sx={{ ...styles.cardPreview, backgroundImage:`${previewImage}` }} >
                        </Box>
                        {anchorElement?.getAttribute('data-card-type') === 'leader' && (
                            <Typography variant={'body1'} sx={styles.ctrlText}
                            >CTRL: View Flipside</Typography>
                        )}
                    </Popover>
                    <Box sx={styles.titleTextContainer}>
                        <Typography variant="h3" sx={styles.titleText}>
                            {deckData?.metadata.name}
                        </Typography>
                        { opponentStats && (
                            <Box>
                                <Tooltip title="Download as CSV">
                                    <Button sx={styles.iconButton} onClick={exportOpponentStatsCSV}>
                                        Download Statistics CSV
                                    </Button>
                                </Tooltip>
                            </Box>
                        )}
                        {/* <Box sx={styles.editBox} />*/}
                    </Box>

                    {/* Stats go here */}
                    {(user && displayDeck) ? (
                        <Box sx={styles.statsContainer}>
                            <Box sx={styles.overallStatsBox}>
                                <PercentageCircle percentage={deckStats.winPercentage} size={70} strokeWidth={12} fillColor={'#6CF3D3'} trackColor={'#367684'} textColor="#FFF"/>
                                <Box>
                                    <Box sx={styles.gamesRow}>
                                        <Box sx={{ ...styles.gamesCircle, backgroundColor:'#367684' }} />
                                        <Typography variant={'h5'} sx={{ color: '#fff' }}>Games Played: {deckStats.totalGames}</Typography>
                                    </Box>
                                    <Box sx={styles.gamesRow}>
                                        <Box sx={{ ...styles.gamesCircle, backgroundColor:'#6CF3D3' }} />
                                        <Typography variant={'h5'}>Games Won: {deckStats.wins}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                            {opponentStats && (
                                <AnimatedStatsTable
                                    data={opponentStats}
                                    animationDuration={1000}
                                    staggerDelay={10}
                                />
                            )}
                        </Box>
                    ) : (
                        <Box sx={styles.statsContainer}>
                            <Typography variant="h5" sx={{ color: '#fff', textAlign: 'center', padding: 2 }}>
                                Deck statistics are only available to logged-in users.
                            </Typography>
                        </Box>
                    )}
                    {/* A table for Opposing Leaders, Wins, Losses, etc. */}

                </Box>

                {/* Right side: Sort dropdown & deck cards */}
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.deckButtons}>
                        <Box sx={styles.editButtons}>
                            <PreferenceButton variant={'concede'} text={'Delete'} buttonFnc={handleDeleteClick}/>
                        </Box>
                    </Box>
                    <Grid sx={styles.deckGridStyle}>
                        <DeckComponent mainDeck={deckData} />
                    </Grid>
                </Box>
                <ConfirmationDialog
                    open={deleteDialogOpen}
                    title="Delete"
                    message="Do you want to delete this deck?"
                    onCancel={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                />
                <ErrorModal
                    open={errorModalOpen}
                    onClose={onCloseError}
                    title={'Deck Error'}
                    errors={deckErrorDetails}
                />
            </Grid>
        </>
    );
};

export default DeckDetails;