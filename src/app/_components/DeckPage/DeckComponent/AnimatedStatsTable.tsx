import React, { useState, useEffect, useRef } from 'react';
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Typography,
    Box, Popover, PopoverOrigin,
    Tooltip
} from '@mui/material';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle, IMatchTableStats } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

interface AnimatedStatsTableProps {
    data: IMatchTableStats[];
    animationDuration?: number; // in ms
    staggerDelay?: number; // delay between row animations in ms
}

const AnimatedStatsTable: React.FC<AnimatedStatsTableProps> = ({
    data = [],
    animationDuration = 2000,
    staggerDelay = 100
}) => {
    // State for animated values
    const [animatedData, setAnimatedData] = useState<IMatchTableStats[]>([]);
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    // State to track if animation has started
    const [animationStarted, setAnimationStarted] = useState(false);

    // Refs for animation frames
    const animationFrames = useRef<number[]>([]);

    // Function to animate a counter
    const animateCounter = (start: number, end: number, progress: number) => {
        return Math.round(start + (end - start) * progress);
    };

    // Reset and start animations when data changes
    useEffect(() => {
        // Initialize the animated data
        const initialAnimatedData = data.map(item => ({
            ...item,
            wins: 0,
            losses: 0,
            winPercentage: 0,
            animationComplete: false
        }));

        setAnimatedData(initialAnimatedData);
        setAnimationStarted(true);

        // Cleanup function to cancel any ongoing animations
        return () => {
            animationFrames.current.forEach(frame => cancelAnimationFrame(frame));
        };
    }, [data]);

    // Handle animation after animation has started
    useEffect(() => {
        if (!animationStarted) return;

        // Clear any existing animations
        animationFrames.current.forEach(frame => cancelAnimationFrame(frame));
        animationFrames.current = [];

        // Start time for animation
        const startTime = performance.now();

        // Animate each row with a staggered delay
        data.forEach((rowData, rowIndex) => {
            const animateRow = () => {
                const currentTime = performance.now();
                const rowDelay = rowIndex * staggerDelay;

                // Only start animating this row after its delay
                if (currentTime - startTime < rowDelay) {
                    animationFrames.current.push(requestAnimationFrame(animateRow));
                    return;
                }

                // Calculate progress (0 to 1) for this row
                const rowStartTime = startTime + rowDelay;
                const elapsed = currentTime - rowStartTime;
                const progress = Math.min(elapsed / animationDuration, 1);

                // Update the animated values for this row
                setAnimatedData(prev => {
                    const newData = [...prev];

                    if (newData[rowIndex]) {
                        // Animate text for leader

                        // Animate counters
                        const animatedWins = animateCounter(0, rowData.wins, progress);
                        const animatedLosses = animateCounter(0, rowData.losses, progress);
                        const animatedWinPercentage = animateCounter(0, rowData.winPercentage, progress);

                        newData[rowIndex] = {
                            leaderId:rowData.leaderId,
                            baseId: rowData.baseId,
                            wins: animatedWins,
                            losses: animatedLosses,
                            winPercentage: animatedWinPercentage,
                            animationComplete: progress >= 1
                        };
                    }
                    return newData;
                });

                // Continue animation if not complete
                if (progress < 1) {
                    animationFrames.current.push(requestAnimationFrame(animateRow));
                }
            };

            // Start the animation for this row
            animationFrames.current.push(requestAnimationFrame(animateRow));
        });

        // Cleanup animation frames on unmount
        return () => {
            animationFrames.current.forEach(frame => cancelAnimationFrame(frame));
        };
    }, [animationStarted, data, animationDuration, staggerDelay]);
    // preview functions

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');

        if (!imageUrl) return;

        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        }, 500);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setPreviewImage(null);
    };

    const popoverConfig = (): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
        return {
            anchorOrigin:{
                vertical: 'center',
                horizontal: -5,
            },
            transformOrigin: {
                vertical: 'center',
                horizontal: 'right',
            } };
    }


    // ----------------------Styles-----------------------------//
    const styles = {
        tableContainer: {
            maxHeight: '45vh',
            width: '100%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column' as const,
            pr: '10px',
        },
        tableHead: {
            backgroundColor: '#333',
        },
        leaderBaseHolder:{
            display:'flex',
            alignItems:'center',
            height:'100%',
            width: 'calc(55% - 5px)'
        },
        CardSetContainerStyle:{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            width: '4.2rem',
            height: '4.1rem'
        },
        boxGeneralStyling: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width: '7rem',
            height: '4.18rem',
            backgroundImage: 'url(/leaders/boba.webp)',
            backgroundRepeat: 'no-repeat',
            textAlign: 'center' as const,
            color: 'white',
            display: 'flex',
            cursor: 'pointer',
            position: 'relative' as const,
        },
        boxBasicBaseStyling: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width: '3rem',
            height: '3rem',
            backgroundImage: 'url(/leaders/boba.webp)',
            backgroundRepeat: 'no-repeat',
            textAlign: 'center' as const,
            color: 'white',
            display: 'flex',
            cursor: 'pointer',
            position: 'relative' as const,
        },
        parentBoxStyling: {
            position:'absolute',
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1.4 / 1',
            width: '21rem',
        },
    };

    return (
        <Box sx={styles.tableContainer}>
            <Table stickyHeader>
                <TableHead sx={styles.tableHead}>
                    <TableRow>
                        <TableCell><Typography sx={{ color: '#fff' }}>Opponent</Typography></TableCell>
                        <TableCell><Typography sx={{ color: '#fff' }}>Wins</Typography></TableCell>
                        <TableCell><Typography sx={{ color: '#fff' }}>Losses</Typography></TableCell>
                        <TableCell><Typography sx={{ color: '#fff' }}>Win %</Typography></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {animatedData.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell sx={{ borderBottom: 'none' }}>
                                <Box sx={styles.leaderBaseHolder}>
                                    <Box sx={styles.CardSetContainerStyle}>
                                        {row.baseId?.startsWith('30hp') || row.baseId?.startsWith('28hp') ? (
                                            <Box>
                                                <Box sx={{ ...styles.parentBoxStyling, left: '55px', top: '10px', zIndex:'1' }}>
                                                    <Tooltip title={row.baseId?.startsWith('30') ? 'Basic 30hp base' : 'Basic 28hp force base'}>
                                                        <Box
                                                            sx={{ ...styles.boxBasicBaseStyling, backgroundImage: `url(/${row.baseId}.png)` }}
                                                        />
                                                    </Tooltip>
                                                </Box>
                                                <Box sx={{ ...styles.parentBoxStyling, left: '-30px', top: '0px',zIndex:'0' }}>
                                                    <Box
                                                        sx={{
                                                            ...styles.boxGeneralStyling,
                                                            backgroundImage: `url(${s3CardImageURL({ id: row.leaderId, count: 0 }, CardStyle.PlainLeader)})`,
                                                        }}
                                                        onMouseEnter={handlePreviewOpen}
                                                        onMouseLeave={handlePreviewClose}
                                                        data-card-url={s3CardImageURL({ id: row.leaderId, count: 0 }, CardStyle.PlainLeader)}
                                                    />
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Box>
                                                <Box sx={{ ...styles.parentBoxStyling, left: '20px', top: '0px',zIndex:'0' }}>
                                                    <Box
                                                        sx={{
                                                            ...styles.boxGeneralStyling,
                                                            backgroundImage: `url(${s3CardImageURL({ id: row.baseId, count: 0 })})`,
                                                        }}
                                                        onMouseEnter={handlePreviewOpen}
                                                        onMouseLeave={handlePreviewClose}
                                                        data-card-url={s3CardImageURL({ id: row.baseId, count: 0 })}
                                                    />
                                                </Box>
                                                <Box sx={{ ...styles.parentBoxStyling, left: '-30px', top: '14px',zIndex:'0' }}>
                                                    <Box
                                                        sx={{
                                                            ...styles.boxGeneralStyling,
                                                            backgroundImage: `url(${s3CardImageURL({ id: row.leaderId, count: 0 }, CardStyle.PlainLeader)})`,
                                                        }}
                                                        onMouseEnter={handlePreviewOpen}
                                                        onMouseLeave={handlePreviewClose}
                                                        data-card-url={s3CardImageURL({ id: row.leaderId, count: 0 }, CardStyle.PlainLeader)}
                                                    />
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ borderBottom:'none' }}>
                                <Typography sx={{ color: '#fff' }}>{row.wins}</Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom:'none' }}>
                                <Typography sx={{ color: '#fff' }}>{row.losses}</Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom:'none' }}>
                                <Typography sx={{ color: '#fff' }}>{row.winPercentage}%</Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
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
                    <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
                </Popover>
            </Table>
        </Box>
    );
};

export default AnimatedStatsTable;