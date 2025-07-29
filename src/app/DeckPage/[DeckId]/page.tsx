'use client';
import React, { useEffect, useState } from 'react';
import { Box, Popover, Typography, useMediaQuery } from '@mui/material';
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
    IDeckPageStats,
    IDeckStats,
    IMatchTableStats,
    IMatchupStatEntity,
    StoredDeck
} from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { useUser } from '@/app/_contexts/User.context';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';

const DeckDetails: React.FC = () => {
    const router = useRouter();
    const { user } = useUser();
    const [deckData, setDeckData] = useState<IDeckData | undefined>(undefined);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [deckStats, setDeckStats] = React.useState<IDeckPageStats>({ wins: 0, winPercentage: 0, draws: 0, losses: 0, totalGames: 0 });
    const [opponentStats, setOpponentStats] = React.useState<IMatchTableStats[] | null>(null);
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

    const calculateStats = (deckDataStats: IDeckStats | undefined) => {
        const totalGames = deckDataStats ? deckDataStats.wins + deckDataStats.losses + deckDataStats.draws : 0;
        const winPercentage = totalGames > 0 && deckDataStats ? Math.round((deckDataStats?.wins / totalGames) * 100) : 0;
        const calculatedStats: IDeckPageStats = {
            wins: deckDataStats?.wins ?? 0,
            losses: deckDataStats?.losses ?? 0,
            draws: deckDataStats?.draws ?? 0,
            totalGames,
            winPercentage
        }
        setDeckStats(calculatedStats);
    }

    /**
     * Formats opponent statistics with additional calculated fields
     * @param opponentStats Array of opponent stats from the database
     * @returns Formatted stats with added total and winPercentage fields
     */
    const getFormattedOpponentStats = (opponentStats: IMatchupStatEntity[] | undefined) => {
        if (!opponentStats || !Array.isArray(opponentStats)) {
            return [];
        }

        const oppStats = opponentStats.map(stat => {
            const wins = stat.wins || 0;
            const losses = stat.losses || 0;
            const draws = stat.draws || 0;
            const total = wins + losses + draws;
            const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0;

            return {
                leaderId: stat.leaderId,
                baseId: stat.baseId,
                wins,
                losses,
                draws,
                total,
                winPercentage
            };
        });
        setOpponentStats(oppStats);
    };

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
                calculateStats(deckDataServer.stats);
                getFormattedOpponentStats(deckDataServer.stats?.statsByMatchup);
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
            flexDirection: 'row',
            alignItems:'center',
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
                                    animationDuration={2000}
                                    staggerDelay={100}
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