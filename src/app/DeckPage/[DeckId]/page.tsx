'use client';
import React, { ChangeEvent, useState, useEffect, useMemo } from 'react';
import {
    Box, MenuItem, Popover, Typography, useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeckComponent from '@/app/_components/DeckPage/DeckComponent/DeckComponent';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { useRouter, useParams } from 'next/navigation';
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
import { removeDeckFromLocalStorage } from '@/app/_utils/LocalStorageUtils';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

const sortByOptions: string[] = ['Cost','Power','Most played'];

// Interface for saved decks
interface StoredDeck {
    leader: { id: string };
    base: { id: string };
    name: string;
    favourite: boolean;
    deckID: string;
    deckLink: string;
    source: 'SWUSTATS' | 'SWUDB'
}

const DeckDetails: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('');
    const router = useRouter();
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
    const [displayDeck, setDisplayDeck ] = useState<StoredDeck | null>(null);

    // State for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

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
        setAnchorElement(null);
    };

    // example data
    const opponentData = useMemo(() => {
        // List of sample leader names
        const leaderNames = [
            'Ahsoka Tano', 'Boba Fett', 'Captain Rex', 'Darth Maul',
            'Emperor Palpatine', 'General Grievous', 'Han Solo', 'Leia Organa',
            'Luke Skywalker', 'Mace Windu', 'Obi-Wan Kenobi', 'Qui-Gon Jinn',
            'Rey Skywalker', 'Thrawn', 'Yoda', 'Darth Vader',
            'Kylo Ren', 'Ezra Bridger', 'Kanan Jarrus', 'Asajj Ventress'
        ];

        return leaderNames.sort().map(leader => {
            const wins = Math.floor(Math.random() * 10);
            const losses = Math.floor(Math.random() * 10);
            const total = wins + losses;
            const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0;

            return {
                leader,
                wins,
                losses,
                winPercentage
            };
        });
    }, []);

    useEffect(() => {
        if (deckId) {
            (async () => {
                try {
                    // we get the deck from localStorage and set the link
                    const deckDataJSON = localStorage.getItem('swu_deck_'+deckId);
                    if (deckDataJSON) {
                        const deckData = JSON.parse(deckDataJSON) as StoredDeck;

                        // we need to check if the deck is still available
                        try {
                            const data = await fetchDeckData(deckData.deckLink, false);
                            setDeckData(data);
                            setDisplayDeck(deckData);
                        }catch (error) {
                            // check if its set to private
                            if(error instanceof Error){
                                setErrorModalOpen(true);
                                if(error.message.includes('403')) {
                                    setDeckErrorDetails({
                                        [DeckValidationFailureReason.DeckSetToPrivate]: true,
                                    });
                                }else{
                                    setDeckErrorDetails('Couldn\'t import. Deck is invalid.');
                                }
                                return;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching deck data:', error);
                }
            })();
        }
    }, [deckId]);

    const handleBackButton = () => {
        router.push('/DeckPage');
    };

    const handleViewOnSWUDB = () => {
        if (deckId) {
            window.open(displayDeck?.deckLink, '_blank');
        }
    };

    // Open delete confirmation dialog
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    // handle confirm delete
    const handleConfirmDelete = () => {
        if (deckId) {
            removeDeckFromLocalStorage(deckId)
        }
        setDeleteDialogOpen(false);
        router.push('/DeckPage');
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
            justifyContent: 'space-between',
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
            aspectRatio: '1.4 / 1',
            width: '21rem',
        },
        viewDeck:{
            width: !displayDeck || displayDeck.source === 'SWUDB' ? '394px' : '429px',
            ml:'40px'
        }
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
                            data-card-url={deckData ? s3CardImageURL(deckData.leader, CardStyle.PlainLeader) : ''}
                        />
                        <Box sx={styles.boxGeneralStylingBase}
                            aria-owns={open ? 'mouse-over-popover' : undefined}
                            aria-haspopup="true"
                            onMouseEnter={handlePreviewOpen}
                            onMouseLeave={handlePreviewClose}
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
                        <Box sx={{ ...styles.cardPreview, backgroundImage:`${previewImage}` }} />
                    </Popover>
                    <Box sx={styles.titleTextContainer}>
                        <Typography variant="h3" sx={styles.titleText}>
                            {deckData?.metadata.name}
                        </Typography>
                        <Box sx={styles.editBox} />
                    </Box>

                    {/* Stats go here
                    <Box sx={styles.statsContainer}>
                        <Box sx={styles.overallStatsBox}>
                            <PercentageCircle percentage={30} size={70} strokeWidth={12} fillColor={'#6CF3D3'} trackColor={'#367684'} textColor="#FFF"/>
                            <Box>
                                <Box sx={styles.gamesRow}>
                                    <Box sx={{ ...styles.gamesCircle, backgroundColor:'#367684' }} />
                                    <Typography variant={'h5'} sx={{ color: '#fff' }}>Games Played: 55</Typography>
                                </Box>
                                <Box sx={styles.gamesRow}>
                                    <Box sx={{ ...styles.gamesCircle, backgroundColor:'#6CF3D3' }} />
                                    <Typography variant={'h5'}>Games Won: 30</Typography>
                                </Box>
                            </Box>
                        </Box>
                        {/* A table for Opposing Leaders, Wins, Losses, etc.
                        <AnimatedStatsTable
                            data={opponentData}
                            animationDuration={2000}
                            staggerDelay={100}
                        />
                    </Box>
                    */}
                </Box>

                {/* Right side: Sort dropdown & deck cards */}
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.deckButtons}>
                        <Box sx={styles.sortBy}>
                            <Typography sx={styles.sortText}>Sort by</Typography>
                            <StyledTextField
                                select
                                disabled
                                value={sortBy}
                                placeholder="Sort by"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setSortBy(e.target.value)
                                }
                            >
                                {sortByOptions.map((sortOption) => (
                                    <MenuItem key={sortOption} value={sortOption}>
                                        {sortOption}
                                    </MenuItem>
                                ))}
                            </StyledTextField>
                            <Box sx={styles.viewDeck}>
                                <PreferenceButton variant={'standard'} text={!displayDeck || displayDeck.source === 'SWUDB' ? 'View Deck on SWUDB' : 'View Deck on SWUStats'} buttonFnc={handleViewOnSWUDB} />
                            </Box>
                        </Box>
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