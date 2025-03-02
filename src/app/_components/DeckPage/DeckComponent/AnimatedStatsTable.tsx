import React, { useState, useEffect, useRef } from 'react';
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Typography,
    Box
} from '@mui/material';

// Interface for our table data
interface OpponentStats {
    leader: string;
    wins: number;
    losses: number;
    winPercentage: number;
}

interface AnimatedStatsTableProps {
    data: OpponentStats[];
    animationDuration?: number; // in ms
    staggerDelay?: number; // delay between row animations in ms
}

const AnimatedStatsTable: React.FC<AnimatedStatsTableProps> = ({
    data = [],
    animationDuration = 2000,
    staggerDelay = 100
}) => {
    // State for animated values
    const [animatedData, setAnimatedData] = useState<Array<{
        leader: string;
        wins: number;
        losses: number;
        winPercentage: number;
        animationComplete: boolean;
    }>>([]);

    // State to track if animation has started
    const [animationStarted, setAnimationStarted] = useState(false);

    // Refs for animation frames
    const animationFrames = useRef<number[]>([]);

    // Characters for text scrambling effect
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Function to generate scrambled text
    const generateScrambledText = (targetText: string, progress: number) => {
        // If animation is complete, return the final text
        if (progress >= 1) return targetText;

        // Calculate how many characters should be revealed
        const revealedChars = Math.floor(targetText.length * progress);

        // Build the result string
        let result = '';
        for (let i = 0; i < targetText.length; i++) {
            if (i < revealedChars) {
                // This character is revealed
                result += targetText[i];
            } else if (targetText[i] === ' ') {
                // Preserve spaces
                result += ' ';
            } else {
                // Replace with random character
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }

        return result;
    };

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
                        const scrambledLeader = generateScrambledText(rowData.leader, progress);

                        // Animate counters
                        const animatedWins = animateCounter(0, rowData.wins, progress);
                        const animatedLosses = animateCounter(0, rowData.losses, progress);
                        const animatedWinPercentage = animateCounter(0, rowData.winPercentage, progress);

                        newData[rowIndex] = {
                            leader: scrambledLeader,
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

    const styles = {
        tableContainer: {
            height: '100%',
            maxHeight: '25vh',
            width: '100%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column' as const,
            pr: '10px',
        },
        tableWrapper: {
            overflowY: 'auto' as const,
            flex: '1 1 auto',
        },
        tableHead: {
            backgroundColor: '#333',
        }
    };

    return (
        <Box sx={styles.tableContainer}>
            <Table stickyHeader>
                <TableHead sx={styles.tableHead}>
                    <TableRow>
                        <TableCell><Typography sx={{ color: '#fff' }}>Opposing Leader</Typography></TableCell>
                        <TableCell><Typography sx={{ color: '#fff' }}>Wins</Typography></TableCell>
                        <TableCell><Typography sx={{ color: '#fff' }}>Losses</Typography></TableCell>
                        <TableCell><Typography sx={{ color: '#fff' }}>Win %</Typography></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {animatedData.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Typography sx={{ color: '#fff' }}>{row.leader}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography sx={{ color: '#fff' }}>{row.wins}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography sx={{ color: '#fff' }}>{row.losses}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography sx={{ color: '#fff' }}>{row.winPercentage}%</Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default AnimatedStatsTable;